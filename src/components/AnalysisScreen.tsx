import React, { useState } from 'react';
import { Task, DailyTestItem, SchoolClass, StudyHistoryItem, UserPreferences } from '../types/studymate';
import { toPersianDigits, formatPersianDateString } from '../utils/persianDate';
import {
  calculateComprehensiveAnalysis,
  smartRescheduleMissedTasks,
  SmartReschedulingResult,
} from '../services/studyPlanner';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  TrendingUp,
  BookOpen,
  Sparkles,
  ArrowLeftRight,
  ShieldCheck,
  Zap,
  Target,
  BarChart2,
  Calendar,
} from 'lucide-react';

interface AnalysisScreenProps {
  tasks: Task[];
  dailyTests: DailyTestItem[];
  schedule?: SchoolClass[];
  studyHistory?: StudyHistoryItem[];
  preferences?: UserPreferences;
  onApplyRescheduling?: (plan: SmartReschedulingResult['plan']) => Promise<void>;
}

export const AnalysisScreen: React.FC<AnalysisScreenProps> = ({
  tasks,
  dailyTests,
  schedule = [],
  studyHistory = [],
  preferences,
  onApplyRescheduling,
}) => {
  const [rescheduleResult, setRescheduleResult] = useState<SmartReschedulingResult | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [appliedSuccessMessage, setAppliedSuccessMessage] = useState<string | null>(null);

  // Dynamic analysis calculated directly from actual tasks and tests
  const analysis = calculateComprehensiveAnalysis(tasks, dailyTests, studyHistory, preferences);

  // Smart Reschedule Handler
  const handlePreviewReschedule = () => {
    const result = smartRescheduleMissedTasks(
      analysis.tasks.missedTasksList,
      tasks,
      schedule,
      preferences
    );
    setRescheduleResult(result);
  };

  const handleConfirmReschedule = async () => {
    if (!rescheduleResult || !onApplyRescheduling) return;
    setIsApplying(true);
    try {
      await onApplyRescheduling(rescheduleResult.plan);
      setAppliedSuccessMessage(
        `تعداد ${toPersianDigits(rescheduleResult.plan.length)} تسک با موفقیت در روزهای آینده بازتوزیع شدند.`
      );
      setRescheduleResult(null);
    } catch (err) {
      console.error('Failed to apply rescheduling:', err);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#28264B]">تحلیل جامع و آمار تحصیلی</h2>
          <p className="text-xs text-[#4E5174]">
            گزارش عملکرد، تراز آزمون‌ها و ارزیابی ساعات مطالعه
          </p>
        </div>
        <span className="text-[11px] glass-box px-2.5 py-1 rounded-xl text-[#28264B] font-bold">
          دوره فعال
        </span>
      </div>

      {appliedSuccessMessage && (
        <div className="glass-box p-3 rounded-xl bg-emerald-50/90 border border-emerald-300 text-xs text-emerald-900 flex items-center space-x-reverse space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{appliedSuccessMessage}</span>
        </div>
      )}

      {/* 4 Key Metric Summary Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Study Time */}
        <div className="glass-box glass-box-interactive rounded-2xl p-3.5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#4E5174]">ساعت مطالعه کل</span>
            <Clock className="w-4 h-4 text-[#AA0033]" />
          </div>
          <div className="flex items-baseline space-x-reverse space-x-1 pt-1">
            <span className="text-xl font-black text-[#28264B]">
              {toPersianDigits(Math.round(analysis.studyTime.weeklyMinutes / 60))}
            </span>
            <span className="text-xs text-[#4E5174]">
              از {toPersianDigits(analysis.studyTime.targetWeeklyHours)} ساعت
            </span>
          </div>
          <div className="w-full bg-[#E8EAE7] rounded-full h-1.5 overflow-hidden mt-1">
            <div
              className="bg-[#AA0033] h-1.5 rounded-full"
              style={{ width: `${analysis.studyTime.weeklyProgressPercent}%` }}
            />
          </div>
        </div>

        {/* Task Completion Rate */}
        <div className="glass-box glass-box-interactive rounded-2xl p-3.5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#4E5174]">تکمیل تسک‌ها</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline space-x-reverse space-x-1 pt-1">
            <span className="text-xl font-black text-[#28264B]">
              {toPersianDigits(analysis.tasks.completionRate)}٪
            </span>
            <span className="text-xs text-[#4E5174]">
              ({toPersianDigits(analysis.tasks.completed)} از {toPersianDigits(analysis.tasks.total)})
            </span>
          </div>
          <div className="w-full bg-[#E8EAE7] rounded-full h-1.5 overflow-hidden mt-1">
            <div
              className="bg-emerald-600 h-1.5 rounded-full"
              style={{ width: `${analysis.tasks.completionRate}%` }}
            />
          </div>
        </div>

        {/* Total Questions Solved */}
        <div className="glass-box glass-box-interactive rounded-2xl p-3.5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#4E5174]">تست‌های کارشده</span>
            <Target className="w-4 h-4 text-[#959EC9]" />
          </div>
          <div className="flex items-baseline space-x-reverse space-x-1 pt-1">
            <span className="text-xl font-black text-[#28264B]">
              {toPersianDigits(analysis.tests.totalQuestions)}
            </span>
            <span className="text-xs text-[#4E5174]">
              در {toPersianDigits(analysis.tests.totalTests)} بسته تستی
            </span>
          </div>
          <div className="flex items-center space-x-reverse space-x-2 text-[10px] text-[#4E5174] pt-1">
            <span className="text-emerald-700 font-bold">
              {toPersianDigits(analysis.tests.totalCorrect)} ص
            </span>
            <span>•</span>
            <span className="text-rose-700 font-bold">
              {toPersianDigits(analysis.tests.totalWrong)} غ
            </span>
            <span>•</span>
            <span className="text-slate-600">
              {toPersianDigits(analysis.tests.totalUnanswered)} ن
            </span>
          </div>
        </div>

        {/* Accuracy / Konkur Score */}
        <div className="glass-box glass-box-interactive rounded-2xl p-3.5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#4E5174]">میانگین تراز کنکور</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline space-x-reverse space-x-1 pt-1">
            <span className="text-xl font-black text-[#AA0033]">
              {toPersianDigits(analysis.tests.averagePercentage)}٪
            </span>
            <span className="text-xs text-[#4E5174]">
              (دقت: {toPersianDigits(analysis.tests.averageAccuracy)}٪)
            </span>
          </div>
          <div className="w-full bg-[#E8EAE7] rounded-full h-1.5 overflow-hidden mt-1">
            <div
              className="bg-amber-500 h-1.5 rounded-full"
              style={{ width: `${Math.max(0, analysis.tests.averagePercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Missed Tasks Alert & Smart Rescheduling */}
      {analysis.tasks.missed > 0 && (
        <div className="glass-box rounded-2xl p-4 space-y-3 border border-amber-300/80 bg-amber-50/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-reverse space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <h3 className="text-xs font-bold text-amber-900">
                  {toPersianDigits(analysis.tasks.missed)} تسک عقب‌افتاده
                </h3>
                <p className="text-[11px] text-amber-800">
                  از انتقال یکجای همه تسک‌ها به فردا خودداری کنید تا برنامه‌تان فشرده نشود.
                </p>
              </div>
            </div>

            <button
              onClick={handlePreviewReschedule}
              className="shiny-crimson-btn text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-reverse space-x-1 shrink-0 shadow-xs"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>بازتوزیع هوشمند</span>
            </button>
          </div>

          {/* Reschedule Preview Modal / Drawer */}
          {rescheduleResult && (
            <div className="mt-3 pt-3 border-t border-amber-200/80 space-y-2.5">
              <div className="text-xs text-[#28264B] font-semibold flex items-center justify-between">
                <span>پیشنهاد بازتوزیع متعادل در ۵ روز آینده:</span>
                <span className="text-[11px] text-[#4E5174]">
                  زمان تخمینی: {toPersianDigits(rescheduleResult.totalEstimatedMinutes)} دقیقه
                </span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {rescheduleResult.plan.map((item) => (
                  <div
                    key={item.taskId}
                    className="glass-box bg-white/90 p-2.5 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-[#28264B] block">{item.taskTitle}</span>
                      <span className="text-[10px] text-[#4E5174]">{item.reason}</span>
                    </div>
                    <div className="text-left shrink-0 mr-2">
                      <span className="shiny-periwinkle-pill text-[10px] px-2 py-0.5 rounded-md font-bold block">
                        {formatPersianDateString(item.newDueDate)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end space-x-reverse space-x-2 pt-1">
                <button
                  onClick={() => setRescheduleResult(null)}
                  className="px-3 py-1 text-xs text-[#4E5174] hover:bg-black/5 rounded-lg"
                >
                  انصراف
                </button>
                <button
                  onClick={handleConfirmReschedule}
                  disabled={isApplying}
                  className="shiny-crimson-btn text-white px-4 py-1.5 rounded-xl text-xs font-bold shadow-xs flex items-center space-x-reverse space-x-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isApplying ? 'در حال ثبت...' : 'تأیید و بازتوزیع برنامه'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Test Types Distribution */}
      <div className="glass-box rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-[#28264B] flex items-center space-x-reverse space-x-1.5">
          <BarChart2 className="w-4 h-4 text-[#AA0033]" />
          <span>ترکیب استراتژیک بسته‌های تستی</span>
        </h3>

        <div className="grid grid-cols-5 gap-1.5 text-center">
          <div className="glass-box p-2 rounded-xl bg-blue-50/60 border border-blue-200">
            <span className="block text-[10px] text-blue-900 font-bold">آموزشی</span>
            <span className="text-xs font-black text-blue-950">
              {toPersianDigits(analysis.tests.byType.educational.count)} بسته
            </span>
          </div>
          <div className="glass-box p-2 rounded-xl bg-emerald-50/60 border border-emerald-200">
            <span className="block text-[10px] text-emerald-900 font-bold">تثبیتی</span>
            <span className="text-xs font-black text-emerald-950">
              {toPersianDigits(analysis.tests.byType.consolidating.count)} بسته
            </span>
          </div>
          <div className="glass-box p-2 rounded-xl bg-amber-50/60 border border-amber-200">
            <span className="block text-[10px] text-amber-900 font-bold">زمان‌دار</span>
            <span className="text-xs font-black text-amber-950">
              {toPersianDigits(analysis.tests.byType.timed.count)} بسته
            </span>
          </div>
          <div className="glass-box p-2 rounded-xl bg-purple-50/60 border border-purple-200">
            <span className="block text-[10px] text-purple-900 font-bold">مروری</span>
            <span className="text-xs font-black text-purple-950">
              {toPersianDigits(analysis.tests.byType.review.count)} بسته
            </span>
          </div>
          <div className="glass-box p-2 rounded-xl bg-rose-50/60 border border-rose-200">
            <span className="block text-[10px] text-rose-900 font-bold">آزمونی</span>
            <span className="text-xs font-black text-rose-950">
              {toPersianDigits(analysis.tests.byType.mock.count)} بسته
            </span>
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 gap-3">
        {/* Strengths */}
        <div className="glass-box rounded-2xl p-4 space-y-2.5 border-r-4 border-emerald-500">
          <div className="flex items-center space-x-reverse space-x-1.5 text-xs font-bold text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>نقاط قوت و تسلط تحصیلی</span>
          </div>

          <div className="space-y-2">
            {analysis.strengths.map((item, idx) => (
              <div key={idx} className="glass-box p-2.5 rounded-xl bg-white/70 text-xs space-y-0.5">
                <div className="flex items-center justify-between font-bold text-[#28264B]">
                  <span>{item.subject}</span>
                  <span className="text-[11px] text-emerald-700">{item.scoreText}</span>
                </div>
                <p className="text-[11px] text-[#4E5174]">{item.details}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Weaknesses */}
        <div className="glass-box rounded-2xl p-4 space-y-2.5 border-r-4 border-[#AA0033]">
          <div className="flex items-center space-x-reverse space-x-1.5 text-xs font-bold text-[#AA0033]">
            <Zap className="w-4 h-4 text-[#AA0033]" />
            <span>نقاط ضعف و نیازمند توجه فوری</span>
          </div>

          <div className="space-y-2">
            {analysis.weaknesses.map((item, idx) => (
              <div key={idx} className="glass-box p-2.5 rounded-xl bg-white/70 text-xs space-y-0.5">
                <div className="flex items-center justify-between font-bold text-[#28264B]">
                  <span>{item.subject}</span>
                  <span className="text-[11px] text-[#AA0033]">{item.issueText}</span>
                </div>
                <p className="text-[11px] text-[#4E5174]">{item.suggestedFix}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="glass-box rounded-2xl p-4 space-y-2 bg-gradient-to-r from-white/90 to-[#959EC9]/20">
        <div className="flex items-center space-x-reverse space-x-1.5 text-xs font-bold text-[#28264B]">
          <Sparkles className="w-4 h-4 text-[#AA0033]" />
          <span>توصیه‌های راهبردی مشاور برای هفته پیش‌رو</span>
        </div>

        <ul className="space-y-1.5 text-xs text-[#4E5174] leading-relaxed list-disc list-inside">
          {analysis.recommendations.map((rec, idx) => (
            <li key={idx} className="pr-1">{rec}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
