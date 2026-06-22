const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://umxnkolagobhykhuqlqr.supabase.co";
const supabaseKey = "sb_secret_8SV8YveI9KdKN1daBQ_cVQ_8FbXBR8i";
const supabase = createClient(supabaseUrl, supabaseKey);

async function alterTasks() {
  console.log("Altering tasks table...");
  const queries = [
    "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS target_count INT;",
    "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS current_count INT DEFAULT 0;",
    "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS bonus_xp_per_result INT DEFAULT 0;"
  ];
  
  for (const q of queries) {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: q });
    if (error) {
      console.log("Error on", q, error);
    } else {
      console.log("Success", q);
    }
  }
}
alterTasks();
