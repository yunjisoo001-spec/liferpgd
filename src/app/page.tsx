"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import AiQuestGenerator from '@/components/AiQuestGenerator';
import Calendar from '@/components/Calendar';
import QuestList from '@/components/QuestList';
import StatsTab from '@/components/StatsTab';
import GrowthDashboard from '@/components/GrowthDashboard';
import JournalMemo from '@/components/JournalMemo';
import { Quest } from '@/types/quest';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile AI sidebar
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setSelectedDate(new Date());
    setMounted(true);
  }, []);

  const [registeredQuests, setRegisteredQuests] = useState<Quest[]>([]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleRegisterQuest = (quest: Quest, dateStr: string) => {
    if (selectedDate && dateStr === selectedDate.toISOString().split('T')[0]) {
      setRegisteredQuests(prev => [...prev, quest]);
    }
    // Note: If registering for another date, Calendar will fetch it when selected.
  };

  const handleQuestsLoaded = (dateStr: string, quests: Quest[]) => {
    setRegisteredQuests(quests);
  };

  if (!mounted || !selectedDate) return null;

  const currentQuests = registeredQuests;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-rpg-bg">
      <Header onToggleSidebar={toggleSidebar} activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 flex overflow-hidden max-w-[1400px] mx-auto w-full p-2 lg:p-4 gap-4 relative">
        
        {/* Left Area: AI Quest Generator (Hidden on Mobile unless sidebarOpen, visible on md/lg) */}
        <aside className={`
          fixed md:relative top-0 left-0 w-full md:w-[350px] lg:w-[400px] h-full md:h-auto z-50 md:z-auto
          bg-black/50 md:bg-transparent
          transition-all duration-300
          ${sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible md:opacity-100 md:visible'}
        `}>
          <div className={`
            absolute md:relative right-0 top-0 w-full max-w-[400px] md:max-w-none h-full bg-rpg-bg p-4 md:p-0
            transform transition-transform duration-300 md:transform-none
            ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
            flex flex-col
          `}>
            <AiQuestGenerator onRegisterQuest={handleRegisterQuest} onClose={() => setSidebarOpen(false)} />
          </div>
        </aside>
        
        {/* Middle Area: Main Content (Calendar / Dashboard / Quests) */}
        <main className="flex-1 flex flex-col max-w-[800px] overflow-y-auto px-2 pb-6 custom-scrollbar">
          {activeTab === 'dashboard' && <GrowthDashboard />}
          
          {(activeTab === 'quests' || activeTab === 'journal') && (
            <div className="flex flex-col gap-5">
              <Calendar 
                selectedDate={selectedDate} 
                onSelectDate={setSelectedDate}
                onQuestsLoaded={handleQuestsLoaded}
              />
              
              <QuestList 
                title={activeTab === 'quests' ? '오늘의 퀘스트' : '해당일 퀘스트 내역'} 
                quests={currentQuests}
                onQuestsUpdated={handleQuestsLoaded}
                isRegisteredList={true}
                selectedDate={selectedDate}
              />

              {activeTab === 'journal' && (
                <JournalMemo selectedDate={selectedDate} />
              )}
            </div>
          )}

          {/* Show Stats in main area ONLY on mobile/tablet when Character tab is active */}
          {activeTab === 'character' && (
            <div className="block lg:hidden mt-4 h-full">
              <StatsTab />
            </div>
          )}
        </main>

        {/* Right Area: Character Stats (Always visible on lg Desktop) */}
        <aside className="hidden lg:block w-[350px]">
          <StatsTab />
        </aside>
      </div>
    </div>
  );
}
