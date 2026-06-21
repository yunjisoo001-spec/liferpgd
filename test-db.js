const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zzhpjeyxqshympnrkwff.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6aHBqZXl4cXNoeW1wbnJrd2ZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjAzNTQ4MSwiZXhwIjoyMDk3NjExNDgxfQ.Ci3tEMH2fG_naWCX1Pt93YMyO24cuRA5C0x20uGosnI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testComplete() {
  const { data, error } = await supabase
    .from('character_stats')
    .select('*')
    .limit(1);
    
  console.log('Character Stats Columns:', data ? Object.keys(data[0] || {}) : error);
  
  const { data: qData, error: qError } = await supabase.from('quests').select('*').limit(1);
  console.log('Quests Columns:', qData ? Object.keys(qData[0] || {}) : qError);
}

testComplete();
