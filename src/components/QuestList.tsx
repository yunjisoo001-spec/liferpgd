import React, { useState } from 'react';
import { BookOpen, SearchX, Filter } from 'lucide-react';
import { Quest } from '@/types/quest';
import { completeQuest, updateQuestStatus, getQuestsByDate } from '@/lib/questService';
import { useAuth } from '@/contexts/AuthContext';

interface QuestListProps {
  title: string;
  quests: Quest[];
  selectedDate?: Date | null;
  onRegister?: (id: string) => void;
  onQuestsUpdated?: (dateStr: string, quests: Quest[]) => void;
  isRegisteredList?: boolean;
}

type FilterType = 'all' | 'pending' | 'completed' | 'abandoned';

export default function QuestList({ title, quests, selectedDate, onRegister, onQuestsUpdated, isRegisteredList }: QuestListProps) {
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const formattedDate = selectedDate ? `${selectedDate.getFullYear()}년 ${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일` : '';

  const refreshQuests = async () => {
    if (!user || !selectedDate || !onQuestsUpdated) return;
    const dateStr = selectedDate.toISOString().split('T')[0];
    const { data } = await getQuestsByDate(user.id, dateStr);
    if (data) {
      onQuestsUpdated(dateStr, data);
    }
  };

  const handleComplete = async (e: React.MouseEvent, questId: string) => {
    e.stopPropagation();
    if (!user) return;
    
    setIsProcessing(questId);
    try {
      const { success, error } = await completeQuest(questId, user.id);
      if (error) throw error;
      
      if (success) {
        alert('🎉 퀘스트를 완료했습니다! 경험치와 능력치가 올랐습니다!');
        await refreshQuests();
      }
    } catch (err) {
      console.error(err);
      alert('완료 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleAbandon = async (e: React.MouseEvent, questId: string) => {
    e.stopPropagation();
    if (!user) return;
    
    if (!confirm('정말로 이 퀘스트를 포기하시겠습니까?')) return;

    setIsProcessing(questId);
    try {
      const { error } = await updateQuestStatus(questId, 'abandoned');
      if (error) throw error;
      await refreshQuests();
    } catch (err) {
      console.error(err);
      alert('처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(null);
    }
  };

  const filteredQuests = quests.filter(q => {
    if (filter === 'all') return true;
    if (filter === 'completed') return q.status === 'completed';
    if (filter === 'abandoned') return q.status === 'abandoned';
    return q.status === 'pending' || q.status === 'in-progress';
  });

  return (
    <div className="bg-rpg-bg border-4 border-rpg-border rounded-lg p-6 relative">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6 pb-4 border-b-2 border-dashed border-rpg-border">
        <div className="flex items-center gap-3">
          <BookOpen size={24} className="text-rpg-gold" />
          <h2 className="font-pixel text-xl text-rpg-text-primary">{title}</h2>
        </div>
        
        {isRegisteredList && (
          <div className="flex items-center gap-4 ml-auto">
            {/* Filter */}
            <div className="flex items-center gap-2 font-retro text-sm">
              <Filter size={16} className="text-rpg-text-secondary" />
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value as FilterType)}
                className="bg-[#F5DEB3] border-2 border-rpg-border rounded p-1 outline-none"
              >
                <option value="all">전체</option>
                <option value="pending">진행 중</option>
                <option value="completed">완료됨</option>
                <option value="abandoned">포기함</option>
              </select>
            </div>
            {formattedDate && (
              <span className="font-retro text-base text-rpg-text-secondary hidden md:block">
                {formattedDate}
              </span>
            )}
          </div>
        )}
      </div>

      {filteredQuests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-rpg-text-secondary font-retro">
          <SearchX size={48} className="mb-4 opacity-50" />
          <p className="text-xl">해당하는 퀘스트가 없습니다.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredQuests.map(quest => {
            const isExpanded = expandedId === quest.id;
            const isCompleted = quest.status === 'completed';
            const isAbandoned = quest.status === 'abandoned';
            const processing = isProcessing === quest.id;

            return (
              <div key={quest.id}>
                {/* Main Button */}
                <button 
                  onClick={() => setExpandedId(isExpanded ? null : quest.id)}
                  className={`w-full flex items-center p-4 border-4 border-rpg-border font-retro text-xl text-left transition-all shadow-rpg-sm hover:translate-y-[-2px] hover:shadow-rpg ${
                    isCompleted ? 'bg-gray-200 text-gray-500 line-through' : 
                    isAbandoned ? 'bg-red-50 text-red-400 line-through' :
                    'bg-white text-rpg-text-primary'
                  } ${isExpanded ? 'rounded-t-lg border-b-0 shadow-none hover:translate-y-0' : 'rounded-lg'}`}
                >
                  <span className="mr-4">
                    {isCompleted ? '✅' : isAbandoned ? '❌' : '📖'}
                  </span>
                  <span className={`flex-1 font-bold ${isCompleted || isAbandoned ? 'opacity-60' : ''}`}>
                    {quest.title}
                  </span>
                  <span className="text-sm text-rpg-text-secondary">
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </button>

                {/* Expanded Area */}
                {isExpanded && (
                  <div className={`border-4 border-rpg-border border-t-0 rounded-b-lg p-5 font-retro text-lg ${
                    isCompleted || isAbandoned ? 'bg-gray-100 text-gray-500' : 'bg-white text-rpg-text-primary'
                  }`}>
                    <p className={`mb-6 whitespace-pre-wrap leading-relaxed ${isCompleted || isAbandoned ? 'text-gray-400' : 'text-rpg-text-secondary'}`}>
                      "{quest.description}"
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-6">
                      <div className={`px-3 py-1 rounded-full text-sm font-bold border-2 ${
                        isCompleted || isAbandoned ? 'bg-gray-200 border-gray-300' : 'bg-[#FFF8E1] border-[#FFD54F]'
                      }`}>
                        🏆 {quest.xp} XP
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-bold border-2 ${
                        isCompleted || isAbandoned ? 'bg-gray-200 border-gray-300' : 'bg-[#E8F5E9] border-[#81C784]'
                      }`}>
                        📈 +{quest.statBonus} {quest.stat}
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3">
                      {!isRegisteredList && onRegister && !isCompleted && !isAbandoned && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onRegister(quest.id); }}
                          className="bg-rpg-gold border-2 border-rpg-border rounded py-2 px-6 text-[#3E2723] font-pixel text-sm shadow-rpg-sm hover:bg-rpg-gold-hover active:translate-y-1 active:shadow-none transition-all"
                        >
                          퀘스트 등록
                        </button>
                      )}
                      
                      {isRegisteredList && !isCompleted && !isAbandoned && (
                        <>
                          <button 
                            onClick={(e) => handleAbandon(e, quest.id)}
                            disabled={processing}
                            className="bg-[#E53935] border-2 border-rpg-border rounded py-2 px-6 text-white font-pixel text-sm shadow-rpg-sm hover:bg-red-700 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
                          >
                            퀘스트 포기
                          </button>
                          <button 
                            onClick={(e) => handleComplete(e, quest.id)}
                            disabled={processing}
                            className="bg-rpg-green border-2 border-rpg-border rounded py-2 px-6 text-white font-pixel text-sm shadow-rpg-sm hover:brightness-110 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
                          >
                            {processing ? '처리 중...' : '완료하기'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
