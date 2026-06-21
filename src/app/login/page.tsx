"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Mail, Key } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    setErrorMsg('');
    if (!email) {
      setErrorMsg('이메일을 입력해주세요.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg('유효한 이메일 형식이 아닙니다.');
      return false;
    }
    if (!password) {
      setErrorMsg('비밀번호를 입력해주세요.');
      return false;
    }
    if (password.length < 6) {
      setErrorMsg('비밀번호는 최소 6자 이상이어야 합니다.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        router.push('/');
      } else {
        // 기존 signUp() 대신 관리자 API 라우트를 호출하여 Rate Limit 및 이메일 인증 절차를 우회합니다.
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || '회원가입 중 오류가 발생했습니다.');
        }

        // 가입 성공 (이메일 인증 불필요) 시 바로 로그인 처리
        const { error: signInError } = await signIn(email, password);
        if (signInError) throw signInError;
        
        router.push('/');
      }
    } catch (error: any) {
      if (error?.message?.includes('rate limit') || error?.status === 429) {
        setErrorMsg('잠시 후 다시 시도해주세요. (너무 많은 요청이 발생했습니다)');
      } else {
        setErrorMsg(error?.message || '인증 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rpg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-rpg-card border-4 border-rpg-border rounded-lg shadow-rpg p-6 md:p-8 relative">
        {/* 장식용 아이콘 */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-rpg-wood border-4 border-rpg-border rounded-full flex items-center justify-center shadow-rpg-sm z-10">
          <Shield className="text-[#FFD54F]" size={24} />
        </div>

        <h1 className="text-3xl font-pixel text-center text-rpg-text-primary mt-4 mb-2">Life Quest RPG</h1>
        <p className="text-center font-retro text-rpg-text-secondary mb-6">모험가 길드에 오신 것을 환영합니다</p>

        {/* 탭 전환 */}
        <div className="flex border-b-2 border-rpg-border mb-6">
          <button
            type="button"
            className={`flex-1 py-2 font-pixel text-lg transition-colors ${
              isLogin ? 'text-rpg-gold border-b-4 border-rpg-gold -mb-[3px]' : 'text-rpg-text-secondary hover:text-rpg-text-primary'
            }`}
            onClick={() => { setIsLogin(true); setErrorMsg(''); }}
          >
            로그인
          </button>
          <button
            type="button"
            className={`flex-1 py-2 font-pixel text-lg transition-colors ${
              !isLogin ? 'text-rpg-gold border-b-4 border-rpg-gold -mb-[3px]' : 'text-rpg-text-secondary hover:text-rpg-text-primary'
            }`}
            onClick={() => { setIsLogin(false); setErrorMsg(''); }}
          >
            회원가입
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-pixel text-sm text-rpg-text-primary mb-2">이메일</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-rpg-text-secondary" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#F5DEB3] border-4 border-rpg-border p-3 pl-10 font-retro text-rpg-text-primary focus:outline-none focus:border-rpg-gold placeholder:text-rpg-text-secondary shadow-inner rounded"
                placeholder="adventurer@guild.com"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block font-pixel text-sm text-rpg-text-primary mb-2">비밀번호</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-rpg-text-secondary" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#F5DEB3] border-4 border-rpg-border p-3 pl-10 font-retro text-rpg-text-primary focus:outline-none focus:border-rpg-gold placeholder:text-rpg-text-secondary shadow-inner rounded"
                placeholder="******"
                disabled={isLoading}
              />
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-100 border-2 border-red-800 text-red-800 p-3 rounded font-retro text-sm text-center shadow-inner">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 bg-rpg-gold text-rpg-text-primary font-pixel text-xl py-3 border-4 border-rpg-border rounded shadow-rpg-sm hover:bg-rpg-gold-hover hover:-translate-y-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {isLoading ? '통신 중...' : (isLogin ? '접속하기' : '가입하기')}
          </button>
        </form>
      </div>
    </div>
  );
}
