/**
 * StudyMate Storage Service
 * Manages local persistence and provides realistic Konkur sample data.
 */

import {
  Task,
  Goal,
  Exam,
  SchoolClass,
  DailyTestItem,
  DailyQuote,
  ChatMessage,
} from '../types/studymate';

const STORAGE_KEYS = {
  TASKS: 'studymate_tasks_v1',
  GOALS: 'studymate_goals_v1',
  EXAMS: 'studymate_exams_v1',
  SCHEDULE: 'studymate_schedule_v1',
  DAILY_TESTS: 'studymate_daily_tests_v1',
  CHAT: 'studymate_chat_v1',
};

// Initial realistic Iranian Konkur sample data
const INITIAL_TASKS: Task[] = [
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

const INITIAL_GOALS: Goal[] = [
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

const INITIAL_EXAMS: Exam[] = [
  {
    id: 'exam-1',
    title: 'آزمون مرحله ۵ کانون فرهنگی آموزش (قلم‌چی)',
    date: new Date(Date.now() + 86400000 * 6).toISOString().split('T')[0], // in 6 days
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

const INITIAL_SCHEDULE: SchoolClass[] = [
  // شنبه (Saturday)
  { id: 'sch-1', dayOfWeek: 'saturday', period: 1, startTime: '۰۷:۳۰', endTime: '۰۹:۰۰', subject: 'زیست‌شناسی ۳', teacher: 'استاد حسینی', room: 'کلاس ۳۰۱' },
  { id: 'sch-2', dayOfWeek: 'saturday', period: 2, startTime: '۰۹:۲۰', endTime: '۱۰:۵۰', subject: 'شیمی ۳', teacher: 'مهندس رضایی', room: 'آزمایشگاه' },
  { id: 'sch-3', dayOfWeek: 'saturday', period: 3, startTime: '۱۱:۱۰', endTime: '۱۲:۳۰', subject: 'فیزیک ۳', teacher: 'دکتر مرادی', room: 'کلاس ۳۰۱' },
  { id: 'sch-4', dayOfWeek: 'saturday', period: 4, startTime: '۱۳:۰۰', endTime: '۱۴:۱۵', subject: 'فارسی ۳', teacher: 'استاد پارسا', room: 'کلاس ۳۰۱' },

  // یکشنبه (Sunday)
  { id: 'sch-5', dayOfWeek: 'sunday', period: 1, startTime: '۰۷:۳۰', endTime: '۰۹:۰۰', subject: 'ریاضی ۳', teacher: 'استاد کریمی', room: 'کلاس ۳۰۱' },
  { id: 'sch-6', dayOfWeek: 'sunday', period: 2, startTime: '۰۹:۲۰', endTime: '۱۰:۵۰', subject: 'دین و زندگی ۳', teacher: 'استاد محمدی', room: 'کلاس ۳۰۱' },
  { id: 'sch-7', dayOfWeek: 'sunday', period: 3, startTime: '۱۱:۱۰', endTime: '۱۲:۳۰', subject: 'زیست‌شناسی ۳ (کارگاه تست)', teacher: 'استاد حسینی', room: 'کلاس ۳۰۱' },
  { id: 'sch-8', dayOfWeek: 'sunday', period: 4, startTime: '۱۳:۰۰', endTime: '۱۴:۱۵', subject: 'زبان انگلیسی ۳', teacher: 'استاد احمدی', room: 'سایت زبان' },

  // دوشنبه (Monday)
  { id: 'sch-9', dayOfWeek: 'monday', period: 1, startTime: '۰۷:۳۰', endTime: '۰۹:۰۰', subject: 'فیزیک ۳ (حل تمرین)', teacher: 'دکتر مرادی', room: 'کلاس ۳۰۱' },
  { id: 'sch-10', dayOfWeek: 'monday', period: 2, startTime: '۰۹:۲۰', endTime: '۱۰:۵۰', subject: 'شیمی ۳ (مسئله)', teacher: 'مهندس رضایی', room: 'کلاس ۳۰۱' },
  { id: 'sch-11', dayOfWeek: 'monday', period: 3, startTime: '۱۱:۱۰', endTime: '۱۲:۳۰', subject: 'عربی ۳', teacher: 'استاد ناصری', room: 'کلاس ۳۰۱' },
  { id: 'sch-12', dayOfWeek: 'monday', period: 4, startTime: '۱۳:۰۰', endTime: '۱۴:۱۵', subject: 'سلامت و بهداشت', teacher: 'استاد بهرامی', room: 'کلاس ۳۰۱' },

  // سه‌شنبه (Tuesday)
  { id: 'sch-13', dayOfWeek: 'tuesday', period: 1, startTime: '۰۷:۳۰', endTime: '۰۹:۰۰', subject: 'زیست‌شناسی ۳', teacher: 'استاد حسینی', room: 'کلاس ۳۰۱' },
  { id: 'sch-14', dayOfWeek: 'tuesday', period: 2, startTime: '۰۹:۲۰', endTime: '۱۰:۵۰', subject: 'ریاضی ۳', teacher: 'استاد کریمی', room: 'کلاس ۳۰۱' },
  { id: 'sch-15', dayOfWeek: 'tuesday', period: 3, startTime: '۱۱:۱۰', endTime: '۱۲:۳۰', subject: 'علوم اجتماعی', teacher: 'استاد مهدوی', room: 'کلاس ۳۰۱' },
  { id: 'sch-16', dayOfWeek: 'tuesday', period: 4, startTime: '۱۳:۰۰', endTime: '۱۴:۱۵', subject: 'مشاوره و هدایت کنکور', teacher: 'دکتر صبوری', room: 'سالن کنفرانس' },

  // چهارشنبه (Wednesday)
  { id: 'sch-17', dayOfWeek: 'wednesday', period: 1, startTime: '۰۷:۳۰', endTime: '۰۹:۰۰', subject: 'آزمون آزمایشی هفتگی', teacher: 'معاونت آموزشی', room: 'سالن آزمون' },
  { id: 'sch-18', dayOfWeek: 'wednesday', period: 2, startTime: '۰۹:۲۰', endTime: '۱۰:۵۰', subject: 'تحلیل آزمون هفتگی', teacher: 'دبیران تخصصی', room: 'سالن آزمون' },
  { id: 'sch-19', dayOfWeek: 'wednesday', period: 3, startTime: '۱۱:۱۰', endTime: '۱۲:۳۰', subject: 'شیمی ۳ (رفع اشکال)', teacher: 'مهندس رضایی', room: 'کلاس ۳۰۱' },
  { id: 'sch-20', dayOfWeek: 'wednesday', period: 4, startTime: '۱۳:۰۰', endTime: '۱۴:۱۵', subject: 'مطالعه انفرادی هدایت‌شده', teacher: 'ناظر پایه', room: 'کتابخانه' },
];

const INITIAL_DAILY_TESTS: DailyTestItem[] = [
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

const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'chat-1',
    sender: 'assistant',
    text: 'سلام دوست من! خسته نباشی. من «استادی‌میت» هستم؛ مشاور هوشمند کنکور تو. وضعیت امروز، برنامه‌های پیش‌رو، آزمون قلم‌چی پایان هفته و اهدافت رو بررسی کردم. چطور می‌تونم بهت در برنامه‌ریزی یا رفع اشکال کمک کنم؟',
    timestamp: '۱۰:۳۰',
    actionSuggestion: {
      type: 'plan_study',
      title: 'تحلیل برنامه مطالعه امروز و تنظیم پارت‌های تست‌زنی',
    },
  },
];

// Helper functions for localStorage
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item);
  } catch (e) {
    console.warn(`Error loading key "${key}" from localStorage:`, e);
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Error saving key "${key}" to localStorage:`, e);
  }
}

export const StorageService = {
  // Tasks
  getTasks(): Task[] {
    return loadFromStorage<Task[]>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
  },
  saveTasks(tasks: Task[]): void {
    saveToStorage(STORAGE_KEYS.TASKS, tasks);
  },
  addTask(task: Omit<Task, 'id' | 'createdAt'>): Task {
    const tasks = this.getTasks();
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };
    tasks.unshift(newTask);
    this.saveTasks(tasks);
    return newTask;
  },
  updateTask(id: string, updates: Partial<Task>): Task | null {
    const tasks = this.getTasks();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;
    tasks[index] = { ...tasks[index], ...updates };
    this.saveTasks(tasks);
    return tasks[index];
  },
  toggleTaskCompletion(id: string): Task | null {
    const tasks = this.getTasks();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;
    const isCompleted = !tasks[index].completed;
    tasks[index] = {
      ...tasks[index],
      completed: isCompleted,
      status: isCompleted ? 'completed' : 'todo',
    };
    this.saveTasks(tasks);
    return tasks[index];
  },
  deleteTask(id: string): void {
    const tasks = this.getTasks().filter((t) => t.id !== id);
    this.saveTasks(tasks);
  },

  // Goals
  getGoals(): Goal[] {
    return loadFromStorage<Goal[]>(STORAGE_KEYS.GOALS, INITIAL_GOALS);
  },
  saveGoals(goals: Goal[]): void {
    saveToStorage(STORAGE_KEYS.GOALS, goals);
  },
  addGoal(goal: Omit<Goal, 'id'>): Goal {
    const goals = this.getGoals();
    const newGoal: Goal = {
      ...goal,
      id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    goals.push(newGoal);
    this.saveGoals(goals);
    return newGoal;
  },
  updateGoal(id: string, updates: Partial<Goal>): Goal | null {
    const goals = this.getGoals();
    const index = goals.findIndex((g) => g.id === id);
    if (index === -1) return null;
    goals[index] = { ...goals[index], ...updates };
    this.saveGoals(goals);
    return goals[index];
  },
  deleteGoal(id: string): void {
    const goals = this.getGoals().filter((g) => g.id !== id);
    this.saveGoals(goals);
  },

  // Exams & Deadlines
  getExams(): Exam[] {
    return loadFromStorage<Exam[]>(STORAGE_KEYS.EXAMS, INITIAL_EXAMS);
  },
  saveExams(exams: Exam[]): void {
    saveToStorage(STORAGE_KEYS.EXAMS, exams);
  },
  addExam(exam: Omit<Exam, 'id'>): Exam {
    const exams = this.getExams();
    const newExam: Exam = {
      ...exam,
      id: `exam-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    exams.push(newExam);
    this.saveExams(exams);
    return newExam;
  },
  updateExam(id: string, updates: Partial<Exam>): Exam | null {
    const exams = this.getExams();
    const index = exams.findIndex((e) => e.id === id);
    if (index === -1) return null;
    exams[index] = { ...exams[index], ...updates };
    this.saveExams(exams);
    return exams[index];
  },
  deleteExam(id: string): void {
    const exams = this.getExams().filter((e) => e.id !== id);
    this.saveExams(exams);
  },

  // School Schedule
  getSchedule(): SchoolClass[] {
    return loadFromStorage<SchoolClass[]>(STORAGE_KEYS.SCHEDULE, INITIAL_SCHEDULE);
  },
  saveSchedule(schedule: SchoolClass[]): void {
    saveToStorage(STORAGE_KEYS.SCHEDULE, schedule);
  },
  addClass(item: Omit<SchoolClass, 'id'>): SchoolClass {
    const schedule = this.getSchedule();
    const newClass: SchoolClass = {
      ...item,
      id: `sch-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    schedule.push(newClass);
    this.saveSchedule(schedule);
    return newClass;
  },
  updateClass(id: string, updates: Partial<SchoolClass>): SchoolClass | null {
    const schedule = this.getSchedule();
    const index = schedule.findIndex((c) => c.id === id);
    if (index === -1) return null;
    schedule[index] = { ...schedule[index], ...updates };
    this.saveSchedule(schedule);
    return schedule[index];
  },
  deleteClass(id: string): void {
    const schedule = this.getSchedule().filter((c) => c.id !== id);
    this.saveSchedule(schedule);
  },

  // Daily Tests
  getDailyTests(): DailyTestItem[] {
    return loadFromStorage<DailyTestItem[]>(STORAGE_KEYS.DAILY_TESTS, INITIAL_DAILY_TESTS);
  },
  saveDailyTests(tests: DailyTestItem[]): void {
    saveToStorage(STORAGE_KEYS.DAILY_TESTS, tests);
  },
  addDailyTest(test: Omit<DailyTestItem, 'id'>): DailyTestItem {
    const tests = this.getDailyTests();
    const newTest: DailyTestItem = {
      ...test,
      id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    tests.unshift(newTest);
    this.saveDailyTests(tests);
    return newTest;
  },
  updateDailyTest(id: string, updates: Partial<DailyTestItem>): DailyTestItem | null {
    const tests = this.getDailyTests();
    const index = tests.findIndex((t) => t.id === id);
    if (index === -1) return null;
    tests[index] = { ...tests[index], ...updates };
    this.saveDailyTests(tests);
    return tests[index];
  },
  deleteDailyTest(id: string): void {
    const tests = this.getDailyTests().filter((t) => t.id !== id);
    this.saveDailyTests(tests);
  },

  // Chat Messages
  getChatMessages(): ChatMessage[] {
    return loadFromStorage<ChatMessage[]>(STORAGE_KEYS.CHAT, INITIAL_CHAT_MESSAGES);
  },
  addChatMessage(message: Omit<ChatMessage, 'id'>): ChatMessage {
    const messages = this.getChatMessages();
    const newMsg: ChatMessage = {
      ...message,
      id: `chat-${Date.now()}`,
    };
    messages.push(newMsg);
    saveToStorage(STORAGE_KEYS.CHAT, messages);
    return newMsg;
  },
  clearChat(): void {
    saveToStorage(STORAGE_KEYS.CHAT, INITIAL_CHAT_MESSAGES);
  },

  // Daily Quote (selects one based on current day)
  getTodayQuote(): DailyQuote {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const index = dayOfYear % DAILY_QUOTES.length;
    return DAILY_QUOTES[index];
  },

  // Reset all to sample data
  resetAllToDefaults(): void {
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.GOALS);
    localStorage.removeItem(STORAGE_KEYS.EXAMS);
    localStorage.removeItem(STORAGE_KEYS.SCHEDULE);
    localStorage.removeItem(STORAGE_KEYS.DAILY_TESTS);
    localStorage.removeItem(STORAGE_KEYS.CHAT);
  },
};
