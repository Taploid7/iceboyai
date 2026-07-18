import { GoogleGenAI } from '@google/generative-ai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
  // Capture the incoming source request origin dynamically to handle CORS safely
  const origin = req.headers.origin || '*';
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', origin); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { difficulty, topic, location } = req.body;

    // Calculate exact correct target indices matching local indices array
    let determinedIndex = 1; // melt
    if (topic === "freeze") determinedIndex = 0;
    if (topic === "evaporate") determinedIndex = 2;

    const systemInstruction = `
      You are an adaptive, supportive AI assistant for Taiwan elementary students playing "Ice Boy's Transformation".
      
      CORE MISSION:
      Generate multiple-choice questions based on the book "Ice Boy" by David Ezra Stein and water science states (Solid, Liquid, Gas).
      
      VOCABULARY CONSTRAINT:
      - Use natural Traditional Chinese common in Taiwan (台灣繁體中文語體).
      - For "easy" and "normal" difficulties, use words from the book ("edges began to blur", "basked", "steam").
      - For "hard", introduce topics like "Density" or "Freezing point depression".

      GAME MECHANICS ANSWER FORCE:
      You MUST return the exact answer index as ${determinedIndex} to match the scientific location reality of "${topic}".
      
      OUTPUT FORMAT:
      Return ONLY a valid raw JSON object. No markdown, no backticks (\`\`\`):
      {
        "question_en": "String (Contextualized question text)",
        "question_zh": "String (台灣繁體中文翻譯)",
        "choices": [
          { "en": "freeze into ice", "zh": "結冰成固體" },
          { "en": "melt into water", "zh": "融化成液體" },
          { "en": "evaporate into steam", "zh": "蒸發成氣體" }
        ],
        "answer": ${determinedIndex},
        "explanation_en": "String explaining the water science state transition",
        "explanation_zh": "String (台灣繁體中文科學原理解析)"
      }
    `;

    const model = ai.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `Generate a ${difficulty || 'normal'} question for location ${location} where the target transformation is ${topic}.` }] }],
      systemInstruction: systemInstruction
    });

    const cleanOutput = JSON.parse(result.response.text().trim());
    return res.status(200).json(cleanOutput);

  } catch (error) {
    console.error("Backend error:", error);
    return res.status(500).json({ error: error.message });
  }
}