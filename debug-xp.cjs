const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://umxnkolagobhykhuqlqr.supabase.co",
  "sb_secret_8SV8YveI9KdKN1daBQ_cVQ_8FbXBR8i"
);

async function debugXp() {
  console.log("🔍 Debugging XP Data...\n");

  const userId = '65479dc0-fccc-4e28-8de9-1cc0c7a5094b';

  try {
    // 1. Check user total_xp
    console.log("👤 User Profile XP:");
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profile) {
      console.log(`Total XP in database: ${profile.total_xp}`);
    }

    // 2. Check XP events
    console.log("\n📊 XP Events in table:");
    const { data: events } = await supabase
      .from('xp_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    console.log(`Total events: ${events?.length || 0}`);
    if (events && events.length > 0) {
      let total = 0;
      events.forEach(e => {
        console.log(`- ${e.source}: ${e.amount} XP (${new Date(e.created_at).toLocaleString()})`);
        total += e.amount;
      });
      console.log(`Total from events: ${total} XP`);
    }

    // 3. Check awards
    console.log("\n🏆 Awards/Competitions:");
    const { data: awards } = await supabase
      .from('awards')
      .select('*')
      .eq('team_id', profile?.team_id)
      .order('created_at', { ascending: false });
    
    if (awards && awards.length > 0) {
      awards.forEach(award => {
        console.log(`\nAward: "${award.title}"`);
        console.log(`  Created: ${new Date(award.created_at).toLocaleString()}`);
        console.log(`  Deadline: ${new Date(award.deadline).toLocaleString()}`);
        console.log(`  XP Reward: ${award.xp_reward || 'No XP (Prestige)'}`);
      });
    } else {
      console.log("No awards found");
    }

    // 4. Simulate what the leaderboard queries
    console.log("\n🔍 Testing Leaderboard Query:");
    if (awards && awards.length > 0) {
      const award = awards[0];
      console.log(`\nQuerying XP events for award "${award.title}"`);
      console.log(`Between: ${new Date(award.created_at).toLocaleString()} and ${new Date(award.deadline).toLocaleString()}\n`);
      
      const { data: periodEvents } = await supabase
        .from('xp_events')
        .select('*')
        .gte('created_at', award.created_at)
        .lte('created_at', award.deadline)
        .order('created_at', { ascending: false });
      
      console.log(`XP events in competition period: ${periodEvents?.length || 0}`);
      if (periodEvents && periodEvents.length > 0) {
        let total = 0;
        periodEvents.forEach(e => {
          console.log(`- ${e.source}: ${e.amount} XP`);
          total += e.amount;
        });
        console.log(`\nTotal XP in competition: ${total} XP`);
      }
    }

  } catch (error) {
    console.error("💥 Debug failed:", error);
  }
}

debugXp().then(() => {
  process.exit(0);
});