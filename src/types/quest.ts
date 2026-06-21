export type StatType = 'INT' | 'VIT' | 'COM' | 'CRE' | 'FOC';

export interface Quest {
  id: string;
  title: string;
  description: string;
  xp: number;
  stat: StatType;
  statBonus: number;
  date: string; // YYYY-MM-DD 형식
  completed: boolean;
  status: 'pending' | 'in-progress' | 'completed' | 'abandoned';
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  questData?: Partial<Quest>;
}

export interface Character {
  level: number;
  xp: number;
  maxXp: number;
  stats: {
    INT: number;
    VIT: number;
    COM: number;
    CRE: number;
    FOC: number;
  };
}
