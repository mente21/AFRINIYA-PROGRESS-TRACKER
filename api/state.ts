import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

function decodeJwtUserId(token: string): string | null {
  try {
    const payloadStr = Buffer.from(token.split(".")[1], "base64").toString("utf-8");
    const payload = JSON.parse(payloadStr);
    return payload.sub || null;
  } catch {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'GET') {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) return res.status(401).json({ error: "Unauthorized" });

      const userId = decodeJwtUserId(token);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const { data: personalData, error: personalError } = await supabase
        .from('app_state')
        .select('state')
        .eq('user_id', userId)
        .single();

      if (personalError && personalError.code !== 'PGRST116') {
        return res.status(500).json({ error: "Failed to fetch state", details: personalError });
      }

      const { data: teamData, error: teamError } = await supabase
        .from('app_state')
        .select('state')
        .eq('user_id', '16890efb-a4c1-4886-8f5f-2c04915b24ce')
        .single();

      // Fetch all users for the leaderboard (bypassing RLS with secret key)
      const { data: allUsersData } = await supabase
        .from('app_state')
        .select('user_id, state')
        .neq('user_id', '16890efb-a4c1-4886-8f5f-2c04915b24ce');

      const leaderboard = (allUsersData || []).map((row: any) => {
        const pState = row.state || {};
        const profile = pState.userProfile || { name: 'Unknown Agent', level: 1, title: 'Novice' };
        return {
          id: row.user_id,
          name: profile.name,
          avatar: profile.avatar,
          level: profile.level,
          tier: profile.title,
          totalXp: pState.totalXp || 0,
          score: Math.min(99.9, parseFloat(((pState.totalXp || 0) / 146).toFixed(1)))
        };
      }).sort((a: any, b: any) => b.totalXp - a.totalXp).map((u: any, index: number) => ({ ...u, rank: index + 1 }));

      let mergedState: any = {};
      if (teamData?.state) {
        mergedState = { ...mergedState, ...teamData.state };
      }
      if (personalData?.state) {
        mergedState = { ...mergedState, ...personalData.state };
      }
      // Ensure live leaderboard always overrides whatever was saved
      mergedState.leaderboard = leaderboard;

      return res.status(200).json(mergedState);
    } catch (err: any) {
      return res.status(500).json({ error: "Internal server error", details: err?.message || String(err) });
    }
  }

  if (req.method === 'POST') {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) return res.status(401).json({ error: "Unauthorized" });

      const userId = decodeJwtUserId(token);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const {
        userProfile, totalXp, badges, awards,
        habits, quests, teamCampaigns, feed, periodWinners, goldenGoal,
        leaderboard, // extract leaderboard so it isn't saved in rest
        ...rest
      } = req.body;

      // habits and quests are now private!
      const privateState = { userProfile, totalXp, badges, awards, habits, quests, ...rest };
      
      // team state only contains actual shared multiplayer data
      const teamState = { teamCampaigns, feed, periodWinners, goldenGoal };

      const { error: privateError } = await supabase
        .from('app_state')
        .upsert({ user_id: userId, state: privateState }, { onConflict: 'user_id' });

      if (privateError) {
        return res.status(500).json({ error: "Failed to save personal state", details: privateError });
      }

      const { error: teamError } = await supabase
        .from('app_state')
        .upsert({ user_id: '16890efb-a4c1-4886-8f5f-2c04915b24ce', state: teamState }, { onConflict: 'user_id' });

      if (teamError) {
        console.error("Team state save error:", teamError);
      }

      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: "Internal server error", details: err?.message || String(err) });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
