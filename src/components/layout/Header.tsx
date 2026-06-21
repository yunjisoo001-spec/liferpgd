"use client";

import React, { useState } from 'react';
import { Menu, User, Sparkles, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  onToggleSidebar: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Header({ onToggleSidebar, activeTab, onTabChange }: HeaderProps) {
  const { user, signOut } = useAuth();
  const [showUserInfo, setShowUserInfo] = useState(false);

  const tabs = [
    { id: 'dashboard', label: '대시보드' },
    { id: 'quests', label: '퀘스트' },
    { id: 'character', label: '캐릭터' },
    { id: 'journal', label: '일지' },
  ];

  const handleLogout = async () => {
    if (signOut) {
      await signOut();
    }
    window.location.href = '/login';
  };

  return (
    <header className="h-16 flex items-center justify-between px-5 bg-[#6D4C41] text-rpg-gold border-b-4 border-[#4E342E] shadow-rpg font-retro relative z-20">
      <div className="flex items-center gap-4 mr-8">
        <button 
          className="flex items-center justify-center w-10 h-10 text-rpg-gold border-2 border-transparent hover:border-rpg-gold hover:bg-rpg-gold/10 rounded transition-all lg:hidden" 
          onClick={onToggleSidebar} 
          aria-label="Toggle Sidebar"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-2xl font-pixel text-[#FFD54F] tracking-wider drop-shadow-[2px_2px_0px_#3E2723] flex items-center gap-2 m-0">
          <Sparkles size={20} /> Life Quest RPG
        </h1>
      </div>
      
      <div className="flex items-center gap-6">
        <nav className="hidden md:flex gap-6 font-retro text-xl">
          {tabs.map(tab => (
            <span 
              key={tab.id}
              className={`cursor-pointer transition-colors ${activeTab === tab.id ? 'text-[#FFF59D] drop-shadow-[1px_1px_0px_#3E2723]' : 'text-rpg-gold hover:text-[#FFF59D] hover:drop-shadow-[1px_1px_0px_#3E2723]'}`}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </span>
          ))}
        </nav>
        
        <div className="relative">
          <button 
            className="flex items-center justify-center w-10 h-10 text-rpg-gold border-2 border-transparent hover:border-rpg-gold hover:bg-rpg-gold/10 rounded transition-all" 
            aria-label="Profile"
            onClick={() => setShowUserInfo(!showUserInfo)}
          >
            <User size={24} />
          </button>

          {/* 유저 정보 툴팁 */}
          {showUserInfo && user && (
            <div className="absolute top-[50px] right-0 w-[220px] bg-rpg-card border-4 border-rpg-border rounded-lg p-3 shadow-rpg z-50 animate-fade-in text-rpg-text-primary">
              <div className="font-pixel text-lg mb-3 border-b-2 border-dashed border-rpg-border pb-2 flex items-center gap-2">
                <User size={18} /> 모험가 정보
              </div>
              <div className="text-xs text-rpg-text-secondary mb-1">모험가 이메일</div>
              <div className="text-sm font-bold break-all mb-3">{user.email}</div>
              
              <div className="text-xs text-rpg-text-secondary mb-1">고유 식별 코드</div>
              <div className="text-[10px] opacity-70 break-all mb-3">{user.id}</div>
              
              <div className="text-[10px] text-red-500 mb-4">* 비밀번호는 서버에 안전하게 보관 중입니다.</div>

              <button 
                onClick={handleLogout}
                className="w-full bg-rpg-wood text-[#FFD54F] border-2 border-rpg-border py-2 rounded font-pixel flex items-center justify-center gap-2 hover:brightness-110 active:translate-y-1 transition-all"
              >
                <LogOut size={16} /> 로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
