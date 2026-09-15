import React from 'react';
import {
  StructuredUserContext,
  UnifiedDeadline,
} from '../types/academic';
import {
  Clock,
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Cpu,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { ActiveTab } from './Navigation';

interface OverviewViewProps {
  context: StructuredUserContext;
  onNavigate: (tab: ActiveTab) => void;
  onQuickSimulate: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  context,
  onNavigate,
  onQuickSimulate,
}) => {
  const { metrics, upcomingDeadlines, exams, schoolSchedule, dailyTests, userPreferences } = context;

  // Filter today's day of week
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayNames[new Date().getDay()] || 'Monday';
  const todaysClasses = schoolSchedule.filter((s) => s.dayOfWeek === todayName);

  // Urgent deadlines (< 7 days)
  const urgentDeadlines = upcomingDeadlines.filter((d) => !d.completed && d.urgencyDays <= 7);

  return (
    <div className="space-y-6">
      {/* Architecture Readiness Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 rounded-xl p-5 text-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
              AI Structured Context Ready
            </span>
            <span className="text-xs text-indigo-300 font-medium">
              8 Function Declarations • Controlled Action Registry Active
            </span>
          </div>
          <h2 className="text-lg font-semibold text-white">
            Personal Study Advisor Architecture
          </h2>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            All 9 structured context domains (tasks, goals, exams, deadlines, schedule, daily tests, study history, performance, preferences) are actively compiled server-side. Gemini can be attached seamlessly without modifying database models or UI.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            id="btn-inspect-architecture"
            onClick={() => onNavigate('ai_inspector')}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
          >
            <Cpu className="w-4 h-4" />
            <span>Inspect AI Context & Actions</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Pending Tasks</span>
            <CheckCircle2 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {metrics.pendingTasksCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {metrics.completedTasksCount} completed
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Scheduled Exams</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {metrics.upcomingExamsCount}
            </span>
            <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              Next: {exams[0]?.title ? `${exams[0].subject}` : 'None'}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Study Hours (Week)</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {metrics.totalStudyHoursThisWeek}h
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Target: {userPreferences.targetDailyStudyHours * 7}h/wk
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Quiz Performance</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {metrics.averageTestScore}%
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              Across {dailyTests.length} tests
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Deadlines & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Urgent Deadlines (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Urgent Deadlines Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Immediate Deadlines & Approaching Milestones
                </h3>
              </div>
              <button
                onClick={() => onNavigate('tasks')}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
              >
                <span>View all tasks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {urgentDeadlines.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
                No immediate deadlines due in the next 7 days.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {urgentDeadlines.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium ${
                            item.type === 'exam'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300'
                              : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300'
                          }`}
                        >
                          {item.type.toUpperCase()}
                        </span>
                        <span className="font-medium text-sm text-slate-900 dark:text-white">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.subject} • Due: {item.dueDate}
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          item.urgencyDays <= 2
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {item.urgencyDays <= 0 ? 'Due Today' : `In ${item.urgencyDays} day${item.urgencyDays > 1 ? 's' : ''}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Exam Countdown Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Target Exam Readiness Tracker
                </h3>
              </div>
              <button
                onClick={() => onNavigate('goals_exams')}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
              >
                <span>Manage Exams</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 space-y-2.5"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                      {exam.title}
                    </h4>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {exam.examDate}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Course Weight: <span className="font-medium text-slate-900 dark:text-white">{exam.weightPercentage}%</span>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500 dark:text-slate-400">Syllabus Readiness</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{exam.currentReadinessPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          exam.currentReadinessPercentage >= 80
                            ? 'bg-emerald-500'
                            : exam.currentReadinessPercentage >= 65
                            ? 'bg-indigo-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${exam.currentReadinessPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Today's Schedule & Quick AI Simulation */}
        <div className="space-y-6">
          {/* Today's Schedule Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Today's Classes ({todayName})
                </h3>
              </div>
              <button
                onClick={() => onNavigate('schedule_study')}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Full Week
              </button>
            </div>

            {todaysClasses.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
                No scheduled lectures or labs today. Prime time for deep study!
              </p>
            ) : (
              <div className="space-y-3">
                {todaysClasses.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-start space-x-3"
                    style={{ borderLeftWidth: '4px', borderLeftColor: item.color }}
                  >
                    <div className="space-y-0.5 flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                          {item.courseCode}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {item.startTime} - {item.endTime}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {item.courseName}
                      </p>
                      <p className="text-xs text-slate-400">
                        {item.room || 'Main Hall'} • {item.instructor || 'Staff'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick AI Diagnostic Card */}
          <div className="bg-slate-900 text-white rounded-xl border border-slate-800 p-5 space-y-3 shadow-xs">
            <div className="flex items-center space-x-2 text-indigo-400">
              <Sparkles className="w-4 h-4" />
              <h4 className="text-xs font-semibold uppercase tracking-wider">
                Simulate AI Advisor Review
              </h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Test how the AI advisor reasons through your structured context (Calculus test gaps, Organic Chemistry lab, upcoming exams) to propose safe server-side actions.
            </p>
            <button
              id="btn-quick-advisor-run"
              onClick={onQuickSimulate}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Run Diagnostic Simulation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
