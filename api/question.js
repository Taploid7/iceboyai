import { GoogleGenerativeAI } from '@google/generative-ai';

// Correct initialization for the Google Generative AI Node.js SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  const origin = req.headers.origin || '*';
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', origin); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle browser CORS preflight check immediately
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { difficulty, topic, location } = req.body;

    // Map targets strictly: 0 = freeze, 1 = melt, 2 = evaporate
    let determinedIndex = 1; 
    if (topic === "freeze") determinedIndex = 0;
    if (topic === "evaporate") determinedIndex = 2;

    const systemInstruction = `
      You are an adaptive science AI assistant for Taiwan elementary students playing "Ice Boy's Transformation".
      
      CORE MISSION:
      Generate multiple-choice questions based on water science states (Solid, Liquid, Gas).
      
      VOCABULARY CONSTRAINT:
      - Use natural Traditional Chinese common in Taiwan (台灣繁體中文語體).
      - For "easy" and "normal" difficulties, use simple book analogies ("edges began to blur", "steam").
      - For "hard", introduce topics like "Density" or "Freezing point".

      GAME MECHANICS ANSWER FORCE:
      You MUST return the exact answer index as ${determinedIndex} to match the location parameter: "${topic}".
      
      OUTPUT FORMAT:
      Return ONLY a valid raw JSON object. No markdown, no backticks (\`\`\`):
      {
        "question_en": "What will happen to Ice Boy at the ${location}?",
        "question_zh": "當 Ice Boy 到達 ${location}，會發生什麼事呢？",
        "choices": [
          { "en": "freeze into ice", "zh": "結冰成固體" },
          { "en": "melt into water", "zh": "融化成液體" },
          { "en": "evaporate into steam", "zh": "蒸發成氣體" }
        ],
        "answer": ${determinedIndex},
        "explanation_en": "Correct! Cold temperatures turn liquid water back into solid ice crystals.",
        "explanation_zh": "答對了！低溫會將液態水重新凝固成固體冰晶結構。"
      }
    `;

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `Generate a ${difficulty || 'normal'} question for location ${location} targeting ${topic}.` }] }],
      systemInstruction: systemInstruction
    });

    const cleanOutput = JSON.parse(result.response.text().trim());
    return res.status(200).json(cleanOutput);

  } catch (error) {
    console.error("Backend runtime error:", error);
    return res.status(500).json({ error: error.message });
  }
}