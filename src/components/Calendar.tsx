import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getQuestsByMonth } from '@/lib/questService';
import { Quest } from '@/types/quest';
import { supabase } from '@/lib/supabase';

interface CalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onQuestsLoaded?: (dateStr: string, quests: Quest[]) => void;
}

export default function Calendar({ selectedDate, onSelectDate, onQuestsLoaded }: CalendarProps) {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  const [monthQuests, setMonthQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setMonthQuests([]);
      return;
    }

    const fetchMonthQuests = async () => {
      setIsLoading(true);
      const { data } = await getQuestsByMonth(user.id, currentMonth.getFullYear(), currentMonth.getMonth() + 1);
      if (data) {
        setMonthQuests(data);
      }
      setIsLoading(false);
    };

    fetchMonthQuests();

    // 17단계: quests 테이블 실시간 업데이트 감지
    const channel = supabase
      .channel('quest_changes_calendar')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quests', filter: `user_id=eq.${user.id}` }, () => {
        // 데이터가 변경되면 다시 쿼리
        fetchMonthQuests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentMonth, user]);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Helper to get quests for a specific date string
  const getQuestsForDateStr = (dateStr: string) => {
    return monthQuests.filter(q => q.date === dateStr);
  };

  // When selectedDate or monthQuests changes, notify parent of the current date's quests
  // This helps page.tsx to get the initial quests without fetching again.
  useEffect(() => {
    if (onQuestsLoaded) {
      const dateString = selectedDate.toISOString().split('T')[0];
      onQuestsLoaded(dateString, getQuestsForDateStr(dateString));
    }
  }, [selectedDate, monthQuests]);

  const handleDateClick = (date: Date) => {
    onSelectDate(date);
    if (onQuestsLoaded) {
      const dateString = date.toISOString().split('T')[0];
      onQuestsLoaded(dateString, getQuestsForDateStr(dateString));
    }
  };

  if (!user) {
    return (
      <div className="bg-rpg-card border-4 border-rpg-border rounded p-4 shadow-rpg text-center font-retro text-rpg-text-secondary">
        캘린더를 보려면 로그인이 필요합니다.
      </div>
    );
  }

  return (
    <div className="bg-rpg-card border-4 border-rpg-border rounded p-4 shadow-rpg relative">
      {isLoading && (
        <div className="absolute inset-0 bg-rpg-bg/50 z-10 flex items-center justify-center font-pixel text-rpg-gold animate-pulse">
          로딩 중...
        </div>
      )}
      <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-dashed border-rpg-border text-rpg-text-primary font-retro">
        <button onClick={prevMonth} className="hover:bg-black/10 rounded p-1 transition-colors"><ChevronLeft size={20} /></button>
        <span className="font-bold text-lg">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
        <button onClick={nextMonth} className="hover:bg-black/10 rounded p-1 transition-colors"><ChevronRight size={20} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 lg:gap-2">
        {dayNames.map(day => (
          <div key={day} className="text-center font-bold text-xs lg:text-sm text-rpg-text-secondary pb-2 mb-2 border-b-2 border-rpg-border">
            {day}
          </div>
        ))}
        {blanks.map(blank => <div key={`blank-${blank}`} />)}
        {days.map(day => {
          const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day, 12); // avoid timezone issues
          const dateString = date.toISOString().split('T')[0];
          const hasQuest = getQuestsForDateStr(dateString).length > 0;
          const isActive = selectedDate.toDateString() === date.toDateString();

          return (
            <div
              key={day}
              className={`aspect-square relative flex items-center justify-center font-retro text-base cursor-pointer rounded border-2 transition-all ${
                isActive 
                  ? 'bg-rpg-gold text-rpg-text-primary border-rpg-text-primary shadow-[inset_0px_0px_0px_2px_#fff]' 
                  : 'bg-rpg-bg border-rpg-border text-rpg-text-primary hover:bg-[#F5DEB3] hover:-translate-y-0.5 hover:shadow-rpg-sm'
              }`}
              onClick={() => handleDateClick(date)}
            >
              {day}
              {hasQuest && (
                <div className="absolute bottom-1 right-1 w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-rpg-green" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
