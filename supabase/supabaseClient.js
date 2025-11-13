// supabase/supabaseClient.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config(); // 👈 ¡IMPORTANTE!

const supabaseUrl = 'https://cconduimaixefwjscunr.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
console.log("🔐 Supabase key exists?", !!process.env.SUPABASE_KEY);
if (!supabaseKey) {
  console.error("❌ Supabase Key no cargada desde .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
