const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://umxnkolagobhykhuqlqr.supabase.co",
  "sb_secret_8SV8YveI9KdKN1daBQ_cVQ_8FbXBR8i"
);

async function setupRLSPolicies() {
  console.log("🔒 Setting up Row Level Security policies...");

  const policies = [
    // Profiles policies
    {
      table: 'profiles',
      policy: `
        CREATE POLICY "Users can view team profiles" 
        ON profiles FOR SELECT 
        USING (
          team_id IN (
            SELECT team_id FROM profiles WHERE id = auth.uid()
          )
        );
      `
    },
    {
      table: 'profiles',
      policy: `
        CREATE POLICY "Users can insert their own profile" 
        ON profiles FOR INSERT 
        WITH CHECK (id = auth.uid());
      `
    },
    {
      table: 'profiles',
      policy: `
        CREATE POLICY "Users can update their own profile" 
        ON profiles FOR UPDATE 
        USING (id = auth.uid())
        WITH CHECK (id = auth.uid());
      `
    },

    // Teams policies
    {
      table: 'teams',
      policy: `
        CREATE POLICY "Team members can view their team" 
        ON teams FOR SELECT 
        USING (
          id IN (
            SELECT team_id FROM profiles WHERE id = auth.uid()
          )
        );
      `
    },

    // Tasks policies  
    {
      table: 'tasks',
      policy: `
        CREATE POLICY "Team members can view team tasks" 
        ON tasks FOR SELECT 
        USING (
          team_id IN (
            SELECT team_id FROM profiles WHERE id = auth.uid()
          )
        );
      `
    },
    {
      table: 'tasks',
      policy: `
        CREATE POLICY "Team members can insert team tasks" 
        ON tasks FOR INSERT 
        WITH CHECK (
          team_id IN (
            SELECT team_id FROM profiles WHERE id = auth.uid()
          )
        );
      `
    },
    {
      table: 'tasks',
      policy: `
        CREATE POLICY "Team members can update team tasks" 
        ON tasks FOR UPDATE 
        USING (
          team_id IN (
            SELECT team_id FROM profiles WHERE id = auth.uid()
          )
        )
        WITH CHECK (
          team_id IN (
            SELECT team_id FROM profiles WHERE id = auth.uid()
          )
        );
      `
    },

    // Habits policies
    {
      table: 'habits',
      policy: `
        CREATE POLICY "Team members can view team habits" 
        ON habits FOR SELECT 
        USING (
          team_id IN (
            SELECT team_id FROM profiles WHERE id = auth.uid()
          )
        );
      `
    },
    {
      table: 'habits',
      policy: `
        CREATE POLICY "Users can insert habits for their team" 
        ON habits FOR INSERT 
        WITH CHECK (
          team_id IN (
            SELECT team_id FROM profiles WHERE id = auth.uid()
          )
        );
      `
    },
    {
      table: 'habits',
      policy: `
        CREATE POLICY "Users can update habits in their team" 
        ON habits FOR UPDATE 
        USING (
          team_id IN (
            SELECT team_id FROM profiles WHERE id = auth.uid()
          )
        )
        WITH CHECK (
          team_id IN (
            SELECT team_id FROM profiles WHERE id = auth.uid()
          )
        );
      `
    },
    {
      table: 'habits',
      policy: `
        CREATE POLICY "Users can delete habits in their team" 
        ON habits FOR DELETE 
        USING (
          team_id IN (
            SELECT team_id FROM profiles WHERE id = auth.uid()
          )
        );
      `
    }
  ];

  try {
    // First enable RLS on all tables
    const tables = ['profiles', 'teams', 'tasks', 'habits', 'task_completions', 'awards'];
    
    for (const table of tables) {
      console.log(`🔒 Enabling RLS on ${table}...`);
      try {
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;` 
        });
        if (error && !error.message.includes('already enabled')) {
          console.error(`❌ Failed to enable RLS on ${table}:`, error);
        } else {
          console.log(`✅ RLS enabled on ${table}`);
        }
      } catch (err) {
        console.error(`❌ RLS enable error on ${table}:`, err);
      }
    }

    // Create policies
    for (const { table, policy } of policies) {
      console.log(`📋 Creating policy for ${table}...`);
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: policy });
        if (error && !error.message.includes('already exists')) {
          console.error(`❌ Policy creation failed for ${table}:`, error);
        } else {
          console.log(`✅ Policy created for ${table}`);
        }
      } catch (err) {
        console.error(`❌ Policy error for ${table}:`, err);
      }
    }

    console.log("🎉 RLS policies setup completed!");

  } catch (error) {
    console.error("💥 RLS setup failed:", error);
  }
}

setupRLSPolicies().then(() => {
  process.exit(0);
});