require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const apiKeys = [];
if (process.env.GEMINI_API_KEY) apiKeys.push(process.env.GEMINI_API_KEY);
if (process.env.GEMINI_API_KEY_2) apiKeys.push(process.env.GEMINI_API_KEY_2);
if (process.env.GEMINI_API_KEY_3) apiKeys.push(process.env.GEMINI_API_KEY_3);
if (process.env.GEMINI_API_KEY_4) apiKeys.push(process.env.GEMINI_API_KEY_4);

async function test() {
  for (let i = 0; i < apiKeys.length; i++) {
    try {
      console.log(`Testing key ${i+1}...`);
      const ai = new GoogleGenAI({ apiKey: apiKeys[i] });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'hi'
      });
      console.log(`Key ${i+1} SUCCESS! Response:`, response.text);
      return;
    } catch (e) {
      console.error(`Key ${i+1} FAILED:`, e.message);
    }
  }
  console.log("ALL KEYS FAILED.");
}
test();
