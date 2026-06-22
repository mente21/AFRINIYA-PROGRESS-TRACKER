const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase with service key for admin operations
const supabase = createClient(
  "https://umxnkolagobhykhuqlqr.supabase.co", 
  "sb_secret_8SV8YveI9KdKN1daBQ_cVQ_8FbXBR8i"
);

async function initializeDatabase() {
  console.log("🚀 Initializing Afrinias Database...");

  try {
    // 1. Run main schema
    console.log("📄 Running main schema...");
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    const { error: schemaError } = await supabase.rpc('exec_sql', { sql_query: schemaSQL });
    if (schemaError) {
      console.error("❌ Schema error:", schemaError);
    } else {
      console.log("✅ Main schema executed successfully");
    }

    // 2. Run all migrations in order
    const migrationFiles = [
      '001_assignee_and_completion_delete.sql',
      '002_habits_awards_frames_xp.sql', 
      '003_award_claims.sql',
      '004_award_xp_reward.sql',
      '005_feeds_and_badges_tables.sql'
    ];

    for (const file of migrationFiles) {
      console.log(`📄 Running migration: ${file}`);
      try {
        const migrationSQL = fs.readFileSync(path.join(__dirname, 'migrations', file), 'utf8');
        const { error: migrationError } = await supabase.rpc('exec_sql', { sql_query: migrationSQL });
        if (migrationError) {
          console.error(`❌ Migration ${file} failed:`, migrationError);
        } else {
          console.log(`✅ Migration ${file} completed`);
        }
      } catch (fileError) {
        console.error(`❌ Could not read migration ${file}:`, fileError.message);
      }
    }

    // 3. Create default team if not exists
    console.log("🏢 Creating default team...");
    const defaultTeamId = '16890efb-a4c1-4886-8f5f-2c04915b24ce';
    const { error: teamError } = await supabase
      .from('teams')
      .upsert({
        id: defaultTeamId,
        name: 'Afrinias Default Team'
      }, { onConflict: 'id' });
    
    if (teamError) {
      console.error("❌ Team creation error:", teamError);
    } else {
      console.log("✅ Default team created/verified");
    }

    // 4. Test database connection by checking tables
    console.log("🔍 Verifying tables...");
    const tables = ['profiles', 'tasks', 'habits', 'teams'];
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('id').limit(1);
      if (error) {
        console.error(`❌ Table ${table} test failed:`, error.message);
      } else {
        console.log(`✅ Table ${table} is accessible`);
      }
    }

    console.log("🎉 Database initialization completed!");

  } catch (error) {
    console.error("💥 Database initialization failed:", error);
  }
}

// Alternative method using direct SQL execution
async function directSchemaExecution() {
  console.log("🔧 Attempting direct schema execution...");
  
  try {
    // Read and execute schema directly
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    
    // Split into individual statements and execute one by one
    const statements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: stmt });
        if (error) {
          console.error(`Statement failed:`, error);
        }
      } catch (err) {
        console.error(`Statement execution error:`, err);
      }
    }

  } catch (error) {
    console.error("Direct execution failed:", error);
  }
}

// Run initialization
initializeDatabase().then(() => {
  process.exit(0);
});