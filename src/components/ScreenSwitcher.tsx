import React from 'react';
import { ActiveScreen } from '../types/studymate';
import {
  Home,
  MessageSquare,
  CheckSquare,
  Target,
  CalendarDays,
  Clock,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';

interface ScreenSwitcherProps {
  activeScreen: ActiveScreen;
  onSelectScreen: (screen: ActiveScreen) => void;
  pendingTasksCount: number;
  upcomingExamsCount: number;
}

export const ScreenSwitcher: React.FC<ScreenSwitcherProps> = ({
  activeScreen,
  onSelectScreen,
  pendingTasksCount,
  upcomingExamsCount,
}) => {
  const items: { id: ActiveScreen; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'home', label: 'میز کار', icon: <Home className="w-3.5 h-3.5" /> },
    { id: 'chat', label: 'مشاور', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { id: 'tasks', label: 'برنامه‌ها', icon: <CheckSquare className="w-3.5 h-3.5" />, badge: pendingTasksCount },
    { id: 'daily_tests', label: 'تست‌ها', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    { id: 'schedule', label: 'مدرسه', icon: <Clock className="w-3.5 h-3.5" /> },
    { id: 'exams', label: 'آزمون‌ها', icon: <CalendarDays className="w-3.5 h-3.5" />, badge: upcomingExamsCount },
    { id: 'goals', label: 'اهداف', icon: <Target className="w-3.5 h-3.5" /> },
    { id: 'analysis', label: 'تحلیل', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="bg-white/80 border-b border-slate-200/80 px-3 py-1.5">
      <div className="max-w-xl mx-auto overflow-x-auto scrollbar-none flex space-x-reverse space-x-1.5 py-0.5">
        {items.map((item) => {
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectScreen(item.id)}
              className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-medium flex items-center space-x-reverse space-x-1 transition shrink-0 ${
                isActive
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`px-1 py-0.2 rounded-full text-[9px] font-bold ${
                    isActive
                      ? 'bg-[#9E1030] text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
