import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

// Load local environment variables if .env exists
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_ANON_KEY || "placeholder";
const supabase = createClient(supabaseUrl, supabaseKey);

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please configure it in your environment.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// ---------------------------------------------------------------------------
// Local JWT decoder — reads the user ID from the Supabase JWT payload without
// any network call to the Supabase auth server. Avoids ConnectTimeoutErrors.
// ---------------------------------------------------------------------------
function decodeJwtUserId(token: string): string | null {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString("utf8")
    );
    return payload.sub || null; // Supabase stores the user UUID in `sub`
  } catch {
    return null;
  }
}

// API ROUTE DEFINITIONS
// /api/state and /api/users have been deprecated and removed. 
// The client now uses the Supabase SDK directly with Realtime connections.

// GEMINI AI INTEGRATION
app.post("/api/ai/counselor", async (req, res) => {
  try {
    const { habits, quests, userProfile } = req.body;
    
    const ai = getGeminiClient();

    const habitsStr = habits ? habits.map((h: any) => `- ${h.title} (Category: ${h.category}, Streak: ${h.streak} days, Progress: ${h.levelProgress}%)`).join("\n") : '';
    const questsStr = quests ? quests.map((q: any) => `- ${q.title} (Category: ${q.category}, Status: ${q.status}, Reward: ${q.xpReward} XP, Deadline: ${q.deadline})`).join("\n") : '';
    const userProfileName = userProfile ? userProfile.name : 'Unknown';
    const userLevel = userProfile ? userProfile.level : 1;
    const userTitle = userProfile ? userProfile.title : 'Agent';
    const prodScore = userProfile ? userProfile.productivityScore : 0;
    
    const userContext = `
      User Character: ${userProfileName} (Level ${userLevel} ${userTitle})
      Current Productivity Score: ${prodScore}/100
      
      Active Habits:
      ${habitsStr}
      
      Current Backlog of Quests:
      ${questsStr}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `
        Analyze this user's gamified routine. Identify bottlenecks or missed habits, and generate:
        1. A tailored visual strategy/analysis in exactly 3 short bullet points.
        2. Exactly 1 custom new premium high-reward "Quest" suggesting specific action to break their bottleneck (include high-quality fields like title, description, category, deadline, xpReward).
        
        User Context:
        ${userContext}
        
        Respond with raw JSON strictly following this schema structure:
        {
          "analysis": [
            "short bullet 1 pointing out a pattern/strength",
            "short bullet 2 pointing out a vulnerability/risk",
            "short bullet 3 recommendation for immediate action"
          ],
          "suggestedQuest": {
            "title": "A short engaging AI-spawned Quest title",
            "description": "Engaging description and actionable goal",
            "category": "Strategic", 
            "deadline": "Next 7 Days",
            "xpReward": 350
          }
        }
      `,
      config: {
        responseMimeType: "application/json",
        systemInstruction: "You are an Elite AI Strategist of Afrinias productivity suite. You are humble, direct, and motivate users using high-tech/cyberpunk operational military metaphors."
      }
    });

    const aiOutput = response.text ? JSON.parse(response.text.trim()) : null;
    res.json(aiOutput);

  } catch (error: any) {
    console.error("Gemini AI counselor request failed:", error);
    res.status(500).json({ 
      error: error.message || "Failed to contact AI strategist"
    });
  }
});

// CHAT COACH INTEGRATION
app.post("/api/gemini/coach-chat", async (req, res) => {
  try {
    const { message, chatHistory, userStats } = req.body;
    const ai = getGeminiClient();
    
    const sysPrompt = `You are Afrina, an elite AI Tactical Productivity Coordinator. You talk like a cyberpunk tactical operative. 
User stats: Level ${userStats?.level || 1}, Productivity Score: ${userStats?.productivityScore || 0}/100, XP: ${userStats?.currentXp || 0}/${userStats?.xpToNextLevel || 1000}.
Be concise, highly motivating, and provide actionable operational directives.`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        ...chatHistory.map((h: any) => ({
          role: h.sender,
          parts: [{ text: h.text }]
        })),
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: sysPrompt
      }
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Chat coach error:", error);
    res.status(500).json({ error: error.message || "Cognitive sync failure" });
  }
});

// AI QUEST FORGE INTEGRATION
app.post("/api/gemini/generate-quests", async (req, res) => {
  try {
    const { goal } = req.body;
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `Decompile the following user goal into exactly 3 actionable gamified Quests: "${goal}".
      Return raw JSON only, following this exact schema:
      {
        "quests": [
          {
            "id": "q_forge_1",
            "title": "Clear objective title",
            "description": "Actionable description",
            "category": "Development",
            "status": "todo",
            "isGolden": false,
            "progress": 0,
            "deadline": "Today",
            "warning": "",
            "xpReward": 150,
            "overdueDays": 0
          }
        ]
      }`,
      config: {
        responseMimeType: "application/json",
        systemInstruction: "You are Afrina's Quest Forge. Output strict JSON matching the schema."
      }
    });

    const parsed = response.text ? JSON.parse(response.text.trim()) : null;
    
    // Ensure unique IDs
    if (parsed && parsed.quests) {
      parsed.quests = parsed.quests.map((q: any) => ({
        ...q,
        id: `q_forge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }));
    }
    
    res.json(parsed || { quests: [] });
  } catch (error: any) {
    console.error("Generate quests error:", error);
    res.status(500).json({ error: error.message || "Forge failed" });
  }
});

// START EXPRESS/VITE ENGINE INTEGRATOR
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Afrinias Engine Server] standing by on http://0.0.0.0:${PORT}`);
    console.log(`[Engine Mode] ${process.env.NODE_ENV !== "production" ? "Development (Vite Live)" : "Production (Static)"}`);
  });
}

if (!process.env.VERCEL) {
  bootstrap();
}

export default app;
