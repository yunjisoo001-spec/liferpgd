import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // 서비스 역할 키를 사용하여 Admin 클라이언트 초기화 (보안 우회 및 강제 승인 목적)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // email_confirm: true 옵션을 주어 이메일 인증 절차와 가입 횟수 제한(Rate limit)을 우회합니다.
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      if (error.message.includes('already been registered')) {
        // 이미 가입된 유저라면 강제로 인증 처리 시도 (비밀번호는 일치한다고 가정하거나, 로그인으로 유도)
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = usersData.users.find(u => u.email === email);
        if (existingUser && !existingUser.email_confirmed_at) {
          await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { email_confirm: true });
        }
        return NextResponse.json({ success: true, message: 'Existing user confirmed' });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
