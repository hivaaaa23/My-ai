import React from 'react';
import { ActiveScreen } from '../types/studymate';
import { getTodayPersianDisplay } from '../utils/persianDate';
import { RotateCcw, Bell } from 'lucide-react';

interface AppHeaderProps {
  activeScreen: ActiveScreen;
  onResetData: () => void;
  isSyncing?: boolean;
  onOpenNotifications?: () => void;
  activeAlertsCount?: number;
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

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeScreen,
  onResetData,
  isSyncing = false,
  onOpenNotifications,
  activeAlertsCount = 0,
}) => {
  const currentInfo = SCREEN_TITLES[activeScreen];
  const todayPersian = getTodayPersianDisplay();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-300 px-4 py-3 shadow-xs">
      <div className="max-w-xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-reverse space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[#BE123C] flex items-center justify-center text-white font-extrabold text-sm tracking-tight shrink-0 shadow-xs">
            <span>SM</span>
          </div>

          <div>
            <h1 className="text-base font-extrabold text-slate-950 leading-tight">
              {currentInfo.title}
            </h1>
            <p className="text-xs text-slate-600 font-semibold mt-0.5">
              {todayPersian} {isSyncing ? '• درحال ذخیره...' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-reverse space-x-2">
          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              title="مرکز اعلانات و یادآورهای کنکور"
              className="relative p-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition border border-slate-200"
            >
              <Bell className="w-4 h-4" />
              {activeAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#BE123C] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-pulse">
                  {activeAlertsCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={onResetData}
            title="بازنشانی پایگاه داده به نمونه اولیه"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition border border-slate-200"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

