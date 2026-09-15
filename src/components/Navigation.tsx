import React from 'react';
import {
  GraduationCap,
  LayoutDashboard,
  CheckSquare,
  Target,
  Calendar,
  Award,
  Sliders,
  Cpu,
  RefreshCw,
} from 'lucide-react';

export type ActiveTab =
  | 'overview'
  | 'tasks'
  | 'goals_exams'
  | 'schedule_study'
  | 'tests_performance'
  | 'preferences'
  | 'ai_inspector';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  pendingTasksCount: number;
  upcomingExamsCount: number;
  onRefreshContext: () => void;
  isLoading: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  pendingTasksCount,
  upcomingExamsCount,
  onRefreshContext,
  isLoading,
}) => {
  const tabs = [
    { id: 'overview' as ActiveTab, label: 'Overview', icon: LayoutDashboard },
    {
      id: 'tasks' as ActiveTab,
      label: 'Tasks & Deadlines',
      icon: CheckSquare,
      badge: pendingTasksCount > 0 ? pendingTasksCount : undefined,
    },
    {
      id: 'goals_exams' as ActiveTab,
      label: 'Goals & Exams',
      icon: Target,
      badge: upcomingExamsCount > 0 ? `${upcomingExamsCount} Exams` : undefined,
    },
    { id: 'schedule_study' as ActiveTab, label: 'Schedule & Study Log', icon: Calendar },
    { id: 'tests_performance' as ActiveTab, label: 'Tests & Performance', icon: Award },
    { id: 'preferences' as ActiveTab, label: 'Preferences', icon: Sliders },
    {
      id: 'ai_inspector' as ActiveTab,
      label: 'AI Bridge & Architecture',
      icon: Cpu,
      highlight: true,
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Student Identity */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-sm flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">StudyAdvisor</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                  Gemini Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">Decoupled Academic Workspace & AI Context Engine</p>
            </div>
          </div>

          {/* Quick Context Refresh & Info */}
          <div className="flex items-center space-x-4">
            <button
              id="btn-refresh-context"
              onClick={onRefreshContext}
              disabled={isLoading}
              title="Sync & rebuild structured AI context"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
              <span className="hidden sm:inline">Sync AI Context</span>
            </button>
            <div className="hidden md:flex flex-col items-end text-xs">
              <span className="text-slate-300 font-medium">Alex Vance</span>
              <span className="text-slate-400">CS & Pre-Med Track</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-800/80">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? tab.highlight
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800 text-white border-b-2 border-indigo-400'
                    : tab.highlight
                    ? 'text-indigo-300 hover:bg-indigo-950/50 hover:text-indigo-200'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.highlight ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 text-xs font-semibold rounded-full ${
                      isActive ? 'bg-indigo-900 text-white' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
                {tab.highlight && !tab.badge && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
