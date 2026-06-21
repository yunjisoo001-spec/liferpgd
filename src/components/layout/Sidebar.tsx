import React from 'react';
import { Home, BarChart2, TrendingUp } from 'lucide-react';
import styles from './layout.module.css';

interface SidebarProps {
  isOpen: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Sidebar({ isOpen, activeTab, onTabChange }: SidebarProps) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'stats', label: 'Growth Stats', icon: TrendingUp },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
  ];

  return (
    <aside className={`${styles.sidebar} ${!isOpen ? styles.closed : ''}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            className={`${styles.navItem} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <Icon size={20} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </aside>
  );
}
