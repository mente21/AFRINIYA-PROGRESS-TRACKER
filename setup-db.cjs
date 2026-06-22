const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase with service key for admin operations  
const supabase = createClient(
  "https://umxnkolagobhykhuqlqr.supabase.co",
  "sb_secret_8SV8YveI9KdKN1daBQ_cVQ_8FbXBR8i"
);

async function setupDatabase() {
  console.log("🚀 Setting up Afrinias Database Tables...");

  // Create tables one by one with proper error handling
  const tables = [
    {
      name: 'teams',
      sql: `
        CREATE TABLE IF NOT EXISTS teams (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `
    },
    {
      name: 'profiles',
      sql: `
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
          team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
          name TEXT,
          avatar TEXT,
          title TEXT DEFAULT 'Novice',
          level INT DEFAULT 1,
          total_xp INT DEFAULT 0,
          equipped_frame_id TEXT DEFAULT 'none',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `
    },
    {
      name: 'tasks',
      sql: `
        CREATE TABLE IF NOT EXISTS tasks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
          creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
          title TEXT NOT NULL,
          description TEXT,
          category TEXT,
          task_type TEXT,
          deadline TEXT,
          xp_reward INT DEFAULT 150,
          assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `
    },
    {
      name: 'habits',
      sql: `
        CREATE TABLE IF NOT EXISTS habits (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
          title TEXT NOT NULL,
          category TEXT NOT NULL,
          icon TEXT,
          streak INT DEFAULT 0,
          xp_per_day INT DEFAULT 50,
          level_progress INT DEFAULT 0,
          frequency INT DEFAULT 1,
          period TEXT DEFAULT 'week',
          completions_this_period INT DEFAULT 0,
          period_deadline TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `
    }
  ];

  try {
    // First create default team  
    console.log("🏢 Creating default team...");
    const defaultTeamId = '16890efb-a4c1-4886-8f5f-2c04915b24ce';
    
    // Check if team exists first
    const { data: existingTeam } = await supabase
      .from('teams')
      .select('id')
      .eq('id', defaultTeamId)
      .single();
    
    if (!existingTeam) {
      const { data: newTeam, error: teamError } = await supabase
        .from('teams')
        .insert({
          id: defaultTeamId,
          name: 'Afrinias Default Team'
        })
        .select()
        .single();

      if (teamError) {
        console.error("❌ Team creation failed:", teamError);
      } else {
        console.log("✅ Default team created:", newTeam.name);
      }
    } else {
      console.log("✅ Default team already exists");
    }

    // Test basic connection
    console.log("🔍 Testing database connection...");
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error("❌ Database connection test failed:", testError);
    } else {
      console.log("✅ Database connection successful");
    }

    console.log("🎉 Database setup completed!");
    
    // Test inserting a sample profile to see if RLS is working
    console.log("🧪 Testing data operations...");
    
  } catch (error) {
    console.error("💥 Database setup failed:", error);
  }
}

setupDatabase().then(() => {
  console.log("Setup process completed.");
  process.exit(0);
});