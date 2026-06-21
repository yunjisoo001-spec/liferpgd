import React, { useState, useEffect } from 'react';
import { BookOpen, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getMemoByDate, upsertMemo } from '@/lib/memoService';

interface JournalMemoProps {
  selectedDate?: Date | null;
}

export default function JournalMemo({ selectedDate }: JournalMemoProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const formattedDate = selectedDate 
    ? `${selectedDate.getFullYear()}년 ${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일` 
    : '';
  const dateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : '';

  useEffect(() => {
    const loadMemo = async () => {
      if (!user || !dateStr) return;
      setIsLoading(true);
      setContent('');
      setSaveMessage('');
      const { data } = await getMemoByDate(user.id, dateStr);
      if (data) {
        setContent(data.content);
      }
      setIsLoading(false);
    };

    loadMemo();
  }, [user, dateStr]);

  const handleSave = async () => {
    if (!user || !dateStr) return;
    
    setIsSaving(true);
    setSaveMessage('');
    const { error } = await upsertMemo(user.id, dateStr, content);
    
    if (!error) {
      setSaveMessage('성공적으로 저장되었습니다.');
      setTimeout(() => setSaveMessage(''), 3000);
    } else {
      setSaveMessage('저장에 실패했습니다.');
    }
    setIsSaving(false);
  };

  if (!selectedDate) {
    return (
      <div className="bg-[#FFF8E7] border-4 border-[#8D6E63] p-4 flex flex-col items-center justify-center min-h-[300px] shadow-rpg font-retro text-rpg-text-secondary">
        날짜를 선택해주세요.
      </div>
    );
  }

  return (
    <div className="bg-[#FFF8E7] border-4 border-[#8D6E63] p-0 flex flex-col shadow-rpg font-retro relative overflow-hidden">
      {/* Title Header */}
      <div className="bg-[#8D6E63] text-rpg-gold px-4 py-3 flex items-center justify-between border-b-4 border-[#5D4037]">
        <h2 className="text-xl font-pixel drop-shadow-md flex items-center gap-2">
          <BookOpen size={20} />
          모험가 일지 ({formattedDate})
        </h2>
        {isLoading && <Loader2 className="animate-spin text-rpg-gold" size={20} />}
      </div>

      {/* Content Area */}
      <div className="p-4 flex flex-col gap-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="오늘의 모험, 배운 점, 느낀 점을 자유롭게 기록하세요..."
          className="w-full h-[300px] p-4 bg-transparent border-2 border-dashed border-[#A1887F] rounded resize-none focus:outline-none focus:border-[#5D4037] focus:bg-white/50 transition-colors font-retro text-rpg-text-primary leading-relaxed custom-scrollbar placeholder:text-rpg-text-secondary/50"
          disabled={isLoading || isSaving}
        />
        
        {/* Action Bar */}
        <div className="flex items-center justify-between mt-2">
          <div className="text-sm">
            {saveMessage && (
              <span className={`animate-fade-in ${saveMessage.includes('성공') ? 'text-green-700' : 'text-red-600'}`}>
                {saveMessage}
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={isLoading || isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-rpg-wood text-[#FFD54F] border-2 border-[#5D4037] rounded font-pixel hover:brightness-110 active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            일지 저장
          </button>
        </div>
      </div>
    </div>
  );
}
