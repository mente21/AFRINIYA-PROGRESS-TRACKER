const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://umxnkolagobhykhuqlqr.supabase.co",
  "sb_secret_8SV8YveI9KdKN1daBQ_cVQ_8FbXBR8i"
);

async function checkExistingData() {
  console.log("🔍 Checking existing data in database...");

  try {
    // Check what's in each table
    const { data: teams } = await supabase.from('teams').select('*');
    console.log("\n🏢 Teams:");
    teams?.forEach(team => {
      console.log(`- ${team.name} (ID: ${team.id})`);
    });

    const { data: profiles } = await supabase.from('profiles').select('*');
    console.log("\n👤 Profiles:");
    profiles?.forEach(profile => {
      console.log(`- ${profile.name} (Level ${profile.level}, XP: ${profile.total_xp})`);
      console.log(`  Team: ${profile.team_id}`);
      console.log(`  Auth ID: ${profile.id}`);
    });

    const { data: habits } = await supabase.from('habits').select('*');
    console.log(`\n🔥 Habits: ${habits?.length || 0} records`);
    habits?.forEach(habit => {
      console.log(`- ${habit.title} (${habit.category}, User: ${habit.user_id})`);
    });

    const { data: tasks } = await supabase.from('tasks').select('*');
    console.log(`\n📋 Tasks: ${tasks?.length || 0} records`);

    // Check if there are authentication issues by testing profile creation with a real user pattern
    console.log("\n🧪 Testing realistic user flow...");
    
    // Simulate what happens when a user signs up
    const mockAuthUserId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'; // Still fake but shows the pattern
    
    console.log("\nIf you're logged in, your profile should be created automatically.");
    console.log("The issue might be:");
    console.log("1. User signs in but profile creation fails");
    console.log("2. Profile exists but data fetching has wrong team_id"); 
    console.log("3. Frontend auth state not properly connected to database queries");

  } catch (error) {
    console.error("💥 Data check failed:", error);
  }
}

checkExistingData().then(() => {
  process.exit(0);
});