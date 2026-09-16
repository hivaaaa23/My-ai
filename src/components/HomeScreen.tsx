import React from 'react';
import { Task, Exam, DailyQuote, ActiveScreen, DailyTestItem } from '../types/studymate';
import {
  calculateDaysRemaining,
  toPersianDigits,
} from '../utils/persianDate';
import {
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  ArrowLeft,
  BookOpen,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface HomeScreenProps {
  tasks: Task[];
  exams: Exam[];
  dailyTests: DailyTestItem[];
  quote: DailyQuote;
  onNavigate: (screen: ActiveScreen) => void;
  onToggleTask: (taskId: string) => void;
  onQuickAddTask: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  tasks,
  exams,
  dailyTests: _dailyTests,
  quote,
  onNavigate,
  onToggleTask,
  onQuickAddTask,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter((t) => t.dueDate === todayStr);
  const completedTodayCount = todayTasks.filter((t) => t.completed).length;
  const progressPercent = todayTasks.length > 0 ? Math.round((completedTodayCount / todayTasks.length) * 100) : 0;

  // Important upcoming exam
  const sortedUpcomingExams = [...exams]
    .map((ex) => ({ ...ex, countdown: calculateDaysRemaining(ex.date) }))
    .filter((ex) => !ex.countdown.isPast)
    .sort((a, b) => a.countdown.days - b.countdown.days);
  const nextImportantExam = sortedUpcomingExams.find((e) => e.isImportant) || sortedUpcomingExams[0];

  return (
    <div className="space-y-4 pb-20 max-w-xl mx-auto">
      {/* 1. Clean Summary Card */}
      <section className="bg-white rounded-xl p-4 border border-slate-300 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-slate-950">پیشرفت امروز</h2>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              {toPersianDigits(completedTodayCount)} از {toPersianDigits(todayTasks.length)} پارت انجام شده
            </p>
          </div>
          <span className="text-lg font-black text-[#BE123C]">
            {toPersianDigits(progressPercent)}٪
          </span>
        </div>

        {/* Minimal Progress Bar */}
        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-[#BE123C] h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Compact Next Exam Indicator */}
        {nextImportantExam && (
          <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-700 truncate font-medium">
              آزمون بعدی: <strong className="text-slate-950 font-bold">{nextImportantExam.title}</strong>
            </span>
            <button
              onClick={() => onNavigate('exams')}
              className="text-[#BE123C] hover:underline shrink-0 font-bold mr-2"
            >
              {nextImportantExam.countdown.label}
            </button>
          </div>
        )}
      </section>

      {/* 2. Today's Study Tasks (Main Cockpit) */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-extrabold text-slate-950">پارت‌های مطالعه امروز</h3>
          <button
            onClick={onQuickAddTask}
            className="text-xs font-bold text-white bg-[#BE123C] hover:bg-[#9F1239] px-3.5 py-1.5 rounded-lg flex items-center space-x-reverse space-x-1.5 transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>افزودن پارت</span>
          </button>
        </div>

        {todayTasks.length === 0 ? (
          <div className="bg-white rounded-xl p-8 border border-slate-300 text-center space-y-2">
            <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-700 font-medium">برای امروز هنوز پارتی ثبت نشده است.</p>
            <div className="flex justify-center space-x-reverse space-x-2 pt-1">
              <button
                onClick={onQuickAddTask}
                className="text-xs font-bold text-[#BE123C] hover:underline"
              >
                + افزودن پارت جدید
              </button>
              <span className="text-slate-400">•</span>
              <button
                onClick={() => onNavigate('chat')}
                className="text-xs font-bold text-slate-700 hover:text-[#BE123C]"
              >
                درخواست برنامه از مشاور
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {todayTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onToggleTask(task.id)}
                className={`bg-white rounded-xl p-3.5 border transition cursor-pointer flex items-center justify-between ${
                  task.completed
                    ? 'border-slate-300 bg-slate-100/70 opacity-65'
                    : 'border-slate-300 hover:border-slate-400 shadow-xs'
                }`}
              >
                <div className="flex items-center space-x-reverse space-x-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleTask(task.id);
                    }}
                    className="shrink-0 focus:outline-hidden"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-[#BE123C]" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs font-bold truncate ${
                        task.completed ? 'line-through text-slate-500' : 'text-slate-950'
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center space-x-reverse space-x-2 text-[11px] text-slate-600 mt-0.5">
                      <span className="font-semibold text-slate-700">{task.subject}</span>
                      <span>•</span>
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 ml-0.5 text-slate-500" />
                        {toPersianDigits(task.estimatedMinutes)} دقیقه
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 mr-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      task.priority === 'urgent'
                        ? 'bg-rose-100 text-rose-900 border border-rose-300'
                        : task.priority === 'high'
                        ? 'bg-amber-100 text-amber-950 border border-amber-300'
                        : task.priority === 'medium'
                        ? 'bg-blue-100 text-blue-950 border border-blue-300'
                        : 'bg-slate-200 text-slate-900 border border-slate-300'
                    }`}
                  >
                    {task.priority === 'urgent'
                      ? 'فوری'
                      : task.priority === 'high'
                      ? 'مهم'
                      : task.priority === 'medium'
                      ? 'متوسط'
                      : 'عادی'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Quick AI Advisor Assistant Shortcut */}
      <section className="bg-white rounded-xl p-3.5 border border-slate-300 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-reverse space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 shrink-0">
            <Sparkles className="w-4 h-4 text-[#BE123C]" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-950">گفتگوی برنامه‌ریزی با مشاور</h4>
            <p className="text-[11px] text-slate-600">
              ثبت تکالیف مدرسه، آزمون‌ها و بازتوزیع تسک‌های معوق
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('chat')}
          className="text-xs font-bold text-[#BE123C] hover:bg-rose-50 px-2.5 py-1.5 rounded-lg flex items-center transition border border-rose-200"
        >
          <MessageSquare className="w-3.5 h-3.5 ml-1" />
          <span>ورود</span>
          <ArrowLeft className="w-3 h-3 mr-1" />
        </button>
      </section>

      {/* 4. Compact Daily Quote at Bottom */}
      {quote && (
        <section className="p-3.5 bg-white rounded-xl border border-slate-300 text-center shadow-xs">
          <p className="text-xs text-slate-700 leading-relaxed italic font-medium">
            «{quote.text}»
          </p>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">
            — {quote.author}
          </p>
        </section>
      )}
    </div>
  );
};
