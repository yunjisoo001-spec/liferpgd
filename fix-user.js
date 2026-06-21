const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zzhpjeyxqshympnrkwff.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6aHBqZXl4cXNoeW1wbnJrd2ZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjAzNTQ4MSwiZXhwIjoyMDk3NjExNDgxfQ.Ci3tEMH2fG_naWCX1Pt93YMyO24cuRA5C0x20uGosnI';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function fixUser() {
  const email = 'yunjisu677@gmail.com';
  console.log('Finding user with email:', email);
  
  const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }
  
  const user = usersData.users.find(u => u.email === email);
  if (!user) {
    console.log('User not found. They can just sign up.');
    return;
  }
  
  console.log('User found! ID:', user.id);
  console.log('Confirmed At:', user.email_confirmed_at);
  
  if (!user.email_confirmed_at) {
    console.log('Confirming user...');
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      email_confirm: true
    });
    
    if (updateError) {
      console.error('Error updating user:', updateError);
    } else {
      console.log('User successfully confirmed!');
    }
  } else {
    console.log('User is already confirmed.');
  }
}

fixUser();
