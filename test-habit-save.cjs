const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://umxnkolagobhykhuqlqr.supabase.co",
  "sb_secret_8SV8YveI9KdKN1daBQ_cVQ_8FbXBR8i"
);

async function testHabitSave() {
  console.log("🧪 Testing habit save process...");

  const realUserId = '65479dc0-fccc-4e28-8de9-1cc0c7a5094b'; // From our database check
  const teamId = '16890efb-a4c1-4886-8f5f-2c04915b24ce';

  try {
    // Test 1: Simple habit insert
    console.log("📝 Testing habit insertion...");
    
    const testHabit = {
      user_id: realUserId,
      team_id: teamId, 
      title: 'Test Debug Habit',
      category: 'FOCUS',
      icon: 'psychology',
      streak: 0,
      xp_per_day: 50,
      level_progress: 0,
      frequency: 3,
      period: 'week',
      completions_this_period: 0
    };

    const { data: newHabit, error: habitError } = await supabase
      .from('habits')
      .insert(testHabit)
      .select()
      .single();

    if (habitError) {
      console.error("❌ Habit insert failed:", habitError.message);
      console.error("Full error:", habitError);
    } else {
      console.log("✅ Habit inserted successfully:", newHabit.title);
      console.log("Habit ID:", newHabit.id);
    }

    // Test 2: Verify we can read it back
    console.log("\n🔍 Testing habit retrieval...");
    
    const { data: habits, error: readError } = await supabase
      .from('habits')
      .select('*')
      .eq('team_id', teamId);

    if (readError) {
      console.error("❌ Habit read failed:", readError.message);
    } else {
      console.log("✅ Found habits:", habits.length);
      habits.forEach(habit => {
        console.log(`- ${habit.title} (${habit.category})`);
      });
    }

    // Test 3: Test with the exact same structure the frontend uses
    console.log("\n🎯 Testing frontend-style save...");
    
    // Simulate the habitToDb function
    const frontendStyleHabit = {
      user_id: realUserId,
      team_id: teamId,
      title: 'Frontend Style Habit',
      category: 'HEALTH',
      icon: 'directions_run',
      streak: 0,
      xp_per_day: 75,
      level_progress: 0,
      activity_grid: [],
      reminder: null,
      frequency: 5,
      period: 'week', 
      completions_this_period: 0,
      period_deadline: null,
    };

    const { data: frontendHabit, error: frontendError } = await supabase
      .from('habits')
      .insert(frontendStyleHabit)
      .select()
      .single();

    if (frontendError) {
      console.error("❌ Frontend-style insert failed:", frontendError.message);
    } else {
      console.log("✅ Frontend-style habit saved:", frontendHabit.title);
    }

  } catch (error) {
    console.error("💥 Test failed:", error);
  }
}

testHabitSave().then(() => {
  process.exit(0);
});