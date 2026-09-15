import React, { useState } from 'react';
import { DailyTestItem, TestType } from '../types/studymate';
import {
  toPersianDigits,
  formatPersianDateString,
} from '../utils/persianDate';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Edit2,
  X,
  Award,
  AlertCircle,
  Clock,
  Target,
  BarChart3,
  Timer,
  BookOpen,
  Filter,
} from 'lucide-react';

interface DailyTestsScreenProps {
  tests: DailyTestItem[];
  onAddTest: (test: Omit<DailyTestItem, 'id'>) => void;
  onUpdateTest: (id: string, updates: Partial<DailyTestItem>) => void;
  onDeleteTest: (id: string) => void;
}

export const TEST_TYPE_LABELS: Record<TestType, { label: string; desc: string; badgeColor: string }> = {
  educational: {
    label: 'آموزشی',
    desc: 'حل تست بدون زمان‌گیری جهت یادگیری عمیق و بررسی بلافاصله پاسخنامه',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  consolidating: {
    label: 'تثبیتی',
    desc: 'تست‌زنی بلافاصله بعد از تدریس جهت تثبیت فرمول‌ها و مفاهیم درس',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  timed: {
    label: 'زمان‌دار',
    desc: 'شبیه‌سازی سرعت و مدیریت زمان کنکور با احتساب دقیق ثانیه‌ها',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  review: {
    label: 'مروری',
    desc: 'بازیابی مباحث گذشته و جلوگیری از فراموشی با تست‌های برگزیده',
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  mock: {
    label: 'آزمونی / جامع',
    desc: 'شبیه‌ساز دفترچه تخصصی کنکور سراسری و آزمون‌های آزمایشی',
    badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
  },
};

const KONKUR_11TH_MATH_SUBJECTS = [
  'حسابان ۱',
  'هندسه ۲',
  'فیزیک ۲',
  'شیمی ۲',
  'آمار و احتمال',
  'فارسی ۲',
  'عربی ۲',
  'دین و زندگی ۲',
  'زبان انگلیسی ۲',
  'زمین‌شناسی',
  'زیست‌شناسی پایه',
  'ریاضی تجربی',
  'عمومی و سایر',
];

export const DailyTestsScreen: React.FC<DailyTestsScreenProps> = ({
  tests,
  onAddTest,
  onUpdateTest,
  onDeleteTest,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [scoringTest, setScoringTest] = useState<DailyTestItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | TestType>('all');

  // Add form states
  const [subject, setSubject] = useState(KONKUR_11TH_MATH_SUBJECTS[0]);
  const [topic, setTopic] = useState('');
  const [numberOfQuestions, setNumberOfQuestions] = useState(25);
  const [testType, setTestType] = useState<TestType>('consolidating');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(35);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Scoring form states
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [wrongCount, setWrongCount] = useState<number>(0);
  const [unansweredCount, setUnansweredCount] = useState<number>(0);
  const [timeSpentMinutes, setTimeSpentMinutes] = useState<number>(30);

  const openAddModal = () => {
    setSubject(KONKUR_11TH_MATH_SUBJECTS[0]);
    setTopic('');
    setNumberOfQuestions(25);
    setTestType('consolidating');
    setTimeLimitMinutes(35);
    setDate(new Date().toISOString().split('T')[0]);
    setIsAddModalOpen(true);
  };

  const openScoringModal = (test: DailyTestItem) => {
    setScoringTest(test);
    const initialCorrect = test.correctCount || 0;
    const initialWrong = test.wrongCount || 0;
    const initialUnanswered =
      test.unansweredCount !== undefined
        ? test.unansweredCount
        : Math.max(0, test.numberOfQuestions - initialCorrect - initialWrong);

    setCorrectCount(initialCorrect);
    setWrongCount(initialWrong);
    setUnansweredCount(initialUnanswered);
    setTimeSpentMinutes(test.timeSpentMinutes || test.timeLimitMinutes || 30);
  };

  const handleSaveNewTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    onAddTest({
      subject,
      topic: topic.trim(),
      numberOfQuestions: Math.max(1, Number(numberOfQuestions)),
      testType,
      timeLimitMinutes: Number(timeLimitMinutes) || undefined,
      date,
      completed: false,
    });
    setIsAddModalOpen(false);
  };

  const handleSaveScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scoringTest) return;

    const total = scoringTest.numberOfQuestions;
    const c = Math.max(0, Math.min(total, correctCount));
    const w = Math.max(0, Math.min(total - c, wrongCount));
    const u = Math.max(0, total - c - w);

    // Standard Iranian Konkur percentage formula: (3*c - w) / (3*total) * 100
    const rawKonkurScore = total > 0 ? ((3 * c - w) / (3 * total)) * 100 : 0;
    const finalPercentage = Math.round(Math.max(-33.3, rawKonkurScore));

    // Raw accuracy: (c / (c + w)) * 100
    const attempted = c + w;
    const accuracy = attempted > 0 ? Math.round((c / attempted) * 100) : 0;

    onUpdateTest(scoringTest.id, {
      completed: true,
      correctCount: c,
      wrongCount: w,
      unansweredCount: u,
      timeSpentMinutes,
      percentage: finalPercentage,
      accuracy,
    });
    setScoringTest(null);
  };

  const handleToggleCompletionQuick = (test: DailyTestItem) => {
    if (!test.completed) {
      openScoringModal(test);
    } else {
      onUpdateTest(test.id, {
        completed: false,
      });
    }
  };

  // Filtered tests
  const filteredTests = tests.filter((t) => {
    if (activeFilter === 'all') return true;
    return (t.testType || 'consolidating') === activeFilter;
  });

  // Aggregates
  const completedTests = tests.filter((t) => t.completed);
  const totalCompletedQuestions = completedTests.reduce(
    (acc, curr) => acc + (curr.numberOfQuestions || 0),
    0
  );
  const totalCorrect = completedTests.reduce((acc, curr) => acc + (curr.correctCount || 0), 0);
  const totalWrong = completedTests.reduce((acc, curr) => acc + (curr.wrongCount || 0), 0);
  const averageKonkurScore =
    completedTests.length > 0
      ? Math.round(
          completedTests.reduce((acc, curr) => acc + (curr.percentage || 0), 0) /
            completedTests.length
        )
      : 0;

  return (
    <div className="space-y-4 pb-20">
      {/* Header with Metrics */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#28264B]">تست‌های روزانه و آزمونک‌ها</h2>
          <p className="text-xs text-[#4E5174]">
            {toPersianDigits(totalCompletedQuestions)} تست حل‌شده | میانگین تراز:{' '}
            <span className="font-bold text-[#AA0033]">{toPersianDigits(averageKonkurScore)}٪</span>
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="shiny-crimson-btn text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-reverse space-x-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت تست جدید</span>
        </button>
      </div>

      {/* Aggregate Score Bar */}
      <div className="glass-box rounded-2xl p-3 grid grid-cols-4 gap-2 text-center text-xs">
        <div>
          <span className="block text-[11px] text-[#4E5174]">کل سوالات</span>
          <span className="font-bold text-[#28264B] text-sm">
            {toPersianDigits(totalCompletedQuestions)}
          </span>
        </div>
        <div>
          <span className="block text-[11px] text-emerald-700">صحیح</span>
          <span className="font-bold text-emerald-800 text-sm">
            {toPersianDigits(totalCorrect)}
          </span>
        </div>
        <div>
          <span className="block text-[11px] text-rose-700">غلط</span>
          <span className="font-bold text-rose-800 text-sm">
            {toPersianDigits(totalWrong)}
          </span>
        </div>
        <div>
          <span className="block text-[11px] text-[#AA0033]">میانگین درصد</span>
          <span className="font-black text-[#AA0033] text-sm">
            {toPersianDigits(averageKonkurScore)}٪
          </span>
        </div>
      </div>

      {/* Filter Tabs by Test Type */}
      <div className="flex items-center space-x-reverse space-x-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition ${
            activeFilter === 'all'
              ? 'bg-[#28264B] text-white shadow-xs'
              : 'glass-box text-[#4E5174] hover:text-[#28264B]'
          }`}
        >
          همه تست‌ها ({toPersianDigits(tests.length)})
        </button>

        {(Object.keys(TEST_TYPE_LABELS) as TestType[]).map((typeKey) => {
          const typeInfo = TEST_TYPE_LABELS[typeKey];
          const count = tests.filter((t) => (t.testType || 'consolidating') === typeKey).length;
          return (
            <button
              key={typeKey}
              onClick={() => setActiveFilter(typeKey)}
              className={`px-3 py-1 rounded-xl font-medium whitespace-nowrap transition ${
                activeFilter === typeKey
                  ? 'bg-[#AA0033] text-white shadow-xs'
                  : 'glass-box text-[#4E5174] hover:text-[#28264B]'
              }`}
            >
              {typeInfo.label} ({toPersianDigits(count)})
            </button>
          );
        })}
      </div>

      {/* Tests List */}
      {filteredTests.length === 0 ? (
        <div className="glass-box rounded-2xl p-8 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-[#959EC9] mx-auto opacity-70 mb-2" />
          <p className="text-xs text-[#4E5174]">تستی با فیلتر انتخابی یافت نشد.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTests.map((test) => {
            const typeKey = test.testType || 'consolidating';
            const typeMeta = TEST_TYPE_LABELS[typeKey];

            return (
              <div
                key={test.id}
                className={`glass-box glass-box-interactive rounded-2xl p-4 space-y-2.5 ${
                  test.completed ? 'opacity-95' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-reverse space-x-2.5 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleCompletionQuick(test)}
                      className="mt-0.5 shrink-0 text-[#AA0033] focus:outline-hidden"
                      title={test.completed ? 'علامت به عنوان انجام‌نشده' : 'ثبت کارنامه تست'}
                    >
                      {test.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-[#AA0033] fill-[#AA0033]/20" />
                      ) : (
                        <Circle className="w-5 h-5 text-[#959EC9] hover:text-[#AA0033] transition" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-reverse space-x-2 flex-wrap gap-y-1">
                        <span className="shiny-periwinkle-pill text-[10px] px-2 py-0.5 rounded-md font-bold">
                          {test.subject}
                        </span>

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${typeMeta.badgeColor}`}
                        >
                          {typeMeta.label}
                        </span>

                        {test.timeLimitMinutes && (
                          <span className="text-[10px] text-[#4E5174] flex items-center space-x-reverse space-x-0.5">
                            <Timer className="w-3 h-3 text-[#AA0033]" />
                            <span>{toPersianDigits(test.timeLimitMinutes)} دقیقه</span>
                          </span>
                        )}

                        <span className="text-[11px] text-[#4E5174] mr-auto">
                          {formatPersianDateString(test.date)}
                        </span>
                      </div>

                      <h3 className="text-xs font-bold text-[#28264B] mt-1.5 truncate">
                        {test.topic}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center space-x-reverse space-x-1 shrink-0 mr-2">
                    {test.completed && (
                      <button
                        onClick={() => openScoringModal(test)}
                        className="p-1.5 rounded-lg text-[#4E5174] hover:text-[#28264B] hover:bg-white/80 transition"
                        title="ویرایش کارنامه"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteTest(test.id)}
                      className="p-1.5 rounded-lg text-[#4E5174] hover:text-[#AA0033] hover:bg-[#AA0033]/10 transition"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Bottom Row: Results / Scoring CTA */}
                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-white/60">
                  <span className="text-[#4E5174] font-medium">
                    تعداد تست: {toPersianDigits(test.numberOfQuestions)} سوال
                  </span>

                  {test.completed ? (
                    <div className="flex items-center space-x-reverse space-x-2 text-[11px] flex-wrap">
                      <span className="text-emerald-700 font-bold bg-emerald-50/90 px-1.5 py-0.5 rounded-md border border-emerald-200/70">
                        {toPersianDigits(test.correctCount || 0)} ص
                      </span>
                      <span className="text-rose-700 font-bold bg-rose-50/90 px-1.5 py-0.5 rounded-md border border-rose-200/70">
                        {toPersianDigits(test.wrongCount || 0)} غ
                      </span>
                      <span className="text-slate-600 font-bold bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
                        {toPersianDigits(test.unansweredCount || 0)} ن
                      </span>
                      <span className="shiny-crimson-btn px-2 py-0.5 rounded-md font-bold text-xs shadow-2xs">
                        تراز کنکور: {toPersianDigits(test.percentage ?? 0)}٪
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => openScoringModal(test)}
                      className="text-xs font-bold text-[#AA0033] hover:underline flex items-center bg-[#AA0033]/10 px-2.5 py-1 rounded-lg border border-[#AA0033]/20"
                    >
                      <span>ثبت کارنامه و درصد</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add Daily Test */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#28264B]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-box bg-white/95 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 border border-white">
            <div className="flex items-center justify-between border-b border-white/80 pb-2">
              <h3 className="text-sm font-bold text-[#28264B]">برنامه‌ریزی بسته تستی جدید</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#4E5174] hover:text-[#28264B]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewTest} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#28264B] mb-1">
                  درس مربوطه (پایه یازدهم ریاضی)
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-[#E8EAE7]/70 border border-white rounded-xl px-2.5 py-1.5 text-xs text-[#28264B] outline-hidden"
                >
                  {KONKUR_11TH_MATH_SUBJECTS.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#28264B] mb-1">
                  مبحث و عنوان تست *
                </label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="مثلاً: حسابان ۱ فصل ۲ - تابع وارون و توابع یک‌به‌یک"
                  className="w-full bg-[#E8EAE7]/70 border border-white rounded-xl px-3 py-2 text-xs text-[#28264B] outline-hidden focus:border-[#AA0033]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#28264B] mb-1">
                  نوع آزمون / تست
                </label>
                <select
                  value={testType}
                  onChange={(e) => setTestType(e.target.value as TestType)}
                  className="w-full bg-[#E8EAE7]/70 border border-white rounded-xl px-2.5 py-1.5 text-xs text-[#28264B] outline-hidden"
                >
                  {(Object.keys(TEST_TYPE_LABELS) as TestType[]).map((tk) => (
                    <option key={tk} value={tk}>
                      {TEST_TYPE_LABELS[tk].label} ({TEST_TYPE_LABELS[tk].desc.substring(0, 38)}...)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#28264B] mb-1">
                    تعداد تست
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={numberOfQuestions}
                    onChange={(e) => setNumberOfQuestions(Number(e.target.value))}
                    className="w-full bg-[#E8EAE7]/70 border border-white rounded-xl px-2.5 py-1.5 text-xs text-[#28264B] outline-hidden text-center font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#28264B] mb-1">
                    مدت زمان (دقیقه)
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                    className="w-full bg-[#E8EAE7]/70 border border-white rounded-xl px-2.5 py-1.5 text-xs text-[#28264B] outline-hidden text-center font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#28264B] mb-1">
                    تاریخ
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#E8EAE7]/70 border border-white rounded-xl px-2 py-1.5 text-[11px] text-[#28264B] outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-reverse space-x-2 pt-2 border-t border-white/80">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-[#4E5174] hover:bg-black/5"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold shiny-crimson-btn text-white shadow-xs"
                >
                  ثبت بسته تستی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Scoring Test */}
      {scoringTest && (
        <div className="fixed inset-0 z-50 bg-[#28264B]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-box bg-white/95 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 border border-white">
            <div className="flex items-center justify-between border-b border-white/80 pb-2">
              <div>
                <h3 className="text-sm font-bold text-[#28264B]">ثبت کارنامه و تحلیل تست</h3>
                <p className="text-[11px] text-[#4E5174] truncate max-w-[280px]">
                  {scoringTest.topic}
                </p>
              </div>
              <button onClick={() => setScoringTest(null)} className="text-[#4E5174] hover:text-[#28264B]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveScore} className="space-y-3">
              <div className="glass-box p-3 rounded-xl text-xs text-[#4E5174] flex items-center justify-between">
                <span>کل سوالات بسته:</span>
                <span className="font-bold text-sm text-[#28264B]">
                  {toPersianDigits(scoringTest.numberOfQuestions)} سوال
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                    صحیح
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={scoringTest.numberOfQuestions}
                    value={correctCount}
                    onChange={(e) => {
                      const c = Number(e.target.value);
                      setCorrectCount(c);
                      setUnansweredCount(Math.max(0, scoringTest.numberOfQuestions - c - wrongCount));
                    }}
                    className="w-full bg-[#E8EAE7]/70 border border-emerald-300 rounded-xl px-2.5 py-1.5 text-xs text-emerald-900 outline-hidden text-center font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-rose-800 mb-1">
                    غلط
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={scoringTest.numberOfQuestions}
                    value={wrongCount}
                    onChange={(e) => {
                      const w = Number(e.target.value);
                      setWrongCount(w);
                      setUnansweredCount(Math.max(0, scoringTest.numberOfQuestions - correctCount - w));
                    }}
                    className="w-full bg-[#E8EAE7]/70 border border-rose-300 rounded-xl px-2.5 py-1.5 text-xs text-rose-900 outline-hidden text-center font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    نزده
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={scoringTest.numberOfQuestions}
                    value={unansweredCount}
                    onChange={(e) => setUnansweredCount(Number(e.target.value))}
                    className="w-full bg-[#E8EAE7]/70 border border-white rounded-xl px-2.5 py-1.5 text-xs text-[#28264B] outline-hidden text-center font-bold"
                  />
                </div>
              </div>

              {/* Time Spent Input */}
              <div>
                <label className="block text-[11px] font-semibold text-[#4E5174] mb-1">
                  مدت زمان صرف‌شده واقعی (دقیقه)
                </label>
                <input
                  type="number"
                  min="1"
                  value={timeSpentMinutes}
                  onChange={(e) => setTimeSpentMinutes(Number(e.target.value))}
                  className="w-full bg-[#E8EAE7]/70 border border-white rounded-xl px-3 py-1.5 text-xs text-[#28264B] outline-hidden"
                />
              </div>

              {/* Real-time Calculation Summary */}
              <div className="grid grid-cols-2 gap-2">
                <div className="shiny-crimson-btn text-white p-2.5 rounded-xl text-center shadow-md">
                  <span className="block text-[10px] text-white/80">درصد کنکور (نمره منفی)</span>
                  <span className="text-base font-black">
                    {toPersianDigits(
                      Math.round(
                        scoringTest.numberOfQuestions > 0
                          ? ((3 * correctCount - wrongCount) / (3 * scoringTest.numberOfQuestions)) * 100
                          : 0
                      )
                    )}
                    ٪
                  </span>
                </div>

                <div className="glass-box p-2.5 rounded-xl text-center border border-emerald-300">
                  <span className="block text-[10px] text-emerald-800">دقت پاسخگویی</span>
                  <span className="text-base font-black text-emerald-900">
                    {toPersianDigits(
                      correctCount + wrongCount > 0
                        ? Math.round((correctCount / (correctCount + wrongCount)) * 100)
                        : 0
                    )}
                    ٪
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-reverse space-x-2 pt-2 border-t border-white/80">
                <button
                  type="button"
                  onClick={() => setScoringTest(null)}
                  className="px-3 py-1.5 rounded-xl text-xs text-[#4E5174] hover:bg-black/5"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold shiny-crimson-btn text-white shadow-xs"
                >
                  ثبت کارنامه در دیتابیس
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
