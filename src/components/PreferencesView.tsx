import React, { useState } from 'react';
import { UserPreferences } from '../types/academic';
import { Sliders, Save, Sparkles, Check, HeartHandshake } from 'lucide-react';
import { api } from '../services/apiClient';

interface PreferencesViewProps {
  preferences: UserPreferences;
  onPreferencesUpdated: () => void;
}

export const PreferencesView: React.FC<PreferencesViewProps> = ({
  preferences,
  onPreferencesUpdated,
}) => {
  const [form, setForm] = useState<UserPreferences>({ ...preferences });
  const [weakSubjectsInput, setWeakSubjectsInput] = useState(preferences.weakSubjects.join(', '));
  const [focusSubjectsInput, setFocusSubjectsInput] = useState(preferences.focusSubjects.join(', '));
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleTimeSlotToggle = (slot: 'morning' | 'afternoon' | 'evening' | 'night') => {
    const exists = form.preferredStudyTimeSlots.includes(slot);
    const updated = exists
      ? form.preferredStudyTimeSlots.filter((s) => s !== slot)
      : [...form.preferredStudyTimeSlots, slot];
    setForm({ ...form, preferredStudyTimeSlots: updated });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updatePreferences({
        ...form,
        weakSubjects: weakSubjectsInput.split(',').map((s) => s.trim()).filter(Boolean),
        focusSubjects: focusSubjectsInput.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
      onPreferencesUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Student Study Preferences
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Parameters that shape how the Personal Study Advisor generates recommendations, paces your study schedules, and communicates.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Study Rhythm & Target */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-4">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
            Study Pace & Daily Commitment
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Study Pace
              </label>
              <select
                value={form.studyPace}
                onChange={(e) => setForm({ ...form, studyPace: e.target.value as any })}
                className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="light">Light (1-2 hrs/day - Maintenance)</option>
                <option value="moderate">Moderate (3-4 hrs/day - Standard Semester)</option>
                <option value="intensive">Intensive (5-6 hrs/day - High Course Load)</option>
                <option value="exam_cram">Exam Cram Mode (7+ hrs/day - Immediate Finals)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Daily Study Hours: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{form.targetDailyStudyHours}h</span>
              </label>
              <input
                type="range"
                min="1"
                max="8"
                step="0.5"
                value={form.targetDailyStudyHours}
                onChange={(e) => setForm({ ...form, targetDailyStudyHours: Number(e.target.value) })}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-2"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>1 hr</span>
                <span>4.5 hrs</span>
                <span>8 hrs</span>
              </div>
            </div>
          </div>

          {/* Preferred Study Time Slots */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Preferred Study Time Slots (Used for schedule placement)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['morning', 'afternoon', 'evening', 'night'] as const).map((slot) => {
                const active = form.preferredStudyTimeSlots.includes(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => handleTimeSlotToggle(slot)}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {slot.charAt(0).toUpperCase() + slot.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Academic Focus & Subjects */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-4">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
            Subject Focus & Diagnostic Flags
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Weak Subjects (AI Advisor prioritizes remediation tasks)
              </label>
              <input
                type="text"
                value={weakSubjectsInput}
                onChange={(e) => setWeakSubjectsInput(e.target.value)}
                placeholder="Calculus II, Organic Chemistry"
                className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              <p className="text-xs text-slate-400 mt-1">Comma-separated course names</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Primary Focus Subjects
              </label>
              <input
                type="text"
                value={focusSubjectsInput}
                onChange={(e) => setFocusSubjectsInput(e.target.value)}
                placeholder="Calculus II, Data Structures"
                className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              <p className="text-xs text-slate-400 mt-1">Key courses for the current semester</p>
            </div>
          </div>
        </div>

        {/* Advisor Personality & Learning Methodology */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-4">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
            Advisor Persona & Learning Methodology
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Advisor Communication Tone
              </label>
              <select
                value={form.advisorPersonality}
                onChange={(e) => setForm({ ...form, advisorPersonality: e.target.value as any })}
                className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="encouraging">Encouraging & Empathetic (Positive reinforcement)</option>
                <option value="analytical">Analytical & Data-Driven (Focus on metrics & trends)</option>
                <option value="strict_disciplinarian">Disciplined Coach (High accountability & deadlines)</option>
                <option value="socratic">Socratic Mentor (Guiding questions & deep reflection)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Primary Learning Style
              </label>
              <select
                value={form.learningStyle}
                onChange={(e) => setForm({ ...form, learningStyle: e.target.value as any })}
                className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="active_recall">Active Recall & Flashcard Quizzing</option>
                <option value="spaced_repetition">Spaced Repetition Review</option>
                <option value="problem_solving">Problem-Solving & Practice Exam Drills</option>
                <option value="visual">Visual Concept Maps & Diagrams</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <div className="flex items-center space-x-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <Check className="w-4 h-4" />
              <span>Preferences saved to server context successfully!</span>
            </div>
          ) : (
            <div className="text-xs text-slate-400">
              Changes update the server-side context instantly for the AI advisor.
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Preferences'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
