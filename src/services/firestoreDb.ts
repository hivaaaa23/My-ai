/**
 * Firestore Database Service for StudyMate
 * Handles cloud persistence for tasks, goals, exams, deadlines, school schedule,
 * daily tests, study history, chat history, and user preferences.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, getStudentUserId } from './firebase';
import {
  Task,
  Goal,
  Exam,
  Deadline,
  SchoolClass,
  DailyTestItem,
  StudyHistoryItem,
  ChatMessage,
  UserPreferences,
  DailyQuote,
} from '../types/studymate';

// Default initial Konkur data
export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'حل ۵۰ تست ژنتیک مندلی و شجره‌نامه (زیست ۳)',
    subject: 'زیست‌شناسی',
    priority: 'urgent',
    dueDate: new Date().toISOString().split('T')[0],
    status: 'in_progress',
    completed: false,
    estimatedMinutes: 80,
    notes: 'تمرکز روی سوالات نزول صفات اتوزومی و وابسته به جنس',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-2',
    title: 'مطالعه درسنامه اسیدها و بازها و مسائل pH (شیمی ۳)',
    subject: 'شیمی',
    priority: 'high',
    dueDate: new Date().toISOString().split('T')[0],
    status: 'completed',
    completed: true,
    estimatedMinutes: 60,
    notes: 'فرمول‌های یونش مرحله‌ای و بافرها مرور شد',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-3',
    title: 'حل ۳۰ تست حرکت بر خط راست با شتاب ثابت (فیزیک ۳)',
    subject: 'فیزیک',
    priority: 'high',
    dueDate: new Date().toISOString().split('T')[0],
    status: 'todo',
    completed: false,
    estimatedMinutes: 70,
    notes: 'تحلیل نمودارهای مکان-زمان و سرعت-زمان',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-4',
    title: 'مرور قضایای حد و پیوستگی توابع کسری و مثلثاتی (ریاضی ۳)',
    subject: 'ریاضیات',
    priority: 'medium',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    status: 'todo',
    completed: false,
    estimatedMinutes: 50,
    notes: 'رفع ابهام صفر صفرم با قاعده‌های جبری و هم‌ارزی',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-5',
    title: 'روخوانی متن درس ۱ تا ۳ فارسی دوازدهم و لغات انتهای کتاب',
    subject: 'فارسی عمومی',
    priority: 'low',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    status: 'todo',
    completed: false,
    estimatedMinutes: 35,
    notes: 'آمادگی برای امتحانات نهایی خرداد ماه',
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_GOALS: Goal[] = [
  {
    id: 'goal-1',
    title: 'قبولی در رشته پزشکی دانشگاه علوم پزشکی تهران',
    deadline: '2027-04-25',
    progress: 68,
    subject: 'جامع کنکور تجربی',
    category: 'konkur',
    relatedTaskIds: ['task-1', 'task-2', 'task-3'],
    description: 'کسب رتبه زیر ۵۰۰ منطقه در کنکور سراسری نوبت اول و دوم',
  },
  {
    id: 'goal-2',
    title: 'تثبیت میانگین درصد زیست‌شناسی بالای ۷۵٪ در آزمون‌ها',
    deadline: '2026-11-30',
    progress: 82,
    subject: 'زیست‌شناسی',
    category: 'tests',
    relatedTaskIds: ['task-1'],
    description: 'تسلط کامل بر شکل‌ها و قیدهای کتاب‌های زیست دهم، یازدهم و دوازدهم',
  },
  {
    id: 'goal-3',
    title: 'جمع‌بندی تستی دروس پایه دهم و یازدهم تا پایان پاییز',
    deadline: '2026-12-21',
    progress: 54,
    subject: 'دروس پایه',
    category: 'konkur',
    relatedTaskIds: ['task-4'],
    description: 'اتمام تست‌های پوششی و مروری کتاب‌های جامع تستی',
  },
  {
    id: 'goal-4',
    title: 'معدل بالای ۱۹.۵ در امتحانات نهایی خرداد',
    deadline: '2027-03-20',
    progress: 45,
    subject: 'امتحانات نهایی',
    category: 'school',
    relatedTaskIds: ['task-5'],
    description: 'تسلط تشریحی کامل روی دروس عمومی و اختصاصی دوازدهم برای تاثیر قطعی سوابق',
  },
];

export const INITIAL_EXAMS: Exam[] = [
  {
    id: 'exam-1',
    title: 'آزمون مرحله ۵ کانون فرهنگی آموزش (قلم‌چی)',
    date: new Date(Date.now() + 86400000 * 6).toISOString().split('T')[0],
    subject: 'زیست، شیمی، فیزیک، ریاضی (پایه + پیشروی دوازدهم)',
    notes: 'بودجه‌بندی: فصل ۱ و ۲ دوازدهم + کل زیست دهم. هدف‌گذاری تراز: بالای ۶۴۰۰',
    isImportant: true,
  },
  {
    id: 'exam-2',
    title: 'آزمون جامع دوره‌ای سنجش نوبت پاییز',
    date: new Date(Date.now() + 86400000 * 22).toISOString().split('T')[0],
    subject: 'تمام دروس اختصاصی پایه دهم و یازدهم',
    notes: 'شبیه‌ساز استاندارد سازمان سنجش با جامعه آماری بالا',
    isImportant: true,
  },
  {
    id: 'exam-3',
    title: 'کنکور سراسری نوبت اول (اردیبهشت ماه)',
    date: '2027-04-24',
    subject: 'کنکور سراسری علوم تجربی',
    notes: 'مهم‌ترین رقابت سال تحصیلی - دفترچه اختصاصی ۱ و ۲',
    isImportant: true,
  },
  {
    id: 'exam-4',
    title: 'امتحان مستمر کلاسی شیمی دوازدهم',
    date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    subject: 'شیمی دوازدهم فصل ۱',
    notes: 'مسائل اسید و باز، واکنش اکسایش-کاهش و سلول گالوانی',
    isImportant: false,
  },
];

export const INITIAL_DEADLINES: Deadline[] = [
  {
    id: 'dl-1',
    title: 'مهلت ثبت‌نام در کنکور سراسری نوبت اول',
    dueDate: '2026-11-15',
    category: 'registration',
    priority: 'urgent',
    completed: false,
    notes: 'تکمیل سوابق تحصیلی در سامانه مای مدیو و دریافت کد رهگیری سوابق',
  },
  {
    id: 'dl-2',
    title: 'تحویل تکالیف تستی فصل ۱ فیزیک ۳ به استاد مرادی',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    category: 'school',
    priority: 'high',
    completed: false,
    notes: 'پاسخنامه تشریحی ۵۰ تست مبحث سقوط آزاد و شتاب ثابت',
  },
  {
    id: 'dl-3',
    title: 'اتمام خلاصه‌نویسی و نقشه ذهنی گوارش زیست دهم',
    dueDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
    category: 'project',
    priority: 'medium',
    completed: true,
    notes: 'جدول تفکیکی آنزیم‌های گوارشی، شیره پانکراس و هورمون‌ها',
  },
];

export const INITIAL_SCHEDULE: SchoolClass[] = [
  { id: 'sch-1', dayOfWeek: 'saturday', period: 1, startTime: '۰۷:۳۰', endTime: '۰۹:۰۰', subject: 'زیست‌شناسی ۳', teacher: 'استاد حسینی', room: 'کلاس ۳۰۱' },
  { id: 'sch-2', dayOfWeek: 'saturday', period: 2, startTime: '۰۹:۲۰', endTime: '۱۰:۵۰', subject: 'شیمی ۳', teacher: 'مهندس رضایی', room: 'آزمایشگاه' },
  { id: 'sch-3', dayOfWeek: 'saturday', period: 3, startTime: '۱۱:۱۰', endTime: '۱۲:۳۰', subject: 'فیزیک ۳', teacher: 'دکتر مرادی', room: 'کلاس ۳۰۱' },
  { id: 'sch-4', dayOfWeek: 'saturday', period: 4, startTime: '۱۳:۰۰', endTime: '۱۴:۱۵', subject: 'فارسی ۳', teacher: 'استاد پارسا', room: 'کلاس ۳۰۱' },

  { id: 'sch-5', dayOfWeek: 'sunday', period: 1, startTime: '۰۷:۳۰', endTime: '۰۹:۰۰', subject: 'ریاضی ۳', teacher: 'استاد کریمی', room: 'کلاس ۳۰۱' },
  { id: 'sch-6', dayOfWeek: 'sunday', period: 2, startTime: '۰۹:۲۰', endTime: '۱۰:۵۰', subject: 'دین و زندگی ۳', teacher: 'استاد محمدی', room: 'کلاس ۳۰۱' },
  { id: 'sch-7', dayOfWeek: 'sunday', period: 3, startTime: '۱۱:۱۰', endTime: '۱۲:۳۰', subject: 'زیست‌شناسی ۳ (کارگاه تست)', teacher: 'استاد حسینی', room: 'کلاس ۳۰۱' },
  { id: 'sch-8', dayOfWeek: 'sunday', period: 4, startTime: '۱۳:۰۰', endTime: '۱۴:۱۵', subject: 'زبان انگلیسی ۳', teacher: 'استاد احمدی', room: 'سایت زبان' },

  { id: 'sch-9', dayOfWeek: 'monday', period: 1, startTime: '۰۷:۳۰', endTime: '۰۹:۰۰', subject: 'فیزیک ۳ (حل تمرین)', teacher: 'دکتر مرادی', room: 'کلاس ۳۰۱' },
  { id: 'sch-10', dayOfWeek: 'monday', period: 2, startTime: '۰۹:۲۰', endTime: '۱۰:۵۰', subject: 'شیمی ۳ (مسئله)', teacher: 'مهندس رضایی', room: 'کلاس ۳۰۱' },
  { id: 'sch-11', dayOfWeek: 'monday', period: 3, startTime: '۱۱:۱۰', endTime: '۱۲:۳۰', subject: 'عربی ۳', teacher: 'استاد ناصری', room: 'کلاس ۳۰۱' },
  { id: 'sch-12', dayOfWeek: 'monday', period: 4, startTime: '۱۳:۰۰', endTime: '۱۴:۱۵', subject: 'سلامت و بهداشت', teacher: 'استاد بهرامی', room: 'کلاس ۳۰۱' },

  { id: 'sch-13', dayOfWeek: 'tuesday', period: 1, startTime: '۰۷:۳۰', endTime: '۰۹:۰۰', subject: 'زیست‌شناسی ۳', teacher: 'استاد حسینی', room: 'کلاس ۳۰۱' },
  { id: 'sch-14', dayOfWeek: 'tuesday', period: 2, startTime: '۰۹:۲۰', endTime: '۱۰:۵۰', subject: 'ریاضی ۳', teacher: 'استاد کریمی', room: 'کلاس ۳۰۱' },
  { id: 'sch-15', dayOfWeek: 'tuesday', period: 3, startTime: '۱۱:۱۰', endTime: '۱۲:۳۰', subject: 'علوم اجتماعی', teacher: 'استاد مهدوی', room: 'کلاس ۳۰۱' },
  { id: 'sch-16', dayOfWeek: 'tuesday', period: 4, startTime: '۱۳:۰۰', endTime: '۱۴:۱۵', subject: 'مشاوره و هدایت کنکور', teacher: 'دکتر صبوری', room: 'سالن کنفرانس' },

  { id: 'sch-17', dayOfWeek: 'wednesday', period: 1, startTime: '۰۷:۳۰', endTime: '۰۹:۰۰', subject: 'آزمون آزمایشی هفتگی', teacher: 'معاونت آموزشی', room: 'سالن آزمون' },
  { id: 'sch-18', dayOfWeek: 'wednesday', period: 2, startTime: '۰۹:۲۰', endTime: '۱۰:۵۰', subject: 'تحلیل آزمون هفتگی', teacher: 'دبیران تخصصی', room: 'سالن آزمون' },
  { id: 'sch-19', dayOfWeek: 'wednesday', period: 3, startTime: '۱۱:۱۰', endTime: '۱۲:۳۰', subject: 'شیمی ۳ (رفع اشکال)', teacher: 'مهندس رضایی', room: 'کلاس ۳۰۱' },
  { id: 'sch-20', dayOfWeek: 'wednesday', period: 4, startTime: '۱۳:۰۰', endTime: '۱۴:۱۵', subject: 'مطالعه انفرادی هدایت‌شده', teacher: 'ناظر پایه', room: 'کتابخانه' },
];

export const INITIAL_DAILY_TESTS: DailyTestItem[] = [
  {
    id: 'test-1',
    subject: 'زیست‌شناسی دوازدهم',
    topic: 'فصل ۲: جریان اطلاعات در یاخته (ترجمه و رونویسی)',
    numberOfQuestions: 40,
    date: new Date().toISOString().split('T')[0],
    completed: true,
    correctCount: 34,
    wrongCount: 4,
    unansweredCount: 2,
    percentage: 81,
  },
  {
    id: 'test-2',
    subject: 'شیمی یازدهم',
    topic: 'آنتالپی پیوند، قانون هس و گرمای واکنش‌ها',
    numberOfQuestions: 30,
    date: new Date().toISOString().split('T')[0],
    completed: false,
    correctCount: 0,
    wrongCount: 0,
    unansweredCount: 30,
    percentage: 0,
  },
  {
    id: 'test-3',
    subject: 'فیزیک دوازدهم',
    topic: 'حرکت بر خط راست: سقوط آزاد و شتاب ثابت',
    numberOfQuestions: 25,
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    completed: true,
    correctCount: 20,
    wrongCount: 3,
    unansweredCount: 2,
    percentage: 76,
  },
  {
    id: 'test-4',
    subject: 'ریاضی تجربی',
    topic: 'تابع، دامنه، برد و ترکیب توابع دهم و یازدهم',
    numberOfQuestions: 35,
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    completed: true,
    correctCount: 28,
    wrongCount: 5,
    unansweredCount: 2,
    percentage: 75,
  },
  {
    id: 'test-5',
    subject: 'زمین‌شناسی یازدهم',
    topic: 'فصل ۱: آفرینش کیهان و ساختار زمین',
    numberOfQuestions: 20,
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    completed: false,
  },
];

export const INITIAL_STUDY_HISTORY: StudyHistoryItem[] = [
  {
    id: 'hist-1',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    totalMinutes: 450,
    tasksCompleted: 4,
    questionsSolved: 65,
    averageTestPercentage: 76,
    subjectBreakdown: [
      { subject: 'زیست‌شناسی', minutes: 160, percentage: 35 },
      { subject: 'شیمی', minutes: 120, percentage: 27 },
      { subject: 'فیزیک', minutes: 100, percentage: 22 },
      { subject: 'ریاضیات', minutes: 70, percentage: 16 },
    ],
    notes: 'تمرکز مطلوب روی تست‌های زمان‌دار شتاب ثابت فیزیک و مباحث پایه',
  },
  {
    id: 'hist-2',
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    totalMinutes: 480,
    tasksCompleted: 5,
    questionsSolved: 75,
    averageTestPercentage: 75,
    subjectBreakdown: [
      { subject: 'زیست‌شناسی', minutes: 180, percentage: 38 },
      { subject: 'شیمی', minutes: 110, percentage: 23 },
      { subject: 'فیزیک', minutes: 100, percentage: 21 },
      { subject: 'فارسی عمومی', minutes: 90, percentage: 18 },
    ],
    notes: 'حل آزمونک جامع زیست دهم و مرور واژگان فارسی نهایی',
  },
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'chat-1',
    sender: 'assistant',
    text: 'سلام دوست من! خسته نباشی. من «استادی‌میت» هستم؛ مشاور هوشمند کنکور تو. داده‌های تحصیلی و برنامه روزانه‌ات با پایگاه داده ابری فایربیس همگام‌سازی شده. چطور می‌تونم در برنامه‌ریزی، تحلیل آزمون یا بالابردن ساعت مطالعه کمکت کنم؟',
    timestamp: '۱۰:۳۰',
    actionSuggestion: {
      type: 'plan_study',
      title: 'تحلیل برنامه مطالعه امروز و تنظیم پارت‌های تست‌زنی',
    },
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_PREFERENCES: UserPreferences = {
  studentName: 'دانش‌آموز کنکوری',
  grade: 'دوازدهم',
  major: 'علوم تجربی',
  targetMajor: 'دکتری عمومی پزشکی - دانشگاه علوم پزشکی تهران',
  targetRank: 450,
  dailyGoalMinutes: 480,
  weeklyTestGoal: 350,
  weakSubjects: ['مسائل استوکیومتری و غلظت شیمی', 'کار و انرژی و دینامیک فیزیک'],
  strongSubjects: ['زیست‌شناسی سلولی و مولکولی', 'مفاهیم حد و مشتق ریاضی'],
  studyPace: 'intense',
  notificationsEnabled: true,
};

export const DAILY_QUOTES: DailyQuote[] = [
  {
    id: 'q-1',
    text: 'پیروزی از آنِ کسانی است که هر روز، کمی بیشتر از آنچه دیروز توانسته‌اند تلاش می‌کنند.',
    author: 'ابن سینا',
    source: 'رساله اخلاق و حکمت',
  },
  {
    id: 'q-2',
    text: 'نابرده رنج، گنج میسر نمی‌شود؛ مزد آن گرفت جان برادر که کار کرد.',
    author: 'سعدی شیرازی',
    source: 'گلستان',
  },
  {
    id: 'q-3',
    text: 'موفقیت مجموعه‌ای از تلاش‌های کوچک روزانه است که بارها و بارها تکرار می‌شوند.',
    author: 'رابرت کالیر',
    source: 'راز کامیابی',
  },
  {
    id: 'q-4',
    text: 'در آزمون‌های بزرگ، آرامش ذهن نیمی از علم و دانش است و انضباط نیمی دیگر.',
    author: 'حکمت پارسی',
  },
];

// Helper to get collection reference under the user
async function getUserCollectionRef(collectionName: string) {
  const userId = await getStudentUserId();
  return collection(db, 'users', userId, collectionName);
}

// LocalStorage Fallback Helper for offline resilience
function getLocalFallback<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(`sm_fb_${key}`);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function setLocalFallback<T>(key: string, val: T): void {
  try {
    localStorage.setItem(`sm_fb_${key}`, JSON.stringify(val));
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
}

export const FirestoreDatabase = {
  /**
   * Initializes and seeds database if empty
   */
  async ensureSeededIfEmpty(): Promise<void> {
    try {
      const userId = await getStudentUserId();
      const tasksCol = collection(db, 'users', userId, 'tasks');
      const snap = await getDocs(tasksCol);

      if (snap.empty) {
        console.log('Firestore empty, seeding with sample Konkur data...');
        // Seed Tasks
        for (const t of INITIAL_TASKS) {
          await setDoc(doc(db, 'users', userId, 'tasks', t.id), { ...t, userId });
        }
        // Seed Goals
        for (const g of INITIAL_GOALS) {
          await setDoc(doc(db, 'users', userId, 'goals', g.id), { ...g, userId });
        }
        // Seed Exams
        for (const e of INITIAL_EXAMS) {
          await setDoc(doc(db, 'users', userId, 'exams', e.id), { ...e, userId });
        }
        // Seed Deadlines
        for (const d of INITIAL_DEADLINES) {
          await setDoc(doc(db, 'users', userId, 'deadlines', d.id), { ...d, userId });
        }
        // Seed Schedule
        for (const s of INITIAL_SCHEDULE) {
          await setDoc(doc(db, 'users', userId, 'schedule', s.id), { ...s, userId });
        }
        // Seed Daily Tests
        for (const test of INITIAL_DAILY_TESTS) {
          await setDoc(doc(db, 'users', userId, 'dailyTests', test.id), { ...test, userId });
        }
        // Seed Study History
        for (const h of INITIAL_STUDY_HISTORY) {
          await setDoc(doc(db, 'users', userId, 'studyHistory', h.id), { ...h, userId });
        }
        // Seed Chat Messages
        for (const c of INITIAL_CHAT_MESSAGES) {
          await setDoc(doc(db, 'users', userId, 'chatMessages', c.id), { ...c, userId });
        }
        // Seed Preferences
        await setDoc(doc(db, 'users', userId, 'preferences', 'general'), {
          ...INITIAL_PREFERENCES,
          userId,
        });
      }
    } catch (err) {
      console.warn('Firestore seeding check (will use local fallback if network blocked):', err);
    }
  },

  // ===== TASKS =====
  async getTasks(): Promise<Task[]> {
    try {
      const col = await getUserCollectionRef('tasks');
      const snap = await getDocs(col);
      if (snap.empty) {
        return getLocalFallback('tasks', INITIAL_TASKS);
      }
      const items: Task[] = [];
      snap.forEach((d) => items.push({ ...(d.data() as Task), id: d.id }));
      // Sort tasks: newest first
      items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setLocalFallback('tasks', items);
      return items;
    } catch (err) {
      console.warn('Error reading tasks from Firestore:', err);
      return getLocalFallback('tasks', INITIAL_TASKS);
    }
  },

  async addTask(task: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    const userId = await getStudentUserId();
    const id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newTask: Task = {
      ...task,
      id,
      createdAt: new Date().toISOString(),
      userId,
    };
    try {
      await setDoc(doc(db, 'users', userId, 'tasks', id), newTask);
    } catch (err) {
      console.warn('Fallback saving task locally:', err);
    }
    const current = getLocalFallback<Task[]>('tasks', INITIAL_TASKS);
    const updated = [newTask, ...current];
    setLocalFallback('tasks', updated);
    return newTask;
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    const userId = await getStudentUserId();
    try {
      await updateDoc(doc(db, 'users', userId, 'tasks', id), updates);
    } catch (err) {
      console.warn('Fallback updating task locally:', err);
    }
    const current = getLocalFallback<Task[]>('tasks', INITIAL_TASKS);
    const idx = current.findIndex((t) => t.id === id);
    if (idx !== -1) {
      current[idx] = { ...current[idx], ...updates };
      setLocalFallback('tasks', current);
    }
  },

  async toggleTask(id: string): Promise<boolean> {
    const tasks = await this.getTasks();
    const target = tasks.find((t) => t.id === id);
    if (!target) return false;
    const nextCompleted = !target.completed;
    await this.updateTask(id, {
      completed: nextCompleted,
      status: nextCompleted ? 'completed' : 'todo',
    });
    return nextCompleted;
  },

  async deleteTask(id: string): Promise<void> {
    const userId = await getStudentUserId();
    try {
      await deleteDoc(doc(db, 'users', userId, 'tasks', id));
    } catch (err) {
      console.warn('Fallback deleting task locally:', err);
    }
    const current = getLocalFallback<Task[]>('tasks', INITIAL_TASKS);
    setLocalFallback('tasks', current.filter((t) => t.id !== id));
  },

  // ===== GOALS =====
  async getGoals(): Promise<Goal[]> {
    try {
      const col = await getUserCollectionRef('goals');
      const snap = await getDocs(col);
      if (snap.empty) {
        return getLocalFallback('goals', INITIAL_GOALS);
      }
      const items: Goal[] = [];
      snap.forEach((d) => items.push({ ...(d.data() as Goal), id: d.id }));
      setLocalFallback('goals', items);
      return items;
    } catch (err) {
      console.warn('Error reading goals from Firestore:', err);
      return getLocalFallback('goals', INITIAL_GOALS);
    }
  },

  async addGoal(goal: Omit<Goal, 'id'>): Promise<Goal> {
    const userId = await getStudentUserId();
    const id = `goal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newGoal: Goal = { ...goal, id, userId };
    try {
      await setDoc(doc(db, 'users', userId, 'goals', id), newGoal);
    } catch (err) {
      console.warn('Fallback saving goal locally:', err);
    }
    const current = getLocalFallback<Goal[]>('goals', INITIAL_GOALS);
    const updated = [...current, newGoal];
    setLocalFallback('goals', updated);
    return newGoal;
  },

  async updateGoal(id: string, updates: Partial<Goal>): Promise<void> {
    const userId = await getStudentUserId();
    try {
      await updateDoc(doc(db, 'users', userId, 'goals', id), updates);
    } catch (err) {
      console.warn('Fallback updating goal locally:', err);
    }
    const current = getLocalFallback<Goal[]>('goals', INITIAL_GOALS);
    const idx = current.findIndex((g) => g.id === id);
    if (idx !== -1) {
      current[idx] = { ...current[idx], ...updates };
      setLocalFallback('goals', current);
    }
  },

  async deleteGoal(id: string): Promise<void> {
    const userId = await getStudentUserId();
    try {
      await deleteDoc(doc(db, 'users', userId, 'goals', id));
    } catch (err) {
      console.warn('Fallback deleting goal locally:', err);
    }
    const current = getLocalFallback<Goal[]>('goals', INITIAL_GOALS);
    setLocalFallback('goals', current.filter((g) => g.id !== id));
  },

  // ===== EXAMS =====
  async getExams(): Promise<Exam[]> {
    try {
      const col = await getUserCollectionRef('exams');
      const snap = await getDocs(col);
      if (snap.empty) {
        return getLocalFallback('exams', INITIAL_EXAMS);
      }
      const items: Exam[] = [];
      snap.forEach((d) => items.push({ ...(d.data() as Exam), id: d.id }));
      items.sort((a, b) => a.date.localeCompare(b.date));
      setLocalFallback('exams', items);
      return items;
    } catch (err) {
      console.warn('Error reading exams from Firestore:', err);
      return getLocalFallback('exams', INITIAL_EXAMS);
    }
  },

  async addExam(exam: Omit<Exam, 'id'>): Promise<Exam> {
    const userId = await getStudentUserId();
    const id = `exam-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newExam: Exam = { ...exam, id, userId };
    try {
      await setDoc(doc(db, 'users', userId, 'exams', id), newExam);
    } catch (err) {
      console.warn('Fallback saving exam locally:', err);
    }
    const current = getLocalFallback<Exam[]>('exams', INITIAL_EXAMS);
    const updated = [...current, newExam];
    setLocalFallback('exams', updated);
    return newExam;
  },

  async updateExam(id: string, updates: Partial<Exam>): Promise<void> {
    const userId = await getStudentUserId();
    try {
      await updateDoc(doc(db, 'users', userId, 'exams', id), updates);
    } catch (err) {
      console.warn('Fallback updating exam locally:', err);
    }
    const current = getLocalFallback<Exam[]>('exams', INITIAL_EXAMS);
    const idx = current.findIndex((e) => e.id === id);
    if (idx !== -1) {
      current[idx] = { ...current[idx], ...updates };
      setLocalFallback('exams', current);
    }
  },

  async deleteExam(id: string): Promise<void> {
    const userId = await getStudentUserId();
    try {
      await deleteDoc(doc(db, 'users', userId, 'exams', id));
    } catch (err) {
      console.warn('Fallback deleting exam locally:', err);
    }
    const current = getLocalFallback<Exam[]>('exams', INITIAL_EXAMS);
    setLocalFallback('exams', current.filter((e) => e.id !== id));
  },

  // ===== DEADLINES =====
  async getDeadlines(): Promise<Deadline[]> {
    try {
      const col = await getUserCollectionRef('deadlines');
      const snap = await getDocs(col);
      if (snap.empty) {
        return getLocalFallback('deadlines', INITIAL_DEADLINES);
      }
      const items: Deadline[] = [];
      snap.forEach((d) => items.push({ ...(d.data() as Deadline), id: d.id }));
      items.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      setLocalFallback('deadlines', items);
      return items;
    } catch (err) {
      console.warn('Error reading deadlines from Firestore:', err);
      return getLocalFallback('deadlines', INITIAL_DEADLINES);
    }
  },

  async addDeadline(deadline: Omit<Deadline, 'id'>): Promise<Deadline> {
    const userId = await getStudentUserId();
    const id = `dl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newDeadline: Deadline = { ...deadline, id, userId };
    try {
      await setDoc(doc(db, 'users', userId, 'deadlines', id), newDeadline);
    } catch (err) {
      console.warn('Fallback saving deadline locally:', err);
    }
    const current = getLocalFallback<Deadline[]>('deadlines', INITIAL_DEADLINES);
    const updated = [...current, newDeadline];
    setLocalFallback('deadlines', updated);
    return newDeadline;
  },

  async updateDeadline(id: string, updates: Partial<Deadline>): Promise<void> {
    const userId = await getStudentUserId();
    try {
      await updateDoc(doc(db, 'users', userId, 'deadlines', id), updates);
    } catch (err) {
      console.warn('Fallback updating deadline locally:', err);
    }
    const current = getLocalFallback<Deadline[]>('deadlines', INITIAL_DEADLINES);
    const idx = current.findIndex((d) => d.id === id);
    if (idx !== -1) {
      current[idx] = { ...current[idx], ...updates };
      setLocalFallback('deadlines', current);
    }
  },

  async deleteDeadline(id: string): Promise<void> {
    const userId = await getStudentUserId();
    try {
      await deleteDoc(doc(db, 'users', userId, 'deadlines', id));
    } catch (err) {
      console.warn('Fallback deleting deadline locally:', err);
    }
    const current = getLocalFallback<Deadline[]>('deadlines', INITIAL_DEADLINES);
    setLocalFallback('deadlines', current.filter((d) => d.id !== id));
  },

  // ===== SCHOOL SCHEDULE =====
  async getSchedule(): Promise<SchoolClass[]> {
    try {
      const col = await getUserCollectionRef('schedule');
      const snap = await getDocs(col);
      if (snap.empty) {
        return getLocalFallback('schedule', INITIAL_SCHEDULE);
      }
      const items: SchoolClass[] = [];
      snap.forEach((d) => items.push({ ...(d.data() as SchoolClass), id: d.id }));
      setLocalFallback('schedule', items);
      return items;
    } catch (err) {
      console.warn('Error reading schedule from Firestore:', err);
      return getLocalFallback('schedule', INITIAL_SCHEDULE);
    }
  },

  async addClass(item: Omit<SchoolClass, 'id'>): Promise<SchoolClass> {
    const userId = await getStudentUserId();
    const id = `sch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newClass: SchoolClass = { ...item, id, userId };
    try {
      await setDoc(doc(db, 'users', userId, 'schedule', id), newClass);
    } catch (err) {
      console.warn('Fallback saving schedule class locally:', err);
    }
    const current = getLocalFallback<SchoolClass[]>('schedule', INITIAL_SCHEDULE);
    const updated = [...current, newClass];
    setLocalFallback('schedule', updated);
    return newClass;
  },

  async updateClass(id: string, updates: Partial<SchoolClass>): Promise<void> {
    const userId = await getStudentUserId();
    try {
      await updateDoc(doc(db, 'users', userId, 'schedule', id), updates);
    } catch (err) {
      console.warn('Fallback updating class locally:', err);
    }
    const current = getLocalFallback<SchoolClass[]>('schedule', INITIAL_SCHEDULE);
    const idx = current.findIndex((c) => c.id === id);
    if (idx !== -1) {
      current[idx] = { ...current[idx], ...updates };
      setLocalFallback('schedule', current);
    }
  },

  async deleteClass(id: string): Promise<void> {
    const userId = await getStudentUserId();
    try {
      await deleteDoc(doc(db, 'users', userId, 'schedule', id));
    } catch (err) {
      console.warn('Fallback deleting class locally:', err);
    }
    const current = getLocalFallback<SchoolClass[]>('schedule', INITIAL_SCHEDULE);
    setLocalFallback('schedule', current.filter((c) => c.id !== id));
  },

  // ===== DAILY TESTS =====
  async getDailyTests(): Promise<DailyTestItem[]> {
    try {
      const col = await getUserCollectionRef('dailyTests');
      const snap = await getDocs(col);
      if (snap.empty) {
        return getLocalFallback('dailyTests', INITIAL_DAILY_TESTS);
      }
      const items: DailyTestItem[] = [];
      snap.forEach((d) => items.push({ ...(d.data() as DailyTestItem), id: d.id }));
      items.sort((a, b) => b.date.localeCompare(a.date));
      setLocalFallback('dailyTests', items);
      return items;
    } catch (err) {
      console.warn('Error reading daily tests from Firestore:', err);
      return getLocalFallback('dailyTests', INITIAL_DAILY_TESTS);
    }
  },

  async addDailyTest(test: Omit<DailyTestItem, 'id'>): Promise<DailyTestItem> {
    const userId = await getStudentUserId();
    const id = `test-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newTest: DailyTestItem = { ...test, id, userId };
    try {
      await setDoc(doc(db, 'users', userId, 'dailyTests', id), newTest);
    } catch (err) {
      console.warn('Fallback saving daily test locally:', err);
    }
    const current = getLocalFallback<DailyTestItem[]>('dailyTests', INITIAL_DAILY_TESTS);
    const updated = [newTest, ...current];
    setLocalFallback('dailyTests', updated);
    return newTest;
  },

  async updateDailyTest(id: string, updates: Partial<DailyTestItem>): Promise<void> {
    const userId = await getStudentUserId();
    try {
      await updateDoc(doc(db, 'users', userId, 'dailyTests', id), updates);
    } catch (err) {
      console.warn('Fallback updating daily test locally:', err);
    }
    const current = getLocalFallback<DailyTestItem[]>('dailyTests', INITIAL_DAILY_TESTS);
    const idx = current.findIndex((t) => t.id === id);
    if (idx !== -1) {
      current[idx] = { ...current[idx], ...updates };
      setLocalFallback('dailyTests', current);
    }
  },

  async deleteDailyTest(id: string): Promise<void> {
    const userId = await getStudentUserId();
    try {
      await deleteDoc(doc(db, 'users', userId, 'dailyTests', id));
    } catch (err) {
      console.warn('Fallback deleting daily test locally:', err);
    }
    const current = getLocalFallback<DailyTestItem[]>('dailyTests', INITIAL_DAILY_TESTS);
    setLocalFallback('dailyTests', current.filter((t) => t.id !== id));
  },

  // ===== STUDY HISTORY =====
  async getStudyHistory(): Promise<StudyHistoryItem[]> {
    try {
      const col = await getUserCollectionRef('studyHistory');
      const snap = await getDocs(col);
      if (snap.empty) {
        return getLocalFallback('studyHistory', INITIAL_STUDY_HISTORY);
      }
      const items: StudyHistoryItem[] = [];
      snap.forEach((d) => items.push({ ...(d.data() as StudyHistoryItem), id: d.id }));
      items.sort((a, b) => b.date.localeCompare(a.date));
      setLocalFallback('studyHistory', items);
      return items;
    } catch (err) {
      console.warn('Error reading study history from Firestore:', err);
      return getLocalFallback('studyHistory', INITIAL_STUDY_HISTORY);
    }
  },

  async recordStudySession(historyItem: Omit<StudyHistoryItem, 'id'>): Promise<StudyHistoryItem> {
    const userId = await getStudentUserId();
    const id = `hist-${Date.now()}`;
    const newEntry: StudyHistoryItem = { ...historyItem, id, userId };
    try {
      await setDoc(doc(db, 'users', userId, 'studyHistory', id), newEntry);
    } catch (err) {
      console.warn('Fallback saving study history locally:', err);
    }
    const current = getLocalFallback<StudyHistoryItem[]>('studyHistory', INITIAL_STUDY_HISTORY);
    const updated = [newEntry, ...current];
    setLocalFallback('studyHistory', updated);
    return newEntry;
  },

  // ===== CHAT HISTORY =====
  async getChatMessages(): Promise<ChatMessage[]> {
    try {
      const col = await getUserCollectionRef('chatMessages');
      const snap = await getDocs(col);
      if (snap.empty) {
        return getLocalFallback('chatMessages', INITIAL_CHAT_MESSAGES);
      }
      const items: ChatMessage[] = [];
      snap.forEach((d) => items.push({ ...(d.data() as ChatMessage), id: d.id }));
      items.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
      setLocalFallback('chatMessages', items);
      return items;
    } catch (err) {
      console.warn('Error reading chat messages from Firestore:', err);
      return getLocalFallback('chatMessages', INITIAL_CHAT_MESSAGES);
    }
  },

  async addChatMessage(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage> {
    const userId = await getStudentUserId();
    const id = `chat-${Date.now()}`;
    const newMsg: ChatMessage = {
      ...message,
      id,
      createdAt: new Date().toISOString(),
      userId,
    };
    try {
      await setDoc(doc(db, 'users', userId, 'chatMessages', id), newMsg);
    } catch (err) {
      console.warn('Fallback saving chat message locally:', err);
    }
    const current = getLocalFallback<ChatMessage[]>('chatMessages', INITIAL_CHAT_MESSAGES);
    const updated = [...current, newMsg];
    setLocalFallback('chatMessages', updated);
    return newMsg;
  },

  async clearChat(): Promise<void> {
    const userId = await getStudentUserId();
    try {
      const col = await getUserCollectionRef('chatMessages');
      const snap = await getDocs(col);
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }
      // Re-seed initial greeting message
      const greeting = INITIAL_CHAT_MESSAGES[0];
      await setDoc(doc(db, 'users', userId, 'chatMessages', greeting.id), {
        ...greeting,
        userId,
      });
    } catch (err) {
      console.warn('Fallback clearing chat locally:', err);
    }
    setLocalFallback('chatMessages', INITIAL_CHAT_MESSAGES);
  },

  // ===== USER PREFERENCES =====
  async getPreferences(): Promise<UserPreferences> {
    try {
      const userId = await getStudentUserId();
      const prefDoc = await getDoc(doc(db, 'users', userId, 'preferences', 'general'));
      if (prefDoc.exists()) {
        const data = prefDoc.data() as UserPreferences;
        setLocalFallback('preferences', data);
        return data;
      }
      return getLocalFallback('preferences', INITIAL_PREFERENCES);
    } catch (err) {
      console.warn('Error reading preferences from Firestore:', err);
      return getLocalFallback('preferences', INITIAL_PREFERENCES);
    }
  },

  async updatePreferences(updates: Partial<UserPreferences>): Promise<UserPreferences> {
    const userId = await getStudentUserId();
    const current = await this.getPreferences();
    const updated: UserPreferences = { ...current, ...updates, userId };
    try {
      await setDoc(doc(db, 'users', userId, 'preferences', 'general'), updated, { merge: true });
    } catch (err) {
      console.warn('Fallback saving preferences locally:', err);
    }
    setLocalFallback('preferences', updated);
    return updated;
  },

  // ===== DAILY QUOTE =====
  getTodayQuote(): DailyQuote {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    const index = dayOfYear % DAILY_QUOTES.length;
    return DAILY_QUOTES[index];
  },

  // ===== DATABASE RESET =====
  async resetAllToDefaults(): Promise<void> {
    try {
      const userId = await getStudentUserId();
      // Collections to clear
      const collections = [
        'tasks',
        'goals',
        'exams',
        'deadlines',
        'schedule',
        'dailyTests',
        'studyHistory',
        'chatMessages',
      ];
      for (const colName of collections) {
        const snap = await getDocs(collection(db, 'users', userId, colName));
        for (const d of snap.docs) {
          await deleteDoc(d.ref);
        }
      }
      // Re-seed
      await this.ensureSeededIfEmpty();
    } catch (err) {
      console.warn('Resetting locally:', err);
    }
    // Clear localStorage fallbacks
    localStorage.removeItem('sm_fb_tasks');
    localStorage.removeItem('sm_fb_goals');
    localStorage.removeItem('sm_fb_exams');
    localStorage.removeItem('sm_fb_deadlines');
    localStorage.removeItem('sm_fb_schedule');
    localStorage.removeItem('sm_fb_dailyTests');
    localStorage.removeItem('sm_fb_studyHistory');
    localStorage.removeItem('sm_fb_chatMessages');
    localStorage.removeItem('sm_fb_preferences');
  },
};
