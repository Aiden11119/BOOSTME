const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');
const { GoogleGenAI } = require('@google/genai');

// Load all available API keys
const apiKeys = [];
if (process.env.GEMINI_API_KEY) apiKeys.push(process.env.GEMINI_API_KEY);
if (process.env.GEMINI_API_KEY_2) apiKeys.push(process.env.GEMINI_API_KEY_2);
if (process.env.GEMINI_API_KEY_3) apiKeys.push(process.env.GEMINI_API_KEY_3);
if (process.env.GEMINI_API_KEY_4) apiKeys.push(process.env.GEMINI_API_KEY_4);

if (apiKeys.length === 0) {
  console.warn("WARNING: No GEMINI_API_KEY found in environment variables. Chatbot will not work.");
}

// Helper to generate content with fallback
async function generateWithFallback(contents) {
  if (apiKeys.length === 0) throw new Error('API Keys not configured.');
  
  let lastError;
  for (let i = 0; i < apiKeys.length; i++) {
    try {
      const ai = new GoogleGenAI({ apiKey: apiKeys[i] });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          tools: tools,
          temperature: 0.7,
        }
      });
      return response; // Success, return response immediately
    } catch (error) {
      console.warn(`API Key ${i + 1} failed: ${error.message}`);
      lastError = error;
      // If it's not a rate limit / quota error, we might still want to try the next key, 
      // but usually 429 Resource Exhausted or 400 API key not valid are the ones to fall back on.
      // We will blindly fallback to the next key for maximum resilience.
      if (i < apiKeys.length - 1) {
        console.log(`Switching to backup API Key ${i + 2}...`);
      }
    }
  }
  throw lastError; // All keys failed
}

// Helper to generate content stream with fallback
async function generateStreamWithFallback(contents) {
  if (apiKeys.length === 0) throw new Error('API Keys not configured.');
  
  let lastError;
  for (let i = 0; i < apiKeys.length; i++) {
    try {
      const ai = new GoogleGenAI({ apiKey: apiKeys[i] });
      const stream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          tools: tools,
          temperature: 0.7,
        }
      });
      return stream; // Success, return stream immediately
    } catch (error) {
      console.warn(`API Key ${i + 1} stream failed: ${error.message}`);
      lastError = error;
      if (i < apiKeys.length - 1) {
        console.log(`Switching to backup API Key ${i + 2} for streaming...`);
      }
    }
  }
  throw lastError; // All keys failed
}

const systemInstruction = `
You are the official AI Counselor and Assistant for the "BoostMe" app.
Your goals:
1. Provide empathetic, supportive, and kind counseling to students who are stressed, sad, or have academic/personal issues.
2. Recommend suitable mentors based on the student's issues. Use the 'get_mentors' tool to find a mentor whose 'specialty_description' matches their needs.
3. Help students book an appointment. If they want to book, use 'get_mentor_slots' to show available times, and then 'book_appointment' to confirm it.
4. ONLY answer questions related to student wellbeing, academic issues, and the BoostMe app. If a student asks about completely unrelated topics (like food recipes, coding a separate app, or general trivia), politely decline and remind them you are here for counseling and mentorship.

IMPORTANT INSTRUCTION REGARDING ACADEMIC DATA:
When you retrieve a student's course information (midterm score, quiz average, assignments), remember that these are PAST events. DO NOT tell the student to "improve their midterm score" or "improve their quizzes", because they have already been taken and graded. Instead, tell them to focus on understanding where they went wrong in those past assessments so they can improve their FUTURE performance on final exams, upcoming assignments, or overall mastery of the subject. 

When returning slot times to the user, present them nicely.
If you call a tool, wait for the result before giving your final answer.
`;

const tools = [{
  functionDeclarations: [
    {
      name: 'get_mentors',
      description: 'Fetch the list of all available mentors, including their names, IDs, and specialties.',
    },
    {
      name: 'get_mentor_slots',
      description: 'Fetch available appointment slots for a specific mentor.',
      parameters: {
        type: 'OBJECT',
        properties: {
          mentor_id: { type: 'INTEGER', description: 'The ID of the mentor' }
        },
        required: ['mentor_id']
      }
    },
    {
      name: 'book_appointment',
      description: 'Book an appointment slot for the student. Always ask for the user to confirm the slot before calling this.',
      parameters: {
        type: 'OBJECT',
        properties: {
          mentor_id: { type: 'INTEGER', description: 'The ID of the mentor' },
          slot_id: { type: 'INTEGER', description: 'The ID of the appointment slot' },
          appointment_date: { type: 'STRING', description: 'The date of the slot in YYYY-MM-DD' },
          start_time: { type: 'STRING', description: 'The start time of the slot' },
          end_time: { type: 'STRING', description: 'The end time of the slot' }
        },
        required: ['mentor_id', 'slot_id', 'appointment_date', 'start_time', 'end_time']
      }
    },
    {
      name: 'get_student_course_info',
      description: "Fetch the student's attendance, midterm score, and other marks for a specific course to give personalized advice.",
      parameters: {
        type: 'OBJECT',
        properties: {
          course_name: { type: 'STRING', description: 'The name of the course (e.g., Information Technology, Data Science, Math)' }
        },
        required: ['course_name']
      }
    },
    {
      name: 'get_my_appointments',
      description: "Fetch the student's currently booked appointments with mentors (pending or confirmed).",
    },
    {
      name: 'cancel_appointment',
      description: 'Cancel a booked appointment for the student using the appointment_id.',
      parameters: {
        type: 'OBJECT',
        properties: {
          appointment_id: { type: 'INTEGER', description: 'The ID of the appointment to cancel' }
        },
        required: ['appointment_id']
      }
    }
  ]
}];

// Helper to execute local DB functions
async function handleToolCall(functionCall, studentId) {
  const { name, args } = functionCall;
  
  try {
    if (name === 'get_mentors') {
      const [mentors] = await pool.query('SELECT id, full_name, email, specialty_description FROM users WHERE role = "mentor"');
      return { result: mentors };
    }
    
    if (name === 'get_mentor_slots') {
      const mentorId = args.mentor_id;
      const [slots] = await pool.query(
        "SELECT appointment_id as slot_id, DATE_FORMAT(appointment_date, '%Y-%m-%d') as appointment_date, start_time, end_time FROM appointments WHERE mentor_id = ? AND status = 'available' AND student_id IS NULL AND appointment_date >= CURDATE() ORDER BY appointment_date, start_time LIMIT 10",
        [mentorId]
      );
      if (slots.length === 0) return { result: 'No available slots for this mentor currently.' };
      return { result: slots };
    }

    if (name === 'book_appointment') {
      const { mentor_id, slot_id, appointment_date, start_time, end_time } = args;
      
      // Verify slot is still available
      const [slots] = await pool.query('SELECT * FROM appointments WHERE appointment_id = ? AND status = "available" AND student_id IS NULL', [slot_id]);
      if (slots.length === 0) {
        return { error: 'Sorry, that slot is no longer available. Please choose another.' };
      }

      // Book it
      await pool.query('UPDATE appointments SET student_id = ?, status = "pending" WHERE appointment_id = ?', [studentId, slot_id]);
      
      return { 
        result: 'Successfully booked!', 
        details: { mentor_id, appointment_date, start_time, end_time, status: 'pending' } 
      };
    }

    if (name === 'get_student_course_info') {
      const { course_name } = args;
      // Get student_id_number from users table
      const [users] = await pool.query('SELECT student_id_number FROM users WHERE id = ?', [studentId]);
      if (users.length === 0 || !users[0].student_id_number) {
        return { error: 'Student ID number not found in profile.' };
      }
      const studentIdNumber = users[0].student_id_number;
      
      // Query course marks
      const [marks] = await pool.query(
        'SELECT course_name, attendance_rate, midterm_score, assignments_avg, quizzes_avg FROM student_course_marks WHERE student_id_number = ? AND course_name LIKE ?',
        [studentIdNumber, `%${course_name}%`]
      );
      
      if (marks.length === 0) {
        return { result: `No records found for course matching '${course_name}'.` };
      }
      return { result: marks[0] };
    }

    if (name === 'get_my_appointments') {
      const [appointments] = await pool.query(`
        SELECT a.appointment_id, DATE_FORMAT(a.appointment_date, '%Y-%m-%d') as appointment_date, a.start_time, a.end_time, a.status, u.full_name as mentor_name 
        FROM appointments a 
        JOIN users u ON a.mentor_id = u.id 
        WHERE a.student_id = ? AND a.status IN ('pending', 'confirmed') 
        ORDER BY a.appointment_date, a.start_time
      `, [studentId]);
      
      if (appointments.length === 0) return { result: 'You have no booked appointments.' };
      return { result: appointments };
    }

    if (name === 'cancel_appointment') {
      const { appointment_id } = args;
      const [result] = await pool.query(
        'UPDATE appointments SET student_id = NULL, status = "available" WHERE appointment_id = ? AND student_id = ?',
        [appointment_id, studentId]
      );
      if (result.affectedRows === 0) {
        return { error: 'Failed to cancel. Either the appointment does not exist, or it is not yours.' };
      }
      return { result: `Appointment ${appointment_id} successfully cancelled.` };
    }
  } catch (err) {
    console.error('Tool call error:', err);
    return { error: 'Database error while executing ' + name };
  }
  
  return { error: 'Unknown function' };
}

router.get('/history', verifyToken, verifyRole(['student']), async (req, res) => {
  const studentId = req.user.userId;
  try {
    const [messages] = await pool.query(
      'SELECT role, message_text as text FROM chat_messages WHERE student_id = ? ORDER BY created_at ASC',
      [studentId]
    );
    res.json(messages);
  } catch (err) {
    console.error('Error fetching chat history:', err);
    res.status(500).json({ message: 'Failed to fetch history' });
  }
});

router.delete('/history', verifyToken, verifyRole(['student']), async (req, res) => {
  const studentId = req.user.userId;
  try {
    await pool.query('DELETE FROM chat_messages WHERE student_id = ?', [studentId]);
    res.json({ message: 'Chat history cleared. New session started.' });
  } catch (err) {
    console.error('Error clearing chat history:', err);
    res.status(500).json({ message: 'Failed to clear history' });
  }
});

router.post('/chat', verifyToken, verifyRole(['student']), async (req, res) => {
  if (apiKeys.length === 0) {
    return res.status(500).json({ message: 'AI API Key is not configured on the server.' });
  }

  const { message } = req.body;
  const studentId = req.user.userId;

  try {
    // Save user message to DB
    await pool.query('INSERT INTO chat_messages (student_id, role, message_text) VALUES (?, "user", ?)', [studentId, message]);

    // Fetch history from DB
    const [historyRows] = await pool.query(
      'SELECT role, message_text as text FROM chat_messages WHERE student_id = ? ORDER BY created_at ASC',
      [studentId]
    );

    // Reconstruct conversation history for Gemini
    let contents = historyRows.map(msg => ({
        role: msg.role === 'ai' ? 'model' : 'user',
        parts: [{ text: msg.text }]
    }));

    let isDone = false;
    let finalResponseText = '';
    let loopCount = 0;

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    while (!isDone && loopCount < 5) {
      loopCount++;
      const stream = await generateStreamWithFallback(contents);
      
      let hasFunctionCall = false;
      let functionCallToHandle = null;
      let textBeforeFunctionCall = '';

      for await (const chunk of stream) {
        if (chunk.functionCalls && chunk.functionCalls.length > 0) {
          hasFunctionCall = true;
          functionCallToHandle = chunk.functionCalls[0];
          // Even if there's a function call in this chunk, it might also contain text.
          if (chunk.text) {
            textBeforeFunctionCall += chunk.text;
            finalResponseText += chunk.text;
            res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
          }
          break; // Stop streaming this response, we need to handle the tool
        }
        
        if (chunk.text) {
          textBeforeFunctionCall += chunk.text;
          finalResponseText += chunk.text;
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }

      if (hasFunctionCall && functionCallToHandle) {
        // AI decided to call a function
        const parts = [];
        if (textBeforeFunctionCall) {
            parts.push({ text: textBeforeFunctionCall });
        }
        parts.push({ functionCall: functionCallToHandle });

        contents.push({
            role: 'model',
            parts: parts
        });

        // Execute function
        const toolResult = await handleToolCall(functionCallToHandle, studentId);

        // Send function response back to AI
        contents.push({
            role: 'user',
            parts: [{
                functionResponse: {
                    name: functionCallToHandle.name,
                    response: toolResult
                }
            }]
        });
      } else {
        // Stream completed successfully with text
        isDone = true;
      }
    }
    
    if (!isDone) {
      const errorMsg = "I encountered an issue processing your request (too many tool calls). Please try asking in a different way.";
      finalResponseText = errorMsg;
      res.write(`data: ${JSON.stringify({ text: errorMsg })}\n\n`);
    }

    // End the SSE stream
    res.write('data: [DONE]\n\n');
    res.end();

    // Save AI response to DB
    await pool.query('INSERT INTO chat_messages (student_id, role, message_text) VALUES (?, "ai", ?)', [studentId, finalResponseText]);

  } catch (error) {
    console.error('Gemini Chat Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to communicate with AI', error: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Failed to communicate with AI' })}\n\n`);
      res.end();
    }
  }
});

module.exports = router;
