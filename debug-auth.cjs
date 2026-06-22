const { createClient } = require('@supabase/supabase-js');

// Test with both keys to see the difference
const adminClient = createClient(
  "https://umxnkolagobhykhuqlqr.supabase.co",
  "sb_secret_8SV8YveI9KdKN1daBQ_cVQ_8FbXBR8i"
);

const anonClient = createClient(
  "https://umxnkolagobhykhuqlqr.supabase.co", 
  "sb_publishable_Pp0IvqYk9i3FSkg2zXFZtg_xLr5pl__"
);

async function debugAuth() {
  console.log("🔍 Debugging Authentication & Data Access...");

  try {
    // Test 1: Admin access (should work without auth)
    console.log("\n📋 Testing with ADMIN key (should work):");
    const { data: adminTeams, error: adminError } = await adminClient
      .from('teams')
      .select('*');
    
    console.log("Admin Teams:", adminTeams?.length || 0, "records");
    if (adminError) console.log("Admin error:", adminError.message);

    const { data: adminProfiles } = await adminClient
      .from('profiles')
      .select('*');
    console.log("Admin Profiles:", adminProfiles?.length || 0, "records");

    // Test 2: Anonymous access (will fail if RLS is blocking)
    console.log("\n🔒 Testing with ANON key (will fail if RLS blocks):");
    const { data: anonTeams, error: anonError } = await anonClient
      .from('teams')
      .select('*');
      
    console.log("Anon Teams:", anonTeams?.length || 0, "records");  
    if (anonError) console.log("Anon error:", anonError.message);

    const { data: anonProfiles, error: anonProfileError } = await anonClient
      .from('profiles')
      .select('*');
    console.log("Anon Profiles:", anonProfiles?.length || 0, "records");
    if (anonProfileError) console.log("Anon profiles error:", anonProfileError.message);

    // Test 3: Create a test profile to see what happens
    console.log("\n✨ Testing profile creation:");
    const testUser = {
      id: '00000000-0000-0000-0000-000000000001', // Fake UUID for testing
      team_id: '16890efb-a4c1-4886-8f5f-2c04915b24ce',
      name: 'Test User',
      level: 1,
      total_xp: 0
    };

    const { data: newProfile, error: profileError } = await adminClient
      .from('profiles')
      .upsert(testUser, { onConflict: 'id' })
      .select()
      .single();

    if (profileError) {
      console.log("❌ Profile creation failed:", profileError.message);
    } else {
      console.log("✅ Test profile created:", newProfile.name);
      
      // Test habit creation for this user
      const testHabit = {
        user_id: testUser.id,
        team_id: testUser.team_id,
        title: 'Test Habit',
        category: 'FOCUS',
        xp_per_day: 50,
        frequency: 3,
        period: 'week'
      };

      const { data: newHabit, error: habitError } = await adminClient
        .from('habits')
        .insert(testHabit)
        .select()
        .single();

      if (habitError) {
        console.log("❌ Habit creation failed:", habitError.message);
      } else {
        console.log("✅ Test habit created:", newHabit.title);
      }
    }

    console.log("\n🎯 Summary:");
    console.log("- If admin queries work but anon queries fail = RLS policies needed");
    console.log("- If both fail = table structure issues"); 
    console.log("- If both work = frontend auth integration issue");

  } catch (error) {
    console.error("💥 Debug failed:", error);
  }
}

debugAuth().then(() => {
  process.exit(0);
});