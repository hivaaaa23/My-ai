import React, { useState } from 'react';
import { Task, TaskPriority, TaskStatus } from '../types/studymate';
import {
  toPersianDigits,
  formatPersianDateString,
} from '../utils/persianDate';
import {
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Edit2,
  X,
  Filter,
  AlertCircle,
} from 'lucide-react';

interface TasksScreenProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onToggleTask: (id: string) => void;
}

const KONKUR_SUBJECTS = [
  'حسابان ۱',
  'هندسه ۲',
  'آمار و احتمال',
  'فیزیک ۲',
  'شیمی ۲',
  'آزمایشگاه علوم تجربی ۲',
  'انسان و محیط زیست',
  'ادبیات فارسی ۲',
  'نگارش ۲',
  'دین و زندگی ۲',
  'زبان انگلیسی ۲',
  'کتاب کار انگلیسی ۲',
  'عربی، زبان قرآن ۲',
  'تاریخ معاصر ایران',
  'زمین‌شناسی',
  'مشاوره و آزمون جامع',
];

export const TasksScreen: React.FC<TasksScreenProps> = ({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onToggleTask,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'todo' | 'completed'>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(KONKUR_SUBJECTS[0]);
  const [priority, setPriority] = useState<TaskPriority>('high');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);
  const [notes, setNotes] = useState('');

  const openAddModal = () => {
    setTitle('');
    setSubject(KONKUR_SUBJECTS[0]);
    setPriority('high');
    setDueDate(new Date().toISOString().split('T')[0]);
    setEstimatedMinutes(60);
    setNotes('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setSubject(task.subject);
    setPriority(task.priority);
    setDueDate(task.dueDate);
    setEstimatedMinutes(task.estimatedMinutes);
    setNotes(task.notes || '');
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingTask) {
      onUpdateTask(editingTask.id, {
        title,
        subject,
        priority,
        dueDate,
        estimatedMinutes: Number(estimatedMinutes),
        notes,
      });
      setEditingTask(null);
    } else {
      onAddTask({
        title,
        subject,
        priority,
        dueDate,
        status: 'todo',
        completed: false,
        estimatedMinutes: Number(estimatedMinutes),
        notes,
      });
      setIsAddModalOpen(false);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (filterStatus === 'todo' && task.completed) return false;
    if (filterStatus === 'completed' && !task.completed) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    if (filterSubject !== 'all' && task.subject !== filterSubject) return false;
    return true;
  });

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="space-y-4 pb-20">
      {/* Top Header Summary & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#28264B]">برنامه‌ها و پارت‌های مطالعه</h2>
          <p className="text-xs text-[#4E5174]">
            {toPersianDigits(completedCount)} از {toPersianDigits(tasks.length)} مورد تکمیل شده
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="shiny-crimson-btn text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-reverse space-x-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن پارت مطالعه</span>
        </button>
      </div>

      {/* Filters Bar (Glass Box) */}
      <div className="glass-box rounded-2xl p-3 space-y-2.5">
        <div className="flex items-center space-x-reverse space-x-1.5 text-xs text-[#28264B] font-semibold">
          <Filter className="w-3.5 h-3.5 text-[#AA0033]" />
          <span>فیلتر و دسته‌بندی:</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
              filterStatus === 'all'
                ? 'bg-[#28264B] text-white shadow-xs'
                : 'bg-white/60 text-[#4E5174] hover:bg-white border border-white/80'
            }`}
          >
            همه ({toPersianDigits(tasks.length)})
          </button>
          <button
            onClick={() => setFilterStatus('todo')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
              filterStatus === 'todo'
                ? 'bg-[#28264B] text-white shadow-xs'
                : 'bg-white/60 text-[#4E5174] hover:bg-white border border-white/80'
            }`}
          >
            در انتظار ({toPersianDigits(tasks.filter((t) => !t.completed).length)})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
              filterStatus === 'completed'
                ? 'bg-[#28264B] text-white shadow-xs'
                : 'bg-white/60 text-[#4E5174] hover:bg-white border border-white/80'
            }`}
          >
            تکمیل شده ({toPersianDigits(completedCount)})
          </button>
        </div>

        <div className="flex items-center space-x-reverse space-x-2 pt-1 border-t border-white/60">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-white/70 text-xs text-[#28264B] border border-white/80 rounded-xl px-2.5 py-1.5 outline-hidden flex-1"
          >
            <option value="all">همه اولویت‌ها</option>
            <option value="urgent">فوری</option>
            <option value="high">مهم</option>
            <option value="medium">متوسط</option>
            <option value="low">کم</option>
          </select>

          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="bg-white/70 text-xs text-[#28264B] border border-white/80 rounded-xl px-2.5 py-1.5 outline-hidden flex-1"
          >
            <option value="all">همه درس‌ها</option>
            {KONKUR_SUBJECTS.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="glass-box rounded-2xl p-8 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-[#959EC9] mx-auto opacity-70" />
          <p className="text-xs text-[#4E5174]">هیچ برنامه‌ای با این فیلترها یافت نشد.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`glass-box glass-box-interactive rounded-2xl p-3.5 space-y-2 ${
                task.completed ? 'opacity-70 bg-white/40' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-reverse space-x-2.5 flex-1 min-w-0">
                  <button
                    onClick={() => onToggleTask(task.id)}
                    className="mt-0.5 shrink-0 focus:outline-hidden"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-[#AA0033]" />
                    ) : (
                      <Circle className="w-5 h-5 text-[#959EC9] hover:text-[#28264B]" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-bold leading-snug ${
                        task.completed ? 'line-through text-[#4E5174]' : 'text-[#28264B]'
                      }`}
                    >
                      {task.title}
                    </p>

                    {task.notes && (
                      <p className="text-[11px] text-[#4E5174] mt-1 leading-relaxed">
                        {task.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-reverse space-x-1 shrink-0 mr-2">
                  <button
                    onClick={() => openEditModal(task)}
                    className="p-1.5 rounded-lg text-[#4E5174] hover:text-[#28264B] hover:bg-white/80 transition"
                    title="ویرایش"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1.5 rounded-lg text-[#4E5174] hover:text-[#AA0033] hover:bg-[#AA0033]/10 transition"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Badges & Meta */}
              <div className="flex items-center justify-between text-[11px] text-[#4E5174] pt-1.5 border-t border-white/60">
                <div className="flex items-center space-x-reverse space-x-2">
                  <span className="px-2 py-0.5 rounded-md bg-white/70 text-[#28264B] font-medium border border-white/80">
                    {task.subject}
                  </span>
                  <span className="flex items-center text-[#4E5174]">
                    <Clock className="w-3 h-3 ml-1 text-[#959EC9]" />
                    {toPersianDigits(task.estimatedMinutes)} دقیقه
                  </span>
                </div>

                <div className="flex items-center space-x-reverse space-x-2">
                  <span
                    className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      task.priority === 'urgent'
                        ? 'shiny-crimson-pill'
                        : task.priority === 'high'
                        ? 'shiny-periwinkle-pill'
                        : 'bg-white/80 text-[#4E5174]'
                    }`}
                  >
                    {task.priority === 'urgent'
                      ? 'فوری'
                      : task.priority === 'high'
                      ? 'مهم'
                      : task.priority === 'medium'
                      ? 'متوسط'
                      : 'کم'}
                  </span>
                  <span>موعد: {formatPersianDateString(task.dueDate)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Task Modal (Glass Modal) */}
      {(isAddModalOpen || editingTask) && (
        <div className="fixed inset-0 z-50 bg-[#28264B]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-box bg-white/95 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 border border-white">
            <div className="flex items-center justify-between border-b border-white/80 pb-2">
              <h3 className="text-sm font-bold text-[#28264B]">
                {editingTask ? 'ویرایش پارت مطالعه' : 'افزودن پارت مطالعه جدید'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingTask(null);
                }}
                className="text-[#4E5174] hover:text-[#28264B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#28264B] mb-1">
                  عنوان پارت مطالعه *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثلاً: حل ۴۰ تست مدار الکتریکی فیزیک ۳"
                  className="w-full bg-[#E8EAE7]/70 border border-white rounded-xl px-3 py-2 text-xs text-[#28264B] outline-hidden focus:border-[#AA0033]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-[#28264B] mb-1">
                    درس / موضوع
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-[#E8EAE7]/70 border border-white rounded-xl px-2.5 py-2 text-xs text-[#28264B] outline-hidden"
                  >
                    {KONKUR_SUBJECTS.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#28264B] mb-1">
                    اولویت
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full bg-[#E8EAE7]/70 border border-white rounded-xl px-2.5 py-2 text-xs text-[#28264B] outline-hidden"
                  >
                    <option value="urgent">فوری</option>
                    <option value="high">مهم</option>
                    <option value="medium">متوسط</option>
                    <option value="low">کم</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-[#28264B] mb-1">
                    تاریخ موعد
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-[#E8EAE7]/70 border border-white rounded-xl px-2.5 py-1.5 text-xs text-[#28264B] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#28264B] mb-1">
                    زمان پیش‌بینی شده (دقیقه)
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="5"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                    className="w-full bg-[#E8EAE7]/70 border border-white rounded-xl px-2.5 py-1.5 text-xs text-[#28264B] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#28264B] mb-1">
                  نکات و توضیحات مطالعه (اختیاری)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="نکات منبع تستی، صفحات مهم، تیپ تست‌ها..."
                  className="w-full bg-[#E8EAE7]/70 border border-white rounded-xl p-2.5 text-xs text-[#28264B] outline-hidden focus:border-[#AA0033]"
                />
              </div>

              <div className="flex items-center justify-end space-x-reverse space-x-2 pt-2 border-t border-white/80">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingTask(null);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs text-[#4E5174] hover:bg-black/5"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold shiny-crimson-btn text-white shadow-xs"
                >
                  {editingTask ? 'ذخیره تغییرات' : 'افزودن پارت مطالعه'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
