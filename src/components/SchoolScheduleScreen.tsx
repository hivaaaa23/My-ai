import React, { useState } from 'react';
import { SchoolClass, DayOfWeek } from '../types/studymate';
import { PERSIAN_WEEKDAYS, toPersianDigits } from '../utils/persianDate';
import { Clock, Plus, Trash2, Edit2, X, BookOpen, User, MapPin } from 'lucide-react';

interface SchoolScheduleScreenProps {
  schedule: SchoolClass[];
  onAddClass: (item: Omit<SchoolClass, 'id'>) => void;
  onUpdateClass: (id: string, updates: Partial<SchoolClass>) => void;
  onDeleteClass: (id: string) => void;
}

const WEEKDAYS: DayOfWeek[] = [
  'saturday',
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
];

export const SchoolScheduleScreen: React.FC<SchoolScheduleScreenProps> = ({
  schedule,
  onAddClass,
  onUpdateClass,
  onDeleteClass,
}) => {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('saturday');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);

  // Form states
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('saturday');
  const [period, setPeriod] = useState(1);
  const [startTime, setStartTime] = useState('۰۷:۳۰');
  const [endTime, setEndTime] = useState('۰۹:۰۰');
  const [subject, setSubject] = useState('');
  const [teacher, setTeacher] = useState('');
  const [room, setRoom] = useState('کلاس ۳۰۱');

  const openAddModal = () => {
    setDayOfWeek(selectedDay);
    setPeriod(1);
    setStartTime('۰۷:۳۰');
    setEndTime('۰۹:۰۰');
    setSubject('');
    setTeacher('');
    setRoom('کلاس ۳۰۱');
    setIsAddModalOpen(true);
  };

  const openEditModal = (item: SchoolClass) => {
    setEditingClass(item);
    setDayOfWeek(item.dayOfWeek);
    setPeriod(item.period);
    setStartTime(item.startTime);
    setEndTime(item.endTime);
    setSubject(item.subject);
    setTeacher(item.teacher || '');
    setRoom(item.room || '');
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    if (editingClass) {
      onUpdateClass(editingClass.id, {
        dayOfWeek,
        period: Number(period),
        startTime,
        endTime,
        subject,
        teacher,
        room,
      });
      setEditingClass(null);
    } else {
      onAddClass({
        dayOfWeek,
        period: Number(period),
        startTime,
        endTime,
        subject,
        teacher,
        room,
      });
      setIsAddModalOpen(false);
    }
  };

  // Filter for currently selected day and sort by period
  const dayClasses = schedule
    .filter((c) => c.dayOfWeek === selectedDay)
    .sort((a, b) => a.period - b.period);

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#28264B]">برنامه هفتگی مدرسه</h2>
          <p className="text-xs text-[#4E5174]">تنظیم زنگ‌ها و ساعات کلاس‌های دبیرستان</p>
        </div>

        <button
          onClick={openAddModal}
          className="shiny-crimson-btn text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-reverse space-x-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن کلاس</span>
        </button>
      </div>

      {/* Weekday Selector Tabs (Glass Bar) */}
      <div className="flex glass-box rounded-2xl p-1.5 gap-1 overflow-x-auto scrollbar-none">
        {WEEKDAYS.map((day) => {
          const isSelected = selectedDay === day;
          const count = schedule.filter((c) => c.dayOfWeek === day).length;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-1 min-w-[54px] py-2 px-1 rounded-xl text-center transition ${
                isSelected
                  ? 'bg-gradient-to-r from-[#28264B] to-[#3A3764] text-white shadow-xs border border-white/20'
                  : 'hover:bg-white/60 text-[#4E5174]'
              }`}
            >
              <span className="text-xs font-bold block">{PERSIAN_WEEKDAYS[day].full}</span>
              <span
                className={`text-[10px] block mt-0.5 ${
                  isSelected ? 'text-[#959EC9]' : 'text-[#4E5174]/70'
                }`}
              >
                {toPersianDigits(count)} زنگ
              </span>
            </button>
          );
        })}
      </div>

      {/* Day Timetable */}
      {dayClasses.length === 0 ? (
        <div className="glass-box rounded-2xl p-8 text-center space-y-2">
          <BookOpen className="w-8 h-8 text-[#959EC9] mx-auto opacity-70" />
          <p className="text-xs text-[#4E5174]">
            برای روز {PERSIAN_WEEKDAYS[selectedDay].full} کلاسی ثبت نشده است.
          </p>
          <button
            onClick={openAddModal}
            className="text-xs font-semibold text-[#AA0033] hover:underline"
          >
            ثبت اولین زنگ این روز
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {dayClasses.map((item) => (
            <div
              key={item.id}
              className="glass-box glass-box-interactive rounded-2xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center space-x-reverse space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#959EC9]/25 to-[#4E5174]/15 border border-white/80 flex flex-col items-center justify-center shrink-0 shadow-2xs">
                  <span className="text-[10px] text-[#4E5174]">زنگ</span>
                  <span className="text-xs font-black text-[#28264B]">
                    {toPersianDigits(item.period)}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-[#28264B]">{item.subject}</h3>
                  <div className="flex items-center space-x-reverse space-x-3 text-[11px] text-[#4E5174]">
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 ml-1 text-[#959EC9]" />
                      {toPersianDigits(item.startTime)} تا {toPersianDigits(item.endTime)}
                    </span>
                    {item.teacher && (
                      <span className="flex items-center">
                        <User className="w-3 h-3 ml-1 text-[#959EC9]" />
                        {item.teacher}
                      </span>
                    )}
                    {item.room && (
                      <span className="flex items-center">
                        <MapPin className="w-3 h-3 ml-1 text-[#959EC9]" />
                        {item.room}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-reverse space-x-1 shrink-0 mr-2">
                <button
                  onClick={() => openEditModal(item)}
                  className="p-1.5 rounded-lg text-[#4E5174] hover:text-[#28264B] hover:bg-white/80 transition"
                  title="ویرایش"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteClass(item.id)}
                  className="p-1.5 rounded-lg text-[#4E5174] hover:text-[#AA0033] hover:bg-[#AA0033]/10 transition"
                  title="حذف"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Class Modal (Glass Modal) */}
      {(isAddModalOpen || editingClass) && (
        <div className="fixed inset-0 z-50 bg-[#28264B]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-box bg-white/95 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 border border-white">
            <div className="flex items-center justify-between border-b border-white/80 pb-2">
              <h3 className="text-sm font-bold text-[#28264B]">
                {editingClass ? 'ویرایش کلاس مدرسه' : 'افزودن زنگ جدید به برنامه'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingClass(null);
                }}
                className="text-[#4E5174] hover:text-[#28264B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-[#28264B] mb-1">
                    روز هفته
                  </label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
                    className="w-full bg-[#E8EAE7]/70 border border-white rounded-xl px-2.5 py-1.5 text-xs text-[#28264B] outline-hidden"
                  >
                    {WEEKDAYS.map((d) => (
                      <option key={d} value={d}>
                        {PERSIAN_WEEKDAYS[d].full}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#28264B] mb-1">
                    شماره زنگ
                  </label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(Number(e.target.value))}
                    className="w-full bg-[#E8EAE7]/70 border border-white rounded-xl px-2.5 py-1.5 text-xs text-[#28264B] outline-hidden"
                  >
                    <option value={1}>زنگ اول</option>
                    <option value={2}>زنگ دوم</option>
                    <option value={3}>زنگ سوم</option>
                    <option value={4}>زنگ چهارم</option>
                    <option value={5}>زنگ پنجم</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#28264B] mb-1">
                  نام درس *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="مثلاً: زیست‌شناسی ۳، شیمی ۳..."
                  className="w-full bg-[#E8EAE7]/70 border border-white rounded-xl px-3 py-2 text-xs text-[#28264B] outline-hidden focus:border-[#AA0033]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-[#28264B] mb-1">
                    ساعت شروع
                  </label>
                  <input
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="۰۷:۳۰"
                    className="w-full bg-[#E8EAE7]/70 border border-white rounded-xl px-2.5 py-1.5 text-xs text-[#28264B] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#28264B] mb-1">
                    ساعت پایان
                  </label>
                  <input
                    type="text"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="۰۹:۰۰"
                    className="w-full bg-[#E8EAE7]/70 border border-white rounded-xl px-2.5 py-1.5 text-xs text-[#28264B] outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-[#28264B] mb-1">
                    نام دبیر
                  </label>
                  <input
                    type="text"
                    value={teacher}
                    onChange={(e) => setTeacher(e.target.value)}
                    placeholder="استاد حسینی"
                    className="w-full bg-[#E8EAE7]/70 border border-white rounded-xl px-2.5 py-1.5 text-xs text-[#28264B] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#28264B] mb-1">
                    کلاس / آزمایشگاه
                  </label>
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="کلاس ۳۰۱"
                    className="w-full bg-[#E8EAE7]/70 border border-white rounded-xl px-2.5 py-1.5 text-xs text-[#28264B] outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-reverse space-x-2 pt-2 border-t border-white/80">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingClass(null);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs text-[#4E5174] hover:bg-black/5"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold shiny-crimson-btn text-white shadow-xs"
                >
                  {editingClass ? 'ذخیره تغییرات' : 'ثبت در برنامه'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
