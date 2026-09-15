import React from 'react';
import { ActiveScreen } from '../types/studymate';
import {
  Home,
  MessageSquare,
  CheckSquare,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';

interface BottomNavProps {
  activeScreen: ActiveScreen;
  onSelectScreen: (screen: ActiveScreen) => void;
  pendingTasksCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeScreen,
  onSelectScreen,
  pendingTasksCount,
}) => {
  const primaryTabs: { id: ActiveScreen; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'home', label: 'میز کار', icon: <Home className="w-5 h-5" /> },
    { id: 'tasks', label: 'برنامه‌ها', icon: <CheckSquare className="w-5 h-5" />, badge: pendingTasksCount },
    { id: 'daily_tests', label: 'تست‌ها', icon: <CheckCircle2 className="w-5 h-5" /> },
    { id: 'chat', label: 'مشاور', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'analysis', label: 'تحلیل', icon: <BarChart3 className="w-5 h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xs">
      <div className="max-w-xl mx-auto flex items-center justify-around px-2 py-1">
        {primaryTabs.map((tab) => {
          const isActive = activeScreen === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectScreen(tab.id)}
              className={`flex-1 py-1.5 px-1 flex flex-col items-center justify-center min-h-[50px] transition ${
                isActive ? 'text-[#9E1030]' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <div className={`transition-transform duration-150 ${isActive ? 'scale-105' : ''}`}>
                  {tab.icon}
                </div>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#9E1030] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] mt-0.5 ${
                  isActive ? 'font-bold text-[#9E1030]' : 'font-medium text-slate-500'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
