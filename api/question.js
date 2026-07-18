import { GoogleGenAI } from '@google/generative-ai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
  // Enforce global wildcard CORS allowances cleanly
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { difficulty, topic, location } = req.body;

    const systemInstruction = `
      You are an adaptive, supportive AI assistant for Taiwan elementary students playing "Ice Boy's Transformation".
      
      CORE MISSION:
      Generate multiple-choice questions or scenarios based on the book "Ice Boy" by David Ezra Stein and water science (States of matter: Solid, Liquid, Gas).
      
      VOCABULARY CONSTRAINT:
      - For "easy" and "normal" difficulties, use 80% words directly from the original "Ice Boy" book (e.g., "edges began to blur", "rolled in water", "basked", "freezing", "steam").
      - If difficulty is "hard", use more advanced concepts like "Density", "Absorb/Pores", or "Freezing point depression with salt".

      GAME MECHANICS:
      - You must output EXACTLY three choices matching these state options:
        1. "freeze into ice" / "結冰成固體"
        2. "melt into water" / "融化成液體"
        3. "evaporate into steam" / "蒸發成氣體"
      
      OUTPUT FORMAT:
      You MUST respond ONLY with a valid JSON object matching this schema exactly, no markdown formatting, no backticks:
      {
        "question_en": "String (Simple English matching current location context)",
        "question_zh": "String (Traditional Chinese 台灣繁體中文語體)",
        "choices": [
          { "en": "freeze into ice", "zh": "結冰成固體" },
          { "en": "melt into water", "zh": "融化成液體" },
          { "en": "evaporate into steam", "zh": "蒸發成氣體" }
        ],
        "answer": Number (0-2 index of the correct choice),
        "explanation_en": "String",
        "explanation_zh": "String"
      }
    `;

    const model = ai.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `Generate a ${difficulty} difficulty question about ${topic} in location ${location}.` }] }],
      systemInstruction: systemInstruction
    });

    return res.status(200).json(JSON.parse(result.response.text().trim()));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}