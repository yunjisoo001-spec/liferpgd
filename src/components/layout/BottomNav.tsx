import React from 'react';
import { Home, BarChart2, TrendingUp, User } from 'lucide-react';
import styles from './layout.module.css';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'stats', label: 'Stats', icon: TrendingUp },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className={styles.bottomNav}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            className={`${styles.bottomNavItem} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <Icon size={24} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
