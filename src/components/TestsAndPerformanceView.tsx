import React, { useState } from 'react';
import { DailyTest, TestPerformanceAnalytics } from '../types/academic';
import {
  Award,
  TrendingUp,
  Plus,
  AlertCircle,
  CheckCircle,
  Calendar,
  Clock,
  BarChart2,
} from 'lucide-react';
import { api } from '../services/apiClient';

interface TestsAndPerformanceViewProps {
  dailyTests: DailyTest[];
  testPerformance: TestPerformanceAnalytics;
  onDataChanged: () => void;
}

export const TestsAndPerformanceView: React.FC<TestsAndPerformanceViewProps> = ({
  dailyTests,
  testPerformance,
  onDataChanged,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);

  // New test result form
  const [testSubject, setTestSubject] = useState('Calculus II');
  const [testTitle, setTestTitle] = useState('');
  const [testScore, setTestScore] = useState(9);
  const [testTotalQuestions, setTestTotalQuestions] = useState(10);
  const [testTimeSpent, setTestTimeSpent] = useState(20);
  const [testWeakTopics, setTestWeakTopics] = useState('');
  const [testStrengths, setTestStrengths] = useState('');
  const [testReflections, setTestReflections] = useState('');

  const handleRecordTest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const percentage = Math.round((Number(testScore) / Number(testTotalQuestions)) * 100);
      await api.recordDailyTest({
        date: new Date().toISOString().split('T')[0],
        subject: testSubject,
        title: testTitle,
        score: Number(testScore),
        totalQuestions: Number(testTotalQuestions),
        percentage,
        timeSpentMinutes: Number(testTimeSpent),
        weakTopics: testWeakTopics.split(',').map((t) => t.trim()).filter(Boolean),
        strengths: testStrengths.split(',').map((t) => t.trim()).filter(Boolean),
        reflections: testReflections,
      });
      setShowAddModal(false);
      setTestTitle('');
      onDataChanged();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Section 1: Performance Analytics */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <BarChart2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Test Performance & Diagnostic Analytics
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aggregated subject accuracy and topic gap detection, synthesized for AI advisory recommendations.
            </p>
          </div>
          <button
            id="btn-add-test-result"
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition shadow-xs self-start"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Test Result</span>
          </button>
        </div>

        {/* Aggregate Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Overall Quiz Average
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {testPerformance.overallAveragePercentage}%
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-medium">
                {testPerformance.totalTestsCount} assessments
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Weakest Academic Area
            </span>
            <div className="mt-2">
              <span className="text-lg font-bold text-rose-600 dark:text-rose-400">
                {testPerformance.subjectBreakdown.find((s) => s.trend === 'declining' || s.averageScore < 75)
                  ?.subject || 'All subjects above 75%'}
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Flagged for AI remediation task generation
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Strongest Subject
            </span>
            <div className="mt-2">
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {testPerformance.subjectBreakdown.slice().sort((a, b) => b.averageScore - a.averageScore)[0]
                  ?.subject || 'N/A'}
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Consistent 90%+ mastery on daily checks
              </p>
            </div>
          </div>
        </div>

        {/* Subject Breakdown Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {testPerformance.subjectBreakdown.map((item) => (
            <div
              key={item.subject}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs space-y-3"
            >
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {item.subject}
                </h4>
                <span
                  className={`text-xs px-2 py-0.5 rounded font-bold ${
                    item.averageScore >= 85
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : item.averageScore >= 75
                      ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  {item.averageScore}% avg
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${
                    item.averageScore >= 85
                      ? 'bg-emerald-500'
                      : item.averageScore >= 75
                      ? 'bg-indigo-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${item.averageScore}%` }}
                />
              </div>

              {/* Weak topics tag */}
              {item.weakestTopics.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>Focus Areas:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {item.weakestTopics.map((w, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Strong topics */}
              {item.strongestTopics.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Mastered:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {item.strongestTopics.map((s, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Daily Tests Log */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white">
            Daily Test & Quiz Activity Log
          </h3>
          <span className="text-xs text-slate-400">{dailyTests.length} tests recorded</span>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs divide-y divide-slate-100 dark:divide-slate-700">
          {dailyTests.map((t) => (
            <div key={t.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {t.title}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                    {t.subject}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{t.date}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{t.timeSpentMinutes} mins</span>
                  </span>
                </div>
                {t.weakTopics && t.weakTopics.length > 0 && (
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    Weak points: {t.weakTopics.join(', ')}
                  </p>
                )}
                {t.reflections && (
                  <p className="text-xs text-slate-400 italic">
                    Note: "{t.reflections}"
                  </p>
                )}
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                <span
                  className={`text-base font-extrabold px-2.5 py-1 rounded-lg ${
                    t.percentage >= 85
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : t.percentage >= 70
                      ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  {t.percentage}%
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  {t.score} / {t.totalQuestions} pts
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Record Test Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Record Daily Test / Quiz Result
            </h3>
            <form onSubmit={handleRecordTest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Quiz Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 4 Integration Practice Quiz"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={testSubject}
                  onChange={(e) => setTestSubject(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Score
                  </label>
                  <input
                    type="number"
                    required
                    value={testScore}
                    onChange={(e) => setTestScore(Number(e.target.value))}
                    className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total Qs
                  </label>
                  <input
                    type="number"
                    required
                    value={testTotalQuestions}
                    onChange={(e) => setTestTotalQuestions(Number(e.target.value))}
                    className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Time (mins)
                  </label>
                  <input
                    type="number"
                    value={testTimeSpent}
                    onChange={(e) => setTestTimeSpent(Number(e.target.value))}
                    className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Weak Topics (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Arc length integrals, limits"
                  value={testWeakTopics}
                  onChange={(e) => setTestWeakTopics(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Concepts Mastered
                </label>
                <input
                  type="text"
                  placeholder="e.g. Substitution formula, algebra"
                  value={testStrengths}
                  onChange={(e) => setTestStrengths(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
                >
                  Save Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
