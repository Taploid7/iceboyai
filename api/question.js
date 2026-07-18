// api/question.js - Vercel Serverless AI Router with CORS Support
import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  // 1. Establish Allowed CORS Headers to fix browser blocks
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allows cross-origin connection sharing globally
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle browser CORS preflight check requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Must submit an event POST request.' });
  }

  try {
    const { difficulty, location, state } = req.body || {};

    if (!location || !state) {
      return res.status(400).json({ error: 'Missing mandatory request criteria: location and state keys required.' });
    }

    // Initialize the AI system using your secure environment variable token
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemPrompt = `
      You are a fun science game generator for kids. Generate a multiple choice question based on the user's location and state change.
      You MUST respond ONLY with a raw JSON object containing these exact fields:
      {
        "question_en": "string",
        "question_zh": "string",
        "choices": [
          {"en": "freeze into ice", "zh": "結冰成固體"},
          {"en": "melt into water", "zh": "融化成液體"},
          {"en": "evaporate into steam", "zh": "蒸發成氣體"}
        ],
        "answer": number (0 for freeze, 1 for melt, 2 for evaporate based on matching the 'state' argument),
        "explanation_en": "string",
        "explanation_zh": "string"
      }
    `;

    const userPrompt = `Location: ${location}, Environment Phase Shift Target: ${state}, Applied Scaling Difficulty: ${difficulty || 'normal'}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        // Enforces output as structural JSON
        responseMimeType: 'application/json'
      }
    });

    const aiText = response.text;
    const cleanJson = JSON.parse(aiText.trim());

    // Send valid structural JSON directly to client application
    return res.status(200).json(cleanJson);

  } catch (error) {
    console.error("AI Generation pipeline error:", error);
    return res.status(500).json({ 
      error: 'Failed to generate question', 
      details: error.message 
    });
  }
}