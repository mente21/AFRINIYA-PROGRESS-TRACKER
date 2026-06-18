import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not defined");
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
  }
  return aiClient;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { 
      theme = "fantasy", 
      difficulty = "medium", 
      focus = "productivity", 
      count = 3 
    } = req.body;

    const ai = getGeminiClient();
    
    const prompt = `Generate exactly ${count} unique, engaging quests for a gamified productivity app.
Theme: ${theme}. Difficulty: ${difficulty}. Focus: ${focus}.
Return a strict JSON object with a 'quests' array containing objects with:
- title (string)
- description (string)
- type ("daily", "weekly", or "epic")
- deadline ("Today", "This Week", or "Ongoing")
- xpReward (number between 50 and 1000)
- warning (optional string for risks/penalties)
Do not use markdown formatting or any text outside the JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        systemInstruction: "You are Afrina's Quest Forge. Output strict JSON matching the schema."
      }
    });

    const parsed = response.text ? JSON.parse(response.text.trim()) : null;
    
    if (parsed && parsed.quests) {
      parsed.quests = parsed.quests.map((q: any) => ({
        ...q,
        id: `q_forge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        overdueDays: 0
      }));
    }
    
    return res.status(200).json(parsed || { quests: [] });
  } catch (error: any) {
    console.error("Generate quests error:", error);
    return res.status(500).json({ error: error.message || "Forge failed" });
  }
}
