const { createClient } = require('@supabase/supabase-js');
const supabase = createClient("https://umxnkolagobhykhuqlqr.supabase.co", "sb_secret_8SV8YveI9KdKN1daBQ_cVQ_8FbXBR8i");

supabase.from('app_state').select('user_id, state').then(res => {
  console.log("DATA:");
  console.log(JSON.stringify(res.data, null, 2));
}).catch(err => {
  console.error("ERR:", err);
});
