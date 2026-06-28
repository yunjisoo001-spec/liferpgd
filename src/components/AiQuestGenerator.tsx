"use client";

import React, { useRef, useEffect, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { Bot, Send, CalendarPlus, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Quest, StatType } from '@/types/quest';
import { useAuth } from '@/contexts/AuthContext';
import { createQuest } from '@/lib/questService';

interface ParsedQuest {
  title: string;
  description: string;
  xp: number;
  stat: StatType;
  statBonus: number;
}

const parseQuest = (aiResponse: string): ParsedQuest | null => {
  const titleMatch = aiResponse.match(/\*\*퀘스트 제목\*\*:?\s*(.+)/);
  const descMatch = aiResponse.match(/\*\*퀘스트 설명\*\*:?\s*(.+)/);
  const xpMatch = aiResponse.match(/\*\*보상 경험치\*\*:?\s*(\d+)\s*XP/i);
  const statMatch = aiResponse.match(/\*\*능력치 보상\*\*:?\s*([A-Z]+)\s*\+(\d+)/i);
  
  if (titleMatch && descMatch && xpMatch && statMatch) {
    return {
      title: titleMatch[1].trim(),
      description: descMatch[1].trim(),
      xp: parseInt(xpMatch[1], 10),
      stat: statMatch[1].trim() as StatType,
      statBonus: parseInt(statMatch[2], 10),
    };
  }
  return null;
};

interface AiQuestGeneratorProps {
  onRegisterQuest: (quest: Quest, date: string) => void;
  onClose?: () => void;
}

export default function AiQuestGenerator({ onRegisterQuest, onClose }: AiQuestGeneratorProps) {
  const { user } = useAuth();
  const { messages, status, error, sendMessage } = useChat() as any;
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isRegistering, setIsRegistering] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [registerError, setRegisterError] = useState('');

  const isLoading = status === 'submitted' || status === 'streaming';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value);

  const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !user) return;
    sendMessage({ text: input });
    setInput('');
  };

  const [selectedQuest, setSelectedQuest] = useState<ParsedQuest | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleRegisterClick = (quest: ParsedQuest) => {
    if (!user) return;
    setSelectedQuest(quest);
    setRegisterSuccess(false);
    setRegisterError('');
  };

  const confirmRegister = async () => {
    if (!selectedQuest || !selectedDate || !user) return;
    
    setIsRegistering(true);
    setRegisterError('');
    
    try {
      const { data, error } = await createQuest(user.id, {
        title: selectedQuest.title,
        description: selectedQuest.description,
        xp: selectedQuest.xp,
        stat: selectedQuest.stat,
        statBonus: selectedQuest.statBonus,
        date: selectedDate,
        status: 'pending'
      });

      if (error) throw new Error(typeof error === 'string' ? error : error?.message || JSON.stringify(error) || '알 수 없는 에러');

      if (data) {
        const newQuest: Quest = {
          id: data.id,
          title: data.title,
          description: data.description || '',
          xp: data.xp_reward || 0,
          stat: data.stat_type as any,
          statBonus: data.stat_bonus || 0,
          date: data.quest_date,
          completed: false,
          status: 'pending',
          createdAt: new Date(data.created_at)
        };
        onRegisterQuest(newQuest, selectedDate);
        setRegisterSuccess(true);
        setTimeout(() => setRegisterSuccess(false), 3000);
        setSelectedQuest(null); // 성공 시에만 모달 닫기
      }
    } catch (err: any) {
      console.error('Register error:', err);
      const errMsg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      setRegisterError(`퀘스트 등록에 실패했습니다: ${errMsg === '{}' ? '네트워크 오류 또는 서버 응답 에러' : errMsg}`);
    } finally {
      setIsRegistering(false);
    }
  };

  const displayMessages = messages.length > 0 ? messages : [
    { id: 'welcome', role: 'assistant', content: '오늘은 무엇을 정복할까요, 모험가님?' }
  ];

  return (
    <div className="flex flex-col h-full relative">
      {onClose && (
        <button onClick={onClose} className="absolute -top-2 -right-2 w-8 h-8 bg-rpg-wood text-[#FFD54F] border-2 border-rpg-border flex items-center justify-center rounded z-20 lg:hidden">
          <X size={20} />
        </button>
      )}

      {/* 등록 성공 알림 */}
      {registerSuccess && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-rpg-green text-white px-4 py-2 rounded-lg shadow-rpg border-2 border-rpg-border flex items-center gap-2 z-30 animate-bounce">
          <CheckCircle2 size={18} />
          <span className="font-pixel text-sm">퀘스트 등록 완료!</span>
        </div>
      )}

      <div className="bg-rpg-card border-4 border-rpg-border rounded p-4 mb-3 shadow-rpg-sm flex flex-col">
        <div className="flex items-center gap-3 border-b-2 border-dashed border-rpg-border pb-2 mb-2">
          <div className="w-10 h-10 bg-rpg-gold border-2 border-rpg-border flex items-center justify-center text-rpg-text-primary rounded-full">
            <Bot size={24} />
          </div>
          <div>
            <div className="font-pixel text-lg text-rpg-text-primary">AI 가이드</div>
            <div className="text-sm text-rpg-text-secondary">운명을 빚는 중...</div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[400px] overflow-y-auto bg-rpg-card border-4 border-rpg-border rounded p-3 mb-3 flex flex-col gap-3 shadow-inner">
        {displayMessages.map((msg: any) => {
          const isUser = msg.role === 'user';
          const messageText = msg.parts?.length 
            ? msg.parts.map((p: any) => p.text || '').join('')
            : (typeof msg.content === 'string' && msg.content) 
              ? msg.content 
              : msg.text || '';
          
          const parsedQuest = !isUser ? parseQuest(messageText) : null;
          const isLastMessage = msg.id === displayMessages[displayMessages.length - 1].id;

          return (
            <div key={msg.id} className={`max-w-[85%] p-3 rounded-lg border-2 border-rpg-border font-retro text-base shadow-rpg-sm whitespace-pre-wrap leading-relaxed ${isUser ? 'self-end bg-rpg-gold text-rpg-text-primary' : 'self-start bg-rpg-bg text-rpg-text-primary'}`}>
              {messageText}
              
              {parsedQuest && !isLoading && isLastMessage && (
                <div className="mt-3 pt-3 border-t-2 border-dashed border-rpg-border">
                  {!user ? (
                    <button disabled className="w-full bg-gray-400 text-white py-2 px-4 rounded border-2 border-gray-500 font-pixel text-sm flex items-center justify-center gap-2 shadow-rpg-sm opacity-70 cursor-not-allowed">
                      로그인이 필요합니다
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRegisterClick(parsedQuest)}
                      className="w-full bg-rpg-green text-white py-2 px-4 rounded border-2 border-rpg-border font-pixel text-sm flex items-center justify-center gap-2 cursor-pointer shadow-rpg-sm hover:brightness-110 active:translate-y-1 active:shadow-none transition-all"
                    >
                      <CalendarPlus size={16} />
                      퀘스트 등록
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {isLoading && (
          <div className="self-start bg-rpg-bg p-3 rounded-lg border-2 border-rpg-border font-retro text-base text-rpg-text-secondary animate-pulse">
            ...
          </div>
        )}
        {(error || registerError) && (
          <div className="self-center bg-red-100 text-red-800 p-3 rounded-lg border-2 border-red-800 font-retro text-sm flex items-center justify-between gap-3 shadow-rpg-sm">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{registerError || (error as any)?.message || '연결 오류가 발생했습니다.'}</span>
            </div>
            {registerError && (
              <button onClick={() => setRegisterError('')} className="hover:text-red-900 focus:outline-none">
                <X size={16} />
              </button>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={onFormSubmit} className="flex gap-2">
        <input
          type="text"
          className="flex-1 bg-[#F5DEB3] border-4 border-rpg-border p-3 font-retro text-base text-rpg-text-primary focus:outline-none focus:border-rpg-gold placeholder:text-rpg-text-secondary shadow-inner rounded"
          placeholder={user ? "계획을 말해주세요..." : "로그인 후 이용 가능합니다"}
          value={input}
          onChange={handleInputChange}
          disabled={isLoading || !user}
        />
        <button 
          type="submit"
          className="bg-rpg-gold text-rpg-text-primary border-4 border-rpg-border px-4 flex items-center justify-center shadow-rpg-sm hover:bg-rpg-gold-hover active:translate-y-1 active:shadow-none transition-all rounded disabled:opacity-50"
          disabled={isLoading || !user || !input.trim()}
        >
          <Send size={20} />
        </button>
      </form>

      {/* Date Selection Modal */}
      {selectedQuest && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-40 rounded">
          <div className="bg-rpg-bg p-6 rounded-lg border-4 border-rpg-border w-[90%] font-retro">
            <div className="flex justify-between mb-4">
              <h3 className="font-pixel text-lg">언제 수행할까요?</h3>
              <button onClick={() => setSelectedQuest(null)} disabled={isRegistering} className="text-rpg-text-secondary hover:text-rpg-text-primary">
                <X size={20} />
              </button>
            </div>
            
            <input 
              type="date" 
              className="w-full bg-[#F5DEB3] border-4 border-rpg-border p-3 mb-4 font-retro text-rpg-text-primary focus:outline-none focus:border-rpg-gold"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              disabled={isRegistering}
            />

            <div className="flex gap-2">
              <button 
                onClick={() => setSelectedQuest(null)}
                disabled={isRegistering}
                className="flex-1 py-2 bg-rpg-card border-4 border-rpg-border font-pixel text-sm hover:bg-rpg-wood transition-colors rounded disabled:opacity-50"
              >
                취소
              </button>
              <button 
                onClick={confirmRegister}
                disabled={isRegistering}
                className="flex-1 py-2 bg-rpg-gold text-rpg-text-primary border-4 border-rpg-border font-pixel text-sm hover:bg-rpg-gold-hover transition-colors rounded disabled:opacity-50"
              >
                {isRegistering ? '등록 중...' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
