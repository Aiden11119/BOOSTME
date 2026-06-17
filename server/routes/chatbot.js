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

const systemInstruction = `
You are the official AI Counselor and Assistant for the "BoostMe" app.
Your goals:
1. Provide empathetic, supportive, and kind counseling to students who are stressed, sad, or have academic/personal issues.
2. Recommend suitable mentors based on the student's issues. Use the 'get_mentors' tool to find a mentor whose 'specialty_description' matches their needs.
3. Help students book an appointment. If they want to book, use 'get_mentor_slots' to show available times, and then 'book_appointment' to confirm it.
4. ONLY answer questions related to student wellbeing, academic issues, and the BoostMe app. If a student asks about completely unrelated topics (like food recipes, coding a separate app, or general trivia), politely decline and remind them you are here for counseling and mentorship.

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

    while (!isDone && loopCount < 3) {
      loopCount++;
      // Use our fallback helper instead of the single ai instance
      const response = await generateWithFallback(contents);

      const functionCalls = response.functionCalls;
      
      if (functionCalls && functionCalls.length > 0) {
        // AI decided to call a function
        const functionCall = functionCalls[0]; // Handle the first one for simplicity
        
        // Add model's function call to history
        contents.push({
            role: 'model',
            parts: [{ functionCall: functionCall }]
        });

        // Execute function
        const toolResult = await handleToolCall(functionCall, studentId);

        // Send function response back to AI
        contents.push({
            role: 'user',
            parts: [{
                functionResponse: {
                    name: functionCall.name,
                    response: toolResult
                }
            }]
        });
        
        // Loop continues, AI will generate the next response based on tool result
      } else {
        // AI generated text response
        finalResponseText = response.text;
        isDone = true;
      }
    }
    
    if (!isDone) {
      finalResponseText = "I encountered an issue processing your request (too many tool calls). Please try asking in a different way.";
    }

    // Save AI response to DB
    await pool.query('INSERT INTO chat_messages (student_id, role, message_text) VALUES (?, "ai", ?)', [studentId, finalResponseText]);

    res.json({ reply: finalResponseText });

  } catch (error) {
    console.error('Gemini Chat Error:', error);
    res.status(500).json({ message: 'Failed to communicate with AI', error: error.message });
  }
});

module.exports = router;
