import React, { useState } from 'react';
import { Goal, Task } from '../types/studymate';
import {
  toPersianDigits,
  formatPersianDateString,
  calculateDaysRemaining,
} from '../utils/persianDate';
import { Target, Plus, Calendar, CheckSquare, Trash2, Edit2, X } from 'lucide-react';

interface GoalsScreenProps {
  goals: Goal[];
  tasks: Task[];
  onAddGoal: (goal: Omit<Goal, 'id'>) => void;
  onUpdateGoal: (id: string, updates: Partial<Goal>) => void;
  onDeleteGoal: (id: string) => void;
}

export const GoalsScreen: React.FC<GoalsScreenProps> = ({
  goals,
  tasks,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('2027-04-25');
  const [progress, setProgress] = useState(50);
  const [subject, setSubject] = useState('کنکور سراسری');
  const [description, setDescription] = useState('');

  const openAddModal = () => {
    setTitle('');
    setDeadline('2027-04-25');
    setProgress(30);
    setSubject('کنکور سراسری');
    setDescription('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDeadline(goal.deadline);
    setProgress(goal.progress);
    setSubject(goal.subject || '');
    setDescription(goal.description || '');
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingGoal) {
      onUpdateGoal(editingGoal.id, {
        title,
        deadline,
        progress: Number(progress),
        subject,
        description,
      });
      setEditingGoal(null);
    } else {
      onAddGoal({
        title,
        deadline,
        progress: Number(progress),
        subject,
        category: 'konkur',
        relatedTaskIds: [],
        description,
      });
      setIsAddModalOpen(false);
    }
  };

  const handleAdjustProgress = (goalId: string, delta: number) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    const newProgress = Math.max(0, Math.min(100, goal.progress + delta));
    onUpdateGoal(goalId, { progress: newProgress });
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#28264B]">اهداف بلندمدت و استراتژیک</h2>
          <p className="text-xs text-[#4E5174]">
            {toPersianDigits(goals.length)} هدف اصلی تعریف‌شده برای سال تحصیلی و کنکور
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="shiny-crimson-btn text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-reverse space-x-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>تعریف هدف</span>
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="glass-box rounded-2xl p-8 text-center space-y-2">
          <Target className="w-8 h-8 text-[#959EC9] mx-auto opacity-70 mb-2" />
          <p className="text-xs text-[#4E5174]">هنوز هیچ هدفی تعریف نکرده‌اید.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const countdown = calculateDaysRemaining(goal.deadline);
            const relatedTasks = tasks.filter((t) => goal.relatedTaskIds.includes(t.id));

            return (
              <div
                key={goal.id}
                className="glass-box glass-box-interactive rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-reverse space-x-2">
                      <div className="w-6 h-6 rounded-lg bg-[#AA0033]/15 flex items-center justify-center text-[#AA0033] shrink-0">
                        <Target className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="text-xs font-bold text-[#28264B]">{goal.title}</h3>
                    </div>
                    {goal.description && (
                      <p className="text-[11px] text-[#4E5174] leading-relaxed pr-8">
                        {goal.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-reverse space-x-1 shrink-0 mr-2">
                    <button
                      onClick={() => openEditModal(goal)}
                      className="p-1.5 rounded-lg text-[#4E5174] hover:text-[#28264B] hover:bg-white/80 transition"
                      title="ویرایش"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteGoal(goal.id)}
                      className="p-1.5 rounded-lg text-[#4E5174] hover:text-[#AA0033] hover:bg-[#AA0033]/10 transition"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar and control */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#28264B]">پیشرفت هدف:</span>
                    <div className="flex items-center space-x-reverse space-x-2">
                      <button
                        onClick={() => handleAdjustProgress(goal.id, -5)}
                        className="w-6 h-6 rounded-lg bg-white/80 hover:bg-white border border-white text-[#28264B] flex items-center justify-center font-bold text-xs transition"
                        title="-۵ درصد"
                      >
                        -
                      </button>
                      <span className="font-bold text-[#AA0033] min-w-[36px] text-center">
                        {toPersianDigits(goal.progress)}٪
                      </span>
                      <button
                        onClick={() => handleAdjustProgress(goal.id, 5)}
                        className="w-6 h-6 rounded-lg bg-white/80 hover:bg-white border border-white text-[#28264B] flex items-center justify-center font-bold text-xs transition"
                        title="+۵ درصد"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="w-full bg-[#E8EAE7] rounded-full h-2.5 overflow-hidden p-0.5 border border-white/80">
                    <div
                      className="bg-gradient-to-r from-[#959EC9] via-[#AA0033] to-[#AA0033] h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(170,0,51,0.4)]"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>

                {/* Meta details: Deadline & Related tasks */}
                <div className="flex items-center justify-between text-[11px] text-[#4E5174] pt-2 border-t border-white/60">
                  <div className="flex items-center space-x-reverse space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#959EC9]" />
                    <span>مهلت: {formatPersianDateString(goal.deadline)}</span>
                    <span className="shiny-periwinkle-pill text-[10px] px-2 py-0.2 rounded-md font-bold">
                      {countdown.label}
                    </span>
                  </div>

                  <div className="flex items-center space-x-reverse space-x-1">
                    <CheckSquare className="w-3.5 h-3.5 text-[#959EC9]" />
                    <span>{toPersianDigits(relatedTasks.length)} پارت مرتبط</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Goal Modal (Glass Modal) */}
      {(isAddModalOpen || editingGoal) && (
        <div className="fixed inset-0 z-50 bg-[#28264B]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-box bg-white/95 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 border border-white">
            <div className="flex items-center justify-between border-b border-white/80 pb-2">
              <h3 className="text-sm font-bold text-[#28264B]">
                {editingGoal ? 'ویرایش هدف تحصیلی' : 'تعریف هدف جدید'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingGoal(null);
                }}
                className="text-[#4E5174] hover:text-[#28264B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#28264B] mb-1">
                  عنوان هدف *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثلاً: قبولی در رشته پزشکی دانشگاه تهران"
                  className="w-full bg-[#E8EAE7]/70 border border-white rounded-xl px-3 py-2 text-xs text-[#28264B] outline-hidden focus:border-[#AA0033]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-[#28264B] mb-1">
                    مهلت رسیدن به هدف
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-[#E8EAE7]/70 border border-white rounded-xl px-2.5 py-1.5 text-xs text-[#28264B] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#28264B] mb-1">
                    درصد پیشرفت فعلی ({toPersianDigits(progress)}٪)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    className="w-full mt-2 accent-[#AA0033]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#28264B] mb-1">
                  حوزه / درس
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="مثلاً: جامع کنکور، زیست‌شناسی، معدل نهایی..."
                  className="w-full bg-[#E8EAE7]/70 border border-white rounded-xl px-3 py-2 text-xs text-[#28264B] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#28264B] mb-1">
                  توضیحات و یادداشت‌ها
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اقدامات کلیدی، منابع موردنیاز..."
                  className="w-full bg-[#E8EAE7]/70 border border-white rounded-xl p-2.5 text-xs text-[#28264B] outline-hidden focus:border-[#AA0033]"
                />
              </div>

              <div className="flex items-center justify-end space-x-reverse space-x-2 pt-2 border-t border-white/80">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingGoal(null);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs text-[#4E5174] hover:bg-black/5"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold shiny-crimson-btn text-white shadow-xs"
                >
                  {editingGoal ? 'ذخیره تغییرات' : 'ایجاد هدف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
