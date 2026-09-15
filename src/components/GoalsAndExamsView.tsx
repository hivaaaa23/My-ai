import React, { useState } from 'react';
import { Goal, Exam } from '../types/academic';
import {
  Target,
  AlertTriangle,
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/apiClient';

interface GoalsAndExamsViewProps {
  goals: Goal[];
  exams: Exam[];
  onDataChanged: () => void;
}

export const GoalsAndExamsView: React.FC<GoalsAndExamsViewProps> = ({
  goals,
  exams,
  onDataChanged,
}) => {
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showAddExamModal, setShowAddExamModal] = useState(false);

  // Add Goal Form
  const [goalTitle, setGoalTitle] = useState('');
  const [goalCategory, setGoalCategory] = useState<'academic' | 'exam_prep' | 'habit' | 'skill'>('academic');
  const [goalSubject, setGoalSubject] = useState('Calculus II');
  const [goalTargetDate, setGoalTargetDate] = useState('2026-11-01');
  const [goalTargetValue, setGoalTargetValue] = useState(100);
  const [goalUnit, setGoalUnit] = useState('% readiness');
  const [goalMilestones, setGoalMilestones] = useState('Review unit 1, Practice midterms, Office hours');

  // Add Exam Form
  const [examTitle, setExamTitle] = useState('');
  const [examSubject, setExamSubject] = useState('Calculus II');
  const [examDate, setExamDate] = useState('2026-10-15');
  const [examWeight, setExamWeight] = useState(30);
  const [examTargetScore, setExamTargetScore] = useState(90);
  const [examTopics, setExamTopics] = useState('Integration, Series, Polar Coordinates');

  const handleToggleMilestone = async (goal: Goal, milestoneIndex: number) => {
    try {
      const updatedMilestones = [...goal.milestones];
      updatedMilestones[milestoneIndex].completed = !updatedMilestones[milestoneIndex].completed;

      // Recalculate progress based on milestones
      const completedCount = updatedMilestones.filter((m) => m.completed).length;
      const progressPercentage = Math.round((completedCount / updatedMilestones.length) * 100);

      await api.updateGoal(goal.id, {
        milestones: updatedMilestones,
        progressPercentage,
        currentValue: Math.round((progressPercentage / 100) * goal.targetValue),
      });
      onDataChanged();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateReadiness = async (exam: Exam, newReadiness: number) => {
    try {
      await api.updateExam(exam.id, {
        currentReadinessPercentage: newReadiness,
      });
      onDataChanged();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const milestonesList = goalMilestones
        .split(',')
        .map((m, idx) => ({
          id: `m-${Date.now()}-${idx}`,
          title: m.trim(),
          completed: false,
        }))
        .filter((m) => m.title.length > 0);

      await api.createGoal({
        title: goalTitle,
        category: goalCategory,
        subject: goalSubject,
        targetDate: goalTargetDate,
        targetValue: Number(goalTargetValue),
        currentValue: 0,
        progressPercentage: 0,
        unit: goalUnit,
        milestones: milestonesList,
      });
      setShowAddGoalModal(false);
      setGoalTitle('');
      onDataChanged();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createExam({
        title: examTitle,
        subject: examSubject,
        examDate,
        weightPercentage: Number(examWeight),
        targetScore: Number(examTargetScore),
        currentReadinessPercentage: 30,
        topics: examTopics.split(',').map((t) => t.trim()).filter(Boolean),
      });
      setShowAddExamModal(false);
      setExamTitle('');
      onDataChanged();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Section 1: Goals */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Academic & Study Goals
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Long-term targets and milestone checklists tracked by the AI advisor.
            </p>
          </div>
          <button
            id="btn-add-goal"
            onClick={() => setShowAddGoalModal(true)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition shadow-xs self-start"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Goal</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 uppercase">
                    {goal.category.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-400">Target: {goal.targetDate}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {goal.title}
                </h3>
                {goal.subject && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Subject: {goal.subject}
                  </p>
                )}

                {/* Progress bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Progress</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {goal.currentValue} / {goal.targetValue} {goal.unit} ({goal.progressPercentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${goal.progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Sub-Milestones */}
              {goal.milestones && goal.milestones.length > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-700 pt-3 space-y-1.5">
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Milestones:
                  </div>
                  <div className="space-y-1">
                    {goal.milestones.map((m, idx) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleToggleMilestone(goal, idx)}
                        className="w-full text-left flex items-center space-x-2 text-xs py-0.5 hover:text-indigo-600 transition"
                      >
                        {m.completed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span
                          className={`truncate ${
                            m.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {m.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Exams */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Upcoming Exams & Syllabus Readiness
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Exam dates, weighted values, and subject syllabus preparedness tracked for advisory intervention.
            </p>
          </div>
          <button
            id="btn-add-exam"
            onClick={() => setShowAddExamModal(true)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium transition shadow-xs self-start"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Exam</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    {exam.subject}
                  </span>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{exam.examDate}</span>
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  {exam.title}
                </h3>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Course Weight: <strong className="text-slate-800 dark:text-slate-200">{exam.weightPercentage}%</strong></span>
                  <span>Target: <strong className="text-slate-800 dark:text-slate-200">{exam.targetScore}%</strong></span>
                </div>

                {/* Readiness Slider */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Readiness Mastery</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {exam.currentReadinessPercentage}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={exam.currentReadinessPercentage}
                    onChange={(e) => handleUpdateReadiness(exam, Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>

              {/* Topics Breakdown */}
              {exam.topics && exam.topics.length > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-700 pt-2.5">
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 flex items-center space-x-1">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Tested Topics:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {exam.topics.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Goal Modal */}
      {showAddGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Add Academic Goal
            </h3>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Goal Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master dynamic programming concepts"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={goalCategory}
                    onChange={(e) => setGoalCategory(e.target.value as any)}
                    className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="academic">Academic</option>
                    <option value="exam_prep">Exam Prep</option>
                    <option value="habit">Habit</option>
                    <option value="skill">Skill</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={goalSubject}
                    onChange={(e) => setGoalSubject(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    required
                    value={goalTargetDate}
                    onChange={(e) => setGoalTargetDate(e.target.value)}
                    className="w-full text-xs px-2 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Value
                  </label>
                  <input
                    type="number"
                    value={goalTargetValue}
                    onChange={(e) => setGoalTargetValue(Number(e.target.value))}
                    className="w-full text-xs px-2 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={goalUnit}
                    onChange={(e) => setGoalUnit(e.target.value)}
                    className="w-full text-xs px-2 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sub-Milestones (comma-separated)
                </label>
                <textarea
                  rows={2}
                  value={goalMilestones}
                  onChange={(e) => setGoalMilestones(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddGoalModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Exam Modal */}
      {showAddExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Schedule Exam Assessment
            </h3>
            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Exam Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physics Midterm II"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={examSubject}
                    onChange={(e) => setExamSubject(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Exam Date
                  </label>
                  <input
                    type="date"
                    required
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Course Weight (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={examWeight}
                    onChange={(e) => setExamWeight(Number(e.target.value))}
                    className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Score (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={examTargetScore}
                    onChange={(e) => setExamTargetScore(Number(e.target.value))}
                    className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Key Topics (comma-separated)
                </label>
                <textarea
                  rows={2}
                  value={examTopics}
                  onChange={(e) => setExamTopics(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddExamModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-500 text-white rounded-lg"
                >
                  Schedule Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
