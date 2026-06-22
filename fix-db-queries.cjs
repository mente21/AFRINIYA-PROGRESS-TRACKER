const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://umxnkolagobhykhuqlqr.supabase.co",
  "sb_secret_8SV8YveI9KdKN1daBQ_cVQ_8FbXBR8i"
);

async function testQueries() {
  console.log("🔍 Testing database queries...");

  try {
    // Test 1: Check what tables exist
    console.log("📋 Checking existing tables...");
    
    // Test profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    console.log("Profiles:", profiles?.length || 0, "records");
    if (profilesError) console.log("Profiles error:", profilesError.message);

    // Test habits table  
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .limit(5);
      
    console.log("Habits:", habits?.length || 0, "records");
    if (habitsError) console.log("Habits error:", habitsError.message);

    // Test tasks table
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .limit(5);
      
    console.log("Tasks:", tasks?.length || 0, "records");
    if (tasksError) console.log("Tasks error:", tasksError.message);

    // Test teams table
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .limit(5);
      
    console.log("Teams:", teams?.length || 0, "records");
    if (teamsError) console.log("Teams error:", teamsError.message);

    console.log("✅ Query tests completed");

  } catch (error) {
    console.error("💥 Query test failed:", error);
  }
}

testQueries().then(() => {
  process.exit(0);
});