import React from 'react';
import { ActiveScreen } from '../types/studymate';
import { getTodayPersianDisplay } from '../utils/persianDate';
import { RotateCcw } from 'lucide-react';

interface AppHeaderProps {
  activeScreen: ActiveScreen;
  onResetData: () => void;
  isSyncing?: boolean;
}

const SCREEN_TITLES: Record<ActiveScreen, { title: string }> = {
  home: { title: 'میز کار' },
  chat: { title: 'مشاور هوشمند' },
  tasks: { title: 'برنامه‌ها و وظایف' },
  goals: { title: 'اهداف تحصیلی' },
  exams: { title: 'آزمون‌ها و مهلت‌ها' },
  schedule: { title: 'برنامه مدرسه' },
  daily_tests: { title: 'تست‌های روزانه' },
  analysis: { title: 'تحلیل عملکرد' },
};

export const AppHeader: React.FC<AppHeaderProps> = ({ activeScreen, onResetData, isSyncing = false }) => {
  const currentInfo = SCREEN_TITLES[activeScreen];
  const todayPersian = getTodayPersianDisplay();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2.5 shadow-xs">
      <div className="max-w-xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-reverse space-x-3">
          <div className="w-8 h-8 rounded-lg bg-[#9E1030] flex items-center justify-center text-white font-bold text-sm tracking-tight shrink-0">
            <span>SM</span>
          </div>

          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">
              {currentInfo.title}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {todayPersian} {isSyncing ? '• درحال ذخیره...' : ''}
            </p>
          </div>
        </div>

        <button
          onClick={onResetData}
          title="بازنشانی پایگاه داده به نمونه اولیه"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
