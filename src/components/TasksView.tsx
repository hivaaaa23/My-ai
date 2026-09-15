import React, { useState } from 'react';
import { Task, Priority } from '../types/academic';
import {
  CheckSquare,
  Square,
  Plus,
  Calendar,
  Clock,
  Tag,
  Search,
  Filter,
  Trash2,
  Edit2,
  CalendarClock,
} from 'lucide-react';
import { api } from '../services/apiClient';

interface TasksViewProps {
  tasks: Task[];
  onTasksChanged: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({ tasks, onTasksChanged }) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('active');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [reschedulingTask, setReschedulingTask] = useState<Task | null>(null);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Calculus II');
  const [newDueDate, setNewDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newEstimatedMinutes, setNewEstimatedMinutes] = useState(60);
  const [newDescription, setNewDescription] = useState('');
  const [newTags, setNewTags] = useState('homework, study');

  // Reschedule state
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('Balancing workload before upcoming exam');

  // Subjects list
  const subjects = Array.from(new Set(tasks.map((t) => t.subject)));

  // Filtered tasks
  const filteredTasks = tasks.filter((t) => {
    if (filterStatus === 'active' && t.completed) return false;
    if (filterStatus === 'completed' && !t.completed) return false;
    if (filterSubject !== 'all' && t.subject !== filterSubject) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleToggleComplete = async (task: Task) => {
    try {
      await api.updateTask(task.id, {
        completed: !task.completed,
        completedAt: !task.completed ? new Date().toISOString() : undefined,
      });
      onTasksChanged();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await api.deleteTask(id);
      onTasksChanged();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTask({
        title: newTitle,
        subject: newSubject,
        dueDate: newDueDate,
        priority: newPriority,
        estimatedMinutes: Number(newEstimatedMinutes),
        description: newDescription,
        tags: newTags.split(',').map((s) => s.trim()).filter(Boolean),
        completed: false,
      });
      setShowAddModal(false);
      setNewTitle('');
      setNewDescription('');
      onTasksChanged();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingTask || !rescheduleDate) return;

    try {
      // Execute through controlled action engine to showcase the server-side action flow!
      await api.executeControlledAction('reschedule_task', {
        taskId: reschedulingTask.id,
        newDueDate: rescheduleDate,
        reason: rescheduleReason,
      });
      setReschedulingTask(null);
      onTasksChanged();
    } catch (err) {
      console.error(err);
    }
  };

  const getPriorityBadge = (p: Priority) => {
    switch (p) {
      case 'urgent':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300';
      case 'high':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300';
      case 'medium':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300';
      case 'low':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Academic Tasks & Homework
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Structured tasks accessible by the Personal Study Advisor for automated scheduling and progress tracking.
          </p>
        </div>
        <button
          id="btn-add-task"
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition shadow-xs self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Add Study Task</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            id="task-search-input"
            type="text"
            placeholder="Search tasks, problem sets, keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Status Pill Filters */}
        <div className="flex items-center space-x-1 border border-slate-200 dark:border-slate-700 rounded-lg p-1 bg-slate-50 dark:bg-slate-900 text-xs">
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1 rounded font-medium transition ${
              filterStatus === 'active' ? 'bg-white dark:bg-slate-800 shadow-xs text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-500'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1 rounded font-medium transition ${
              filterStatus === 'completed' ? 'bg-white dark:bg-slate-800 shadow-xs text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-500'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1 rounded font-medium transition ${
              filterStatus === 'all' ? 'bg-white dark:bg-slate-800 shadow-xs text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-500'
            }`}
          >
            All ({tasks.length})
          </button>
        </div>

        {/* Subject Filter */}
        <div className="flex items-center space-x-1.5">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            id="task-subject-select"
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Subjects</option>
            {subjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs divide-y divide-slate-100 dark:divide-slate-700">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <CheckSquare className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-medium">No tasks found matching your criteria.</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 flex items-start justify-between gap-4 transition hover:bg-slate-50/60 dark:hover:bg-slate-750 ${
                task.completed ? 'opacity-60 bg-slate-50/40 dark:bg-slate-900/30' : ''
              }`}
            >
              {/* Left: Checkbox & Details */}
              <div className="flex items-start space-x-3 flex-1">
                <button
                  onClick={() => handleToggleComplete(task)}
                  className="mt-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  {task.completed ? (
                    <CheckSquare className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>

                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-sm font-semibold ${
                        task.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {task.title}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                      {task.subject}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium border ${getPriorityBadge(
                        task.priority
                      )}`}
                    >
                      {task.priority.toUpperCase()}
                    </span>
                  </div>

                  {task.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl">
                      {task.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                    <span className="flex items-center space-x-1 text-slate-600 dark:text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Due: {task.dueDate}</span>
                    </span>
                    <span className="flex items-center space-x-1 text-slate-600 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{task.estimatedMinutes} mins</span>
                    </span>
                    {task.tags && task.tags.length > 0 && (
                      <span className="flex items-center space-x-1">
                        <Tag className="w-3.5 h-3.5" />
                        <span>{task.tags.join(', ')}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center space-x-1">
                <button
                  id={`btn-reschedule-${task.id}`}
                  onClick={() => {
                    setReschedulingTask(task);
                    setRescheduleDate(task.dueDate);
                  }}
                  title="Reschedule task date (Controlled Action)"
                  className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <CalendarClock className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  title="Delete task"
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Add Academic Study Task
            </h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Task Title
                </label>
                <input
                  id="modal-task-title"
                  type="text"
                  required
                  placeholder="e.g. Practice integration by parts problems"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
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
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as Priority)}
                    className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estimated Duration
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min="5"
                      max="480"
                      value={newEstimatedMinutes}
                      onChange={(e) => setNewEstimatedMinutes(Number(e.target.value))}
                      className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                    <span className="ml-2 text-xs text-slate-400">mins</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Study Directives
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Textbook problems 12-25, make flashcards..."
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
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal (Testing Controlled Action) */}
      {reschedulingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Reschedule Task (Controlled Action)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Demonstrates the server-side action <code>reschedule_task</code> that Gemini will invoke.
            </p>
            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Task:</span>{' '}
                <span className="text-slate-900 dark:text-white">{reschedulingTask.title}</span>
                <div className="text-slate-400 mt-1">Current Due Date: {reschedulingTask.dueDate}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Due Date
                </label>
                <input
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Advisor Rescheduling Rationale
                </label>
                <input
                  type="text"
                  required
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReschedulingTask(null)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
                >
                  Dispatch Reschedule Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
