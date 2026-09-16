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

// Initial arrays empty by default so user starts completely fresh with 0 items
const INITIAL_TASKS: Task[] = [];
const INITIAL_GOALS: Goal[] = [];
const INITIAL_EXAMS: Exam[] = [];
const INITIAL_SCHEDULE: SchoolClass[] = [];
const INITIAL_DAILY_TESTS: DailyTestItem[] = [];

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

const INITIAL_CHAT_MESSAGES: ChatMessage[] = [];

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
