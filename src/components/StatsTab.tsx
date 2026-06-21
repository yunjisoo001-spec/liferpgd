import React, { useEffect, useState } from 'react';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getProfile, getCharacterStats } from '@/lib/characterService';
import { supabase } from '@/lib/supabase';

export default function StatsTab() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [maxXp, setMaxXp] = useState(100);
  
  const [statValues, setStatValues] = useState({
    int: 0,
    vit: 0,
    com: 0,
    cre: 0,
    foc: 0
  });

  const loadStats = async () => {
    if (!user) return;
    const [profileRes, statsRes] = await Promise.all([
      getProfile(user.id),
      getCharacterStats(user.id)
    ]);

    if (profileRes.data) {
      setLevel(profileRes.data.level || 1);
      setXp(profileRes.data.xp || 0);
      setMaxXp(profileRes.data.max_xp || 100);
    }
    
    if (statsRes.data) {
      setStatValues({
        int: statsRes.data.int_stat || 0,
        vit: statsRes.data.vit_stat || 0,
        com: statsRes.data.com_stat || 0,
        cre: statsRes.data.cre_stat || 0,
        foc: statsRes.data.foc_stat || 0
      });
    }
  };

  useEffect(() => {
    loadStats();

    if (user) {
      // 실시간 데이터 연동 (Real-time subscriptions)
      // React StrictMode 등에서 중복 구독 시 발생하는 에러를 방지하기 위해 채널 이름에 랜덤값 또는 타임스탬프 추가
      const profileSub = supabase.channel(`profile_changes_${user.id}_${Date.now()}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, (payload: any) => {
          setLevel(payload.new.level);
          setXp(payload.new.xp);
          setMaxXp(payload.new.max_xp);
        })
        .subscribe();

      const statsSub = supabase.channel(`stats_changes_${user.id}_${Date.now()}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'character_stats', filter: `user_id=eq.${user.id}` }, (payload: any) => {
          setStatValues({
            int: payload.new.int_stat || 0,
            vit: payload.new.vit_stat || 0,
            com: payload.new.com_stat || 0,
            cre: payload.new.cre_stat || 0,
            foc: payload.new.foc_stat || 0
          });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(profileSub);
        supabase.removeChannel(statsSub);
      };
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    // Next.js App Router 캐시 우회를 위해 하드 리다이렉트 사용
    window.location.href = '/login';
  };

  const [showUserInfo, setShowUserInfo] = useState(false);

  const stats = [
    { name: '지능 (INT)', value: statValues.int, max: Math.max(100, statValues.int + 50), color: '#4FC3F7', icon: '🧠' },
    { name: '체력 (VIT)', value: statValues.vit, max: Math.max(100, statValues.vit + 50), color: '#E57373', icon: '❤️' },
    { name: '소통 (COM)', value: statValues.com, max: Math.max(100, statValues.com + 50), color: '#81C784', icon: '💬' },
    { name: '창의 (CRE)', value: statValues.cre, max: Math.max(100, statValues.cre + 50), color: '#BA68C8', icon: '💡' },
    { name: '집중 (FOC)', value: statValues.foc, max: Math.max(100, statValues.foc + 50), color: '#FFB74D', icon: '🎯' },
  ];

  return (
    <div className="bg-rpg-wood rounded-lg font-pixel text-rpg-bg flex flex-col h-full shadow-rpg">
      <div className="flex gap-1 mb-4 border-b-4 border-rpg-border p-4 pb-0 bg-black/20 rounded-t-lg">
        <div className="bg-rpg-bg text-rpg-text-primary px-6 py-2 rounded-t border-2 border-b-0 border-rpg-border relative top-[2px] z-10 cursor-pointer">
          스탯
        </div>
        <div className="text-[#D7CCC8] px-6 py-2 cursor-pointer hover:text-white transition-colors">
          성장
        </div>
      </div>

      <div className="flex flex-col items-center p-6 pt-0 relative">
        {user && (
          <button 
            onClick={handleLogout}
            className="absolute top-0 right-6 text-rpg-text-primary hover:text-red-500 transition-colors flex items-center gap-1 font-retro text-xs bg-rpg-card px-2 py-1 border-2 border-rpg-border rounded shadow-rpg-sm cursor-pointer z-10"
            title="로그아웃"
          >
            <LogOut size={14} /> 로그아웃
          </button>
        )}

        <div 
          className="w-[120px] h-[120px] bg-[#87CEEB] border-4 border-rpg-gold rounded-lg flex items-center justify-center mb-4 relative shadow-inner mt-4 cursor-pointer hover:brightness-110 transition-all"
          onClick={() => setShowUserInfo(!showUserInfo)}
          title="유저 정보 보기"
        >
          {user ? (
            <div className="text-6xl">👤</div>
          ) : (
            <User size={64} className="text-rpg-text-secondary" />
          )}
          {user && (
            <div className="absolute -bottom-3 -right-3 bg-rpg-gold text-rpg-text-primary px-2 py-0.5 border-2 border-rpg-text-primary text-xs shadow-sm">
              LVL {level}
            </div>
          )}
          
          {/* 유저 정보 툴팁 */}
          {showUserInfo && user && (
            <div className="absolute top-[130px] w-[200px] bg-rpg-card border-2 border-rpg-border rounded-lg p-3 shadow-rpg z-50 animate-fade-in cursor-default" onClick={e => e.stopPropagation()}>
              <div className="text-xs text-rpg-text-secondary mb-1">모험가 이메일</div>
              <div className="text-sm text-rpg-text-primary font-bold break-all mb-2">{user.email}</div>
              <div className="text-xs text-rpg-text-secondary mb-1">고유 식별 코드</div>
              <div className="text-[10px] text-rpg-text-primary opacity-50 break-all">{user.id}</div>
              <div className="mt-2 text-[10px] text-red-500">* 비밀번호는 보안상 표시되지 않습니다.</div>
            </div>
          )}
        </div>
        
        {user ? (
          <div className="text-lg text-rpg-gold mb-2 drop-shadow-[2px_2px_0px_#3E2723]">
            {profile?.username ? profile.username.split('@')[0] : '모험가'}
          </div>
        ) : (
          <button 
            onClick={() => router.push('/login')}
            className="mb-2 px-6 py-2 text-sm bg-rpg-gold text-rpg-text-primary border-4 border-rpg-text-primary rounded shadow-rpg-sm hover:bg-rpg-gold-hover active:translate-y-1 active:shadow-none transition-all font-pixel cursor-pointer"
          >
            로그인
          </button>
        )}

        {/* XP Bar */}
        <div className="w-full px-5 mb-6">
          <div className="h-3 bg-rpg-text-primary rounded-full border-2 border-rpg-border overflow-hidden">
            <div 
              className="h-full bg-rpg-gold transition-all duration-500" 
              style={{ width: `${user ? (xp / maxXp) * 100 : 0}%` }}
            />
          </div>
          <div className="text-center text-xs text-[#D7CCC8] mt-1">
            XP : {user ? `${xp}/${maxXp}` : '0/100'}
          </div>
        </div>

        <div className="w-full border-t-2 border-dashed border-rpg-border my-4" />

        {/* Attributes */}
        <div className="w-full px-5">
          <div className="text-rpg-gold text-sm mb-4 drop-shadow-[1px_1px_0px_#3E2723]">능력치</div>
          
          {stats.map(stat => (
            <div key={stat.name} className="mb-3">
              <div className="flex justify-between text-sm mb-1 font-retro">
                <span className="flex items-center gap-1">
                  <span className="text-xs">{stat.icon}</span> {stat.name}
                </span>
                <span>{user ? stat.value : 0}/{stat.max}</span>
              </div>
              <div className="h-1.5 bg-rpg-text-primary rounded-full overflow-hidden border border-rpg-border">
                <div 
                  className="h-full transition-all duration-1000" 
                  style={{ width: `${user ? (stat.value / stat.max) * 100 : 0}%`, backgroundColor: stat.color }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
