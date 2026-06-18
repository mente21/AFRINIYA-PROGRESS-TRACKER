import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SECRET_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function reset() {
  console.log("Deleting app_state...");
  const { error } = await supabase.from('app_state').delete().eq('id', 1);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Database reset successful.");
  }
}
reset();
