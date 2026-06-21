const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zzhpjeyxqshympnrkwff.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6aHBqZXl4cXNoeW1wbnJrd2ZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjAzNTQ4MSwiZXhwIjoyMDk3NjExNDgxfQ.Ci3tEMH2fG_naWCX1Pt93YMyO24cuRA5C0x20uGosnI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkQuests() {
  const { data, error } = await supabase
    .from('quests')
    .select('id, title, stat_type, stat_bonus, xp_reward, status')
    .order('created_at', { ascending: false })
    .limit(5);
    
  console.log('Recent Quests:', data);
  
  const { data: statsData } = await supabase.from('character_stats').select('*').limit(5);
  console.log('Character Stats:', statsData);
}

checkQuests();
