import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { getProfile, getCharacterStats } from '@/lib/characterService';
import { Target, Calendar as CalendarIcon, Zap, Activity } from 'lucide-react';

export default function GrowthDashboard() {
  const { user } = useAuth();
  
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [weeklyCompleted, setWeeklyCompleted] = useState(0);
  const [monthlyCompleted, setMonthlyCompleted] = useState(0);
  
  const [statData, setStatData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      setIsLoading(true);
      
      try {
        // 1. 프로필 및 스탯
        const [profileRes, statsRes] = await Promise.all([
          getProfile(user.id),
          getCharacterStats(user.id)
        ]);

        if (profileRes.data) {
          setLevel(profileRes.data.level);
          setXp(profileRes.data.xp);
        }

        if (statsRes.data) {
          setStatData([
            { subject: '지능', A: statsRes.data.int_stat, fullMark: 100 },
            { subject: '체력', A: statsRes.data.vit_stat, fullMark: 100 },
            { subject: '소통', A: statsRes.data.com_stat, fullMark: 100 },
            { subject: '창의', A: statsRes.data.cre_stat, fullMark: 100 },
            { subject: '집중', A: statsRes.data.foc_stat, fullMark: 100 },
          ]);
        }

        // 2. 주간/월간 퀘스트 통계
        const today = new Date();
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(today.getDate() - 7);
        
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const { data: weeklyQuests } = await supabase
          .from('quests')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('completed_at', oneWeekAgo.toISOString());

        const { data: monthlyQuests } = await supabase
          .from('quests')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('completed_at', firstDayOfMonth.toISOString());

        setWeeklyCompleted(weeklyQuests?.length || 0);
        setMonthlyCompleted(monthlyQuests?.length || 0);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();

    // 17단계: quests, character_stats 테이블 실시간 업데이트 감지
    const channel = supabase
      .channel('dashboard_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quests', filter: `user_id=eq.${user.id}` }, () => {
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'character_stats', filter: `user_id=eq.${user.id}` }, () => {
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user) {
    return (
      <div className="bg-rpg-card border-4 border-rpg-border rounded-lg p-6 mb-5 shadow-rpg text-center font-retro text-rpg-text-secondary">
        대시보드를 보려면 로그인이 필요합니다.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-rpg-card border-4 border-rpg-border rounded-lg p-6 mb-5 shadow-rpg flex justify-center items-center h-64 font-pixel text-rpg-gold animate-pulse">
        데이터를 불러오는 중...
      </div>
    );
  }

  return (
    <div className="bg-rpg-card border-4 border-rpg-border rounded-lg p-6 mb-5 shadow-rpg">
      <h2 className="font-pixel text-xl text-rpg-text-primary mb-4 pb-2 border-b-2 border-dashed border-rpg-border flex items-center gap-2">
        <Activity size={24} className="text-rpg-green" />
        성장 대시보드
      </h2>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded border-2 border-rpg-border flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
          <div className="absolute top-2 left-2 text-rpg-text-secondary/20"><Target size={48} /></div>
          <div className="text-rpg-text-secondary text-sm font-retro mb-1 relative z-10">현재 레벨</div>
          <div className="text-3xl font-pixel text-rpg-gold font-bold relative z-10">LV. {level}</div>
          <div className="text-xs text-rpg-text-primary mt-1 font-retro relative z-10">총 {xp} XP</div>
        </div>

        <div className="bg-white p-4 rounded border-2 border-rpg-border flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
          <div className="absolute top-2 left-2 text-rpg-text-secondary/20"><CalendarIcon size={48} /></div>
          <div className="text-rpg-text-secondary text-sm font-retro mb-1 relative z-10">이번 달 완료</div>
          <div className="text-3xl font-pixel text-rpg-green font-bold relative z-10">{monthlyCompleted} 개</div>
          <div className="text-xs text-rpg-text-primary mt-1 font-retro relative z-10">최근 7일: {weeklyCompleted}개</div>
        </div>
      </div>

      <h3 className="font-pixel text-lg text-rpg-text-primary mb-4 flex items-center gap-2">
        <Zap size={20} className="text-[#FFD54F]" />
        능력치 밸런스
      </h3>
      <div className="bg-white border-2 border-rpg-border rounded p-4 h-[300px] flex items-center justify-center shadow-inner">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={statData}>
            <PolarGrid stroke="#D7CCC8" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#3E2723', fontFamily: 'var(--font-pixel)' }} />
            <PolarRadiusAxis angle={30} domain={[0, 'dataMax + 10']} tick={false} axisLine={false} />
            <Radar
              name="능력치"
              dataKey="A"
              stroke="#FFD54F"
              fill="#FFD54F"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
