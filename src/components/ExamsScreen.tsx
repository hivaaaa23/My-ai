import React, { useState } from 'react';
import { Exam } from '../types/studymate';
import {
  toPersianDigits,
  formatPersianDateString,
  calculateDaysRemaining,
} from '../utils/persianDate';
import { CalendarDays, Plus, Trash2, Edit2, X, Star, AlertCircle, Clock } from 'lucide-react';

interface ExamsScreenProps {
  exams: Exam[];
  onAddExam: (exam: Omit<Exam, 'id'>) => void;
  onUpdateExam: (id: string, updates: Partial<Exam>) => void;
  onDeleteExam: (id: string) => void;
}

export const ExamsScreen: React.FC<ExamsScreenProps> = ({
  exams,
  onAddExam,
  onUpdateExam,
  onDeleteExam,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [isImportant, setIsImportant] = useState(true);

  const openAddModal = () => {
    setTitle('');
    setDate(new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);
    setSubject('');
    setNotes('');
    setIsImportant(true);
    setIsAddModalOpen(true);
  };

  const openEditModal = (exam: Exam) => {
    setEditingExam(exam);
    setTitle(exam.title);
    setDate(exam.date);
    setSubject(exam.subject);
    setNotes(exam.notes || '');
    setIsImportant(!!exam.isImportant);
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingExam) {
      onUpdateExam(editingExam.id, {
        title,
        date,
        subject,
        notes,
        isImportant,
      });
      setEditingExam(null);
    } else {
      onAddExam({
        title,
        date,
        subject,
        notes,
        isImportant,
      });
      setIsAddModalOpen(false);
    }
  };

  // Sort exams by date
  const sortedExams = [...exams].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#28264B]">آزمون‌ها و روزشمار کنکور</h2>
          <p className="text-xs text-[#4E5174]">
            {toPersianDigits(exams.length)} آزمون و مهلت ثبت‌شده در فایربیس
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="shiny-crimson-btn text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-reverse space-x-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن آزمون</span>
        </button>
      </div>

      {sortedExams.length === 0 ? (
        <div className="glass-box rounded-2xl p-8 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-[#959EC9] mx-auto opacity-70 mb-2" />
          <p className="text-xs text-[#4E5174]">هیچ آزمونی ثبت نشده است.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedExams.map((exam) => {
            const countdown = calculateDaysRemaining(exam.date);

            return (
              <div
                key={exam.id}
                className={`glass-box glass-box-interactive rounded-2xl p-4 space-y-2.5 ${
                  exam.isImportant
                    ? 'border-[#AA0033]/40 shadow-sm'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center space-x-reverse space-x-2">
                      {exam.isImportant ? (
                        <div className="w-6 h-6 rounded-lg bg-[#AA0033]/15 flex items-center justify-center text-[#AA0033] shrink-0">
                          <Star className="w-3.5 h-3.5 fill-[#AA0033]" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-lg bg-[#959EC9]/20 flex items-center justify-center text-[#28264B] shrink-0">
                          <CalendarDays className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <h3 className="text-xs font-bold text-[#28264B] truncate">{exam.title}</h3>
                    </div>

                    <p className="text-[11px] text-[#4E5174] font-medium pr-8">
                      {exam.subject}
                    </p>

                    {exam.notes && (
                      <p className="text-[11px] text-[#4E5174] pr-8 leading-relaxed opacity-90">
                        {exam.notes}
                      </p>
                    )}
                  </div>

                  {/* Countdown Badge */}
                  <div className="shrink-0 mr-3 text-left">
                    <div
                      className={`px-3 py-1.5 rounded-xl border text-center ${
                        countdown.isToday
                          ? 'shiny-crimson-btn font-bold'
                          : countdown.isPast
                          ? 'bg-white/60 border-white text-slate-500'
                          : countdown.days <= 7
                          ? 'shiny-crimson-pill font-bold'
                          : 'shiny-periwinkle-pill'
                      }`}
                    >
                      <span className="text-xs block font-bold">{countdown.label}</span>
                      <span className="text-[10px] opacity-85 block">
                        {formatPersianDateString(exam.date)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#4E5174] pt-2 border-t border-white/60">
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 ml-1 text-[#959EC9]" />
                    تاریخ برگزاری: {formatPersianDateString(exam.date)}
                  </span>

                  <div className="flex items-center space-x-reverse space-x-1">
                    <button
                      onClick={() => openEditModal(exam)}
                      className="p-1.5 rounded-lg text-[#4E5174] hover:text-[#28264B] hover:bg-white/80 transition"
                      title="ویرایش"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteExam(exam.id)}
                      className="p-1.5 rounded-lg text-[#4E5174] hover:text-[#AA0033] hover:bg-[#AA0033]/10 transition"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Exam Modal (Glass Modal) */}
      {(isAddModalOpen || editingExam) && (
        <div className="fixed inset-0 z-50 bg-[#28264B]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-box bg-white/95 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 border border-white">
            <div className="flex items-center justify-between border-b border-white/80 pb-2">
              <h3 className="text-sm font-bold text-[#28264B]">
                {editingExam ? 'ویرایش آزمون یا مهلت' : 'افزودن آزمون جدید'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingExam(null);
                }}
                className="text-[#4E5174] hover:text-[#28264B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#28264B] mb-1">
                  عنوان آزمون / رویداد *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثلاً: آزمون مرحله ۶ کانون (قلم‌چی)"
                  className="w-full bg-[#E8EAE7]/70 border border-white rounded-xl px-3 py-2 text-xs text-[#28264B] outline-hidden focus:border-[#AA0033]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-[#28264B] mb-1">
                    تاریخ برگزاری
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#E8EAE7]/70 border border-white rounded-xl px-2.5 py-1.5 text-xs text-[#28264B] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#28264B] mb-1">
                    دروس / سرفصل‌ها
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="زیست، شیمی، ریاضی..."
                    className="w-full bg-[#E8EAE7]/70 border border-white rounded-xl px-2.5 py-1.5 text-xs text-[#28264B] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#28264B] mb-1">
                  نکات و بودجه‌بندی مباحث (اختیاری)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="بودجه‌بندی آزمون، تراز هدف، نکات آزمون..."
                  className="w-full bg-[#E8EAE7]/70 border border-white rounded-xl p-2.5 text-xs text-[#28264B] outline-hidden focus:border-[#AA0033]"
                />
              </div>

              <div className="flex items-center space-x-reverse space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="isImportantCheck"
                  checked={isImportant}
                  onChange={(e) => setIsImportant(e.target.checked)}
                  className="accent-[#AA0033] w-4 h-4 rounded"
                />
                <label htmlFor="isImportantCheck" className="text-xs text-[#28264B] font-medium cursor-pointer">
                  نشانه‌گذاری به عنوان آزمون مهم (ستاره‌دار در صفحه اصلی)
                </label>
              </div>

              <div className="flex items-center justify-end space-x-reverse space-x-2 pt-2 border-t border-white/80">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingExam(null);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs text-[#4E5174] hover:bg-black/5"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold shiny-crimson-btn text-white shadow-xs"
                >
                  {editingExam ? 'ذخیره تغییرات' : 'ثبت آزمون'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
