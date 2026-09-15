import React, { useState } from 'react';
import { SchoolScheduleItem, StudyHistorySession } from '../types/academic';
import {
  Calendar,
  Clock,
  BookOpen,
  Plus,
  Flame,
  Award,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/apiClient';

interface ScheduleAndStudyViewProps {
  schedule: SchoolScheduleItem[];
  studyHistory: StudyHistorySession[];
  onDataChanged: () => void;
}

export const ScheduleAndStudyView: React.FC<ScheduleAndStudyViewProps> = ({
  schedule,
  studyHistory,
  onDataChanged,
}) => {
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>('All');

  // Study log form state
  const [logSubject, setLogSubject] = useState('Calculus II');
  const [logDuration, setLogDuration] = useState(60);
  const [logFocusScore, setLogFocusScore] = useState(8);
  const [logTopics, setLogTopics] = useState('Integration by parts, improper integrals');
  const [logNotes, setLogNotes] = useState('');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const filteredSchedule = selectedDay === 'All'
    ? schedule
    : schedule.filter((s) => s.dayOfWeek === selectedDay);

  const totalStudyMinutes = studyHistory.reduce((acc, s) => acc + s.durationMinutes, 0);
  const avgFocusScore = studyHistory.length > 0
    ? (studyHistory.reduce((acc, s) => acc + s.focusScore, 0) / studyHistory.length).toFixed(1)
    : '0';

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const now = new Date();
      await api.logStudySession({
        date: now.toISOString().split('T')[0],
        startTime: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        durationMinutes: Number(logDuration),
        subject: logSubject,
        focusScore: Number(logFocusScore),
        topicsCovered: logTopics.split(',').map((t) => t.trim()).filter(Boolean),
        notes: logNotes,
      });
      setShowLogModal(false);
      setLogNotes('');
      onDataChanged();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Section 1: School Schedule */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                School Timetable & Lecture Schedule
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Recurring class blocks used by the AI advisor to identify free study slots and avoid scheduling conflicts.
            </p>
          </div>

          {/* Day filter pills */}
          <div className="flex items-center space-x-1 border border-slate-200 dark:border-slate-700 rounded-lg p-1 bg-white dark:bg-slate-800 text-xs">
            <button
              onClick={() => setSelectedDay('All')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                selectedDay === 'All' ? 'bg-indigo-600 text-white' : 'text-slate-500'
              }`}
            >
              Full Week
            </button>
            {daysOfWeek.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  selectedDay === day ? 'bg-indigo-600 text-white' : 'text-slate-500'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredSchedule.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs space-y-2 relative overflow-hidden"
            >
              <div
                className="absolute top-0 left-0 bottom-0 w-1.5"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex justify-between items-start pl-2">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {item.courseCode}
                  </span>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {item.courseName}
                  </h4>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                  {item.dayOfWeek}
                </span>
              </div>
              <div className="pl-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                <span className="flex items-center space-x-1 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{item.startTime} - {item.endTime}</span>
                </span>
                <span>{item.room || 'Room TBA'}</span>
              </div>
              {item.instructor && (
                <div className="pl-2 text-xs text-slate-400">
                  Instructor: {item.instructor}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Study History Log */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Study History & Focus Sessions
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Completed study sessions with duration, focus quality scores, and topics covered.
            </p>
          </div>
          <button
            id="btn-log-session"
            onClick={() => setShowLogModal(true)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition shadow-xs self-start"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Study Session</span>
          </button>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-xs text-slate-500 dark:text-slate-400">Total Logged Time</span>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {(totalStudyMinutes / 60).toFixed(1)} hours
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-xs text-slate-500 dark:text-slate-400">Average Focus Score</span>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {avgFocusScore} / 10
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 col-span-2 sm:col-span-1">
            <span className="text-xs text-slate-500 dark:text-slate-400">Sessions Recorded</span>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {studyHistory.length} sessions
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs divide-y divide-slate-100 dark:divide-slate-700">
          {studyHistory.map((s) => (
            <div key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-sm text-slate-900 dark:text-white">
                    {s.subject}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {s.durationMinutes} mins
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded font-medium bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Focus: {s.focusScore}/10
                  </span>
                </div>
                {s.topicsCovered && s.topicsCovered.length > 0 && (
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Topics: {s.topicsCovered.join(', ')}
                  </p>
                )}
                {s.notes && (
                  <p className="text-xs text-slate-400 italic">
                    "{s.notes}"
                  </p>
                )}
              </div>
              <div className="text-xs text-slate-400 font-mono self-end sm:self-center">
                {s.date} {s.startTime ? `at ${s.startTime}` : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Log Session Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Log Completed Study Session
            </h3>
            <form onSubmit={handleLogSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={logSubject}
                  onChange={(e) => setLogSubject(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="480"
                    value={logDuration}
                    onChange={(e) => setLogDuration(Number(e.target.value))}
                    className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Focus Score (1 - 10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={logFocusScore}
                    onChange={(e) => setLogFocusScore(Number(e.target.value))}
                    className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Topics Covered (comma-separated)
                </label>
                <input
                  type="text"
                  value={logTopics}
                  onChange={(e) => setLogTopics(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Session Notes & Reflections
                </label>
                <textarea
                  rows={2}
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="Completed 8 practice questions, felt confident on trig substitutions..."
                  className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
                >
                  Save Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
