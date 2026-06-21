const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zzhpjeyxqshympnrkwff.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6aHBqZXl4cXNoeW1wbnJrd2ZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjAzNTQ4MSwiZXhwIjoyMDk3NjExNDgxfQ.Ci3tEMH2fG_naWCX1Pt93YMyO24cuRA5C0x20uGosnI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanUp() {
  const userId = 'e9528786-0844-4d58-9d22-c213db7c2d27';
  
  // Clean up character_stats
  const { data: stats } = await supabase.from('character_stats').select('*').eq('user_id', userId).order('created_at', { ascending: true });
  if (stats && stats.length > 1) {
    const idsToDelete = stats.slice(1).map(s => s.id);
    await supabase.from('character_stats').delete().in('id', idsToDelete);
    console.log(`Deleted ${idsToDelete.length} duplicate character_stats`);
  }
  
  // Clean up profiles
  const { data: profiles } = await supabase.from('profiles').select('*').eq('id', userId).order('created_at', { ascending: true });
  if (profiles && profiles.length > 1) {
    // wait, profiles primary key is id, and id is user_id. How can there be duplicates?
    // If id is primary key, insert would fail with unique constraint!
    console.log('Profiles has multiple? This shouldn\'t happen if id is PK.');
  }
}

cleanUp();
