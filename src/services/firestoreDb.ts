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

// Default empty initial arrays for new users
export const INITIAL_TASKS: Task[] = [];
export const INITIAL_GOALS: Goal[] = [];
export const INITIAL_EXAMS: Exam[] = [];
export const INITIAL_DEADLINES: Deadline[] = [];
export const INITIAL_SCHEDULE: SchoolClass[] = [];
export const INITIAL_DAILY_TESTS: DailyTestItem[] = [];
export const INITIAL_STUDY_HISTORY: StudyHistoryItem[] = [];
export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [];

export const INITIAL_PREFERENCES: UserPreferences = {
  studentName: '',
  grade: '',
  major: '',
  targetMajor: '',
  targetRank: undefined,
  dailyGoalMinutes: 0,
  weeklyTestGoal: 0,
  weakSubjects: [],
  strongSubjects: [],
  studyPace: 'balanced',
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

// Resilient timeout helper for Firestore reads
async function fetchDocsWithTimeout(queryRef: any, timeoutMs = 2500) {
  let timer: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Firestore timeout')), timeoutMs);
  });
  try {
    const snap = await Promise.race([getDocs(queryRef), timeoutPromise]);
    clearTimeout(timer!);
    return snap;
  } catch (err) {
    clearTimeout(timer!);
    throw err;
  }
}

async function fetchDocWithTimeout(docRef: any, timeoutMs = 2500) {
  let timer: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Firestore timeout')), timeoutMs);
  });
  try {
    const snap = await Promise.race([getDoc(docRef), timeoutPromise]);
    clearTimeout(timer!);
    return snap;
  } catch (err) {
    clearTimeout(timer!);
    throw err;
  }
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
  // ===== TASKS =====
  async getTasks(): Promise<Task[]> {
    try {
      const col = await getUserCollectionRef('tasks');
      const snap = await fetchDocsWithTimeout(col);
      if (snap.empty) {
        return getLocalFallback('tasks', []);
      }
      const items: Task[] = [];
      snap.forEach((d) => items.push({ ...(d.data() as Task), id: d.id }));
      // Sort tasks: newest first
      items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setLocalFallback('tasks', items);
      return items;
    } catch (err) {
      console.warn('Using local tasks cache:', err);
      return getLocalFallback('tasks', []);
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
      setDoc(doc(db, 'users', userId, 'tasks', id), newTask).catch((err) => {
        console.warn('Background sync task:', err);
      });
    } catch (err) {
      console.warn('Fallback saving task locally:', err);
    }
    const current = getLocalFallback<Task[]>('tasks', []);
    const updated = [newTask, ...current];
    setLocalFallback('tasks', updated);
    return newTask;
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    const userId = await getStudentUserId();
    try {
      updateDoc(doc(db, 'users', userId, 'tasks', id), updates).catch((err) => {
        console.warn('Background sync update task:', err);
      });
    } catch (err) {
      console.warn('Fallback updating task locally:', err);
    }
    const current = getLocalFallback<Task[]>('tasks', []);
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
      deleteDoc(doc(db, 'users', userId, 'tasks', id)).catch((err) => {
        console.warn('Background sync delete task:', err);
      });
    } catch (err) {
      console.warn('Fallback deleting task locally:', err);
    }
    const current = getLocalFallback<Task[]>('tasks', []);
    setLocalFallback('tasks', current.filter((t) => t.id !== id));
  },

  // ===== GOALS =====
  async getGoals(): Promise<Goal[]> {
    try {
      const col = await getUserCollectionRef('goals');
      const snap = await fetchDocsWithTimeout(col);
      if (snap.empty) {
        return getLocalFallback('goals', []);
      }
      const items: Goal[] = [];
      snap.forEach((d) => items.push({ ...(d.data() as Goal), id: d.id }));
      setLocalFallback('goals', items);
      return items;
    } catch (err) {
      console.warn('Using local goals cache:', err);
      return getLocalFallback('goals', []);
    }
  },

  async addGoal(goal: Omit<Goal, 'id'>): Promise<Goal> {
    const userId = await getStudentUserId();
    const id = `goal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newGoal: Goal = { ...goal, id, userId };
    try {
      setDoc(doc(db, 'users', userId, 'goals', id), newGoal).catch((err) => {
        console.warn('Background sync goal:', err);
      });
    } catch (err) {
      console.warn('Fallback saving goal locally:', err);
    }
    const current = getLocalFallback<Goal[]>('goals', []);
    const updated = [...current, newGoal];
    setLocalFallback('goals', updated);
    return newGoal;
  },

  async updateGoal(id: string, updates: Partial<Goal>): Promise<void> {
    const userId = await getStudentUserId();
    try {
      updateDoc(doc(db, 'users', userId, 'goals', id), updates).catch((err) => {
        console.warn('Background sync update goal:', err);
      });
    } catch (err) {
      console.warn('Fallback updating goal locally:', err);
    }
    const current = getLocalFallback<Goal[]>('goals', []);
    const idx = current.findIndex((g) => g.id === id);
    if (idx !== -1) {
      current[idx] = { ...current[idx], ...updates };
      setLocalFallback('goals', current);
    }
  },

  async deleteGoal(id: string): Promise<void> {
    const userId = await getStudentUserId();
    try {
      deleteDoc(doc(db, 'users', userId, 'goals', id)).catch((err) => {
        console.warn('Background sync delete goal:', err);
      });
    } catch (err) {
      console.warn('Fallback deleting goal locally:', err);
    }
    const current = getLocalFallback<Goal[]>('goals', []);
    setLocalFallback('goals', current.filter((g) => g.id !== id));
  },

  // ===== EXAMS =====
  async getExams(): Promise<Exam[]> {
    try {
      const col = await getUserCollectionRef('exams');
      const snap = await fetchDocsWithTimeout(col);
      if (snap.empty) {
        return getLocalFallback('exams', []);
      }
      const items: Exam[] = [];
      snap.forEach((d) => items.push({ ...(d.data() as Exam), id: d.id }));
      items.sort((a, b) => a.date.localeCompare(b.date));
      setLocalFallback('exams', items);
      return items;
    } catch (err) {
      console.warn('Using local exams cache:', err);
      return getLocalFallback('exams', []);
    }
  },

  async addExam(exam: Omit<Exam, 'id'>): Promise<Exam> {
    const userId = await getStudentUserId();
    const id = `exam-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newExam: Exam = { ...exam, id, userId };
    try {
      setDoc(doc(db, 'users', userId, 'exams', id), newExam).catch((err) => {
        console.warn('Background sync exam:', err);
      });
    } catch (err) {
      console.warn('Fallback saving exam locally:', err);
    }
    const current = getLocalFallback<Exam[]>('exams', []);
    const updated = [...current, newExam];
    setLocalFallback('exams', updated);
    return newExam;
  },

  async updateExam(id: string, updates: Partial<Exam>): Promise<void> {
    const userId = await getStudentUserId();
    try {
      updateDoc(doc(db, 'users', userId, 'exams', id), updates).catch((err) => {
        console.warn('Background sync update exam:', err);
      });
    } catch (err) {
      console.warn('Fallback updating exam locally:', err);
    }
    const current = getLocalFallback<Exam[]>('exams', []);
    const idx = current.findIndex((e) => e.id === id);
    if (idx !== -1) {
      current[idx] = { ...current[idx], ...updates };
      setLocalFallback('exams', current);
    }
  },

  async deleteExam(id: string): Promise<void> {
    const userId = await getStudentUserId();
    try {
      deleteDoc(doc(db, 'users', userId, 'exams', id)).catch((err) => {
        console.warn('Background sync delete exam:', err);
      });
    } catch (err) {
      console.warn('Fallback deleting exam locally:', err);
    }
    const current = getLocalFallback<Exam[]>('exams', []);
    setLocalFallback('exams', current.filter((e) => e.id !== id));
  },

  // ===== DEADLINES =====
  async getDeadlines(): Promise<Deadline[]> {
    try {
      const col = await getUserCollectionRef('deadlines');
      const snap = await fetchDocsWithTimeout(col);
      if (snap.empty) {
        return getLocalFallback('deadlines', []);
      }
      const items: Deadline[] = [];
      snap.forEach((d) => items.push({ ...(d.data() as Deadline), id: d.id }));
      items.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      setLocalFallback('deadlines', items);
      return items;
    } catch (err) {
      console.warn('Using local deadlines cache:', err);
      return getLocalFallback('deadlines', []);
    }
  },

  async addDeadline(deadline: Omit<Deadline, 'id'>): Promise<Deadline> {
    const userId = await getStudentUserId();
    const id = `dl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newDeadline: Deadline = { ...deadline, id, userId };
    try {
      setDoc(doc(db, 'users', userId, 'deadlines', id), newDeadline).catch((err) => {
        console.warn('Background sync deadline:', err);
      });
    } catch (err) {
      console.warn('Fallback saving deadline locally:', err);
    }
    const current = getLocalFallback<Deadline[]>('deadlines', []);
    const updated = [...current, newDeadline];
    setLocalFallback('deadlines', updated);
    return newDeadline;
  },

  async updateDeadline(id: string, updates: Partial<Deadline>): Promise<void> {
    const userId = await getStudentUserId();
    try {
      updateDoc(doc(db, 'users', userId, 'deadlines', id), updates).catch((err) => {
        console.warn('Background sync update deadline:', err);
      });
    } catch (err) {
      console.warn('Fallback updating deadline locally:', err);
    }
    const current = getLocalFallback<Deadline[]>('deadlines', []);
    const idx = current.findIndex((d) => d.id === id);
    if (idx !== -1) {
      current[idx] = { ...current[idx], ...updates };
      setLocalFallback('deadlines', current);
    }
  },

  async deleteDeadline(id: string): Promise<void> {
    const userId = await getStudentUserId();
    try {
      deleteDoc(doc(db, 'users', userId, 'deadlines', id)).catch((err) => {
        console.warn('Background sync delete deadline:', err);
      });
    } catch (err) {
      console.warn('Fallback deleting deadline locally:', err);
    }
    const current = getLocalFallback<Deadline[]>('deadlines', []);
    setLocalFallback('deadlines', current.filter((d) => d.id !== id));
  },

  // ===== SCHOOL SCHEDULE =====
  async getSchedule(): Promise<SchoolClass[]> {
    try {
      const col = await getUserCollectionRef('schedule');
      const snap = await fetchDocsWithTimeout(col);
      if (snap.empty) {
        return getLocalFallback('schedule', []);
      }
      const items: SchoolClass[] = [];
      snap.forEach((d) => items.push({ ...(d.data() as SchoolClass), id: d.id }));
      setLocalFallback('schedule', items);
      return items;
    } catch (err) {
      console.warn('Using local schedule cache:', err);
      return getLocalFallback('schedule', []);
    }
  },

  async addClass(item: Omit<SchoolClass, 'id'>): Promise<SchoolClass> {
    const userId = await getStudentUserId();
    const id = `sch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newClass: SchoolClass = { ...item, id, userId };
    try {
      setDoc(doc(db, 'users', userId, 'schedule', id), newClass).catch((err) => {
        console.warn('Background sync class:', err);
      });
    } catch (err) {
      console.warn('Fallback saving schedule class locally:', err);
    }
    const current = getLocalFallback<SchoolClass[]>('schedule', []);
    const updated = [...current, newClass];
    setLocalFallback('schedule', updated);
    return newClass;
  },

  async updateClass(id: string, updates: Partial<SchoolClass>): Promise<void> {
    const userId = await getStudentUserId();
    try {
      updateDoc(doc(db, 'users', userId, 'schedule', id), updates).catch((err) => {
        console.warn('Background sync update class:', err);
      });
    } catch (err) {
      console.warn('Fallback updating class locally:', err);
    }
    const current = getLocalFallback<SchoolClass[]>('schedule', []);
    const idx = current.findIndex((c) => c.id === id);
    if (idx !== -1) {
      current[idx] = { ...current[idx], ...updates };
      setLocalFallback('schedule', current);
    }
  },

  async deleteClass(id: string): Promise<void> {
    const userId = await getStudentUserId();
    try {
      deleteDoc(doc(db, 'users', userId, 'schedule', id)).catch((err) => {
        console.warn('Background sync delete class:', err);
      });
    } catch (err) {
      console.warn('Fallback deleting class locally:', err);
    }
    const current = getLocalFallback<SchoolClass[]>('schedule', []);
    setLocalFallback('schedule', current.filter((c) => c.id !== id));
  },

  // ===== DAILY TESTS =====
  async getDailyTests(): Promise<DailyTestItem[]> {
    try {
      const col = await getUserCollectionRef('dailyTests');
      const snap = await fetchDocsWithTimeout(col);
      if (snap.empty) {
        return getLocalFallback('dailyTests', []);
      }
      const items: DailyTestItem[] = [];
      snap.forEach((d) => items.push({ ...(d.data() as DailyTestItem), id: d.id }));
      items.sort((a, b) => b.date.localeCompare(a.date));
      setLocalFallback('dailyTests', items);
      return items;
    } catch (err) {
      console.warn('Using local daily tests cache:', err);
      return getLocalFallback('dailyTests', []);
    }
  },

  async addDailyTest(test: Omit<DailyTestItem, 'id'>): Promise<DailyTestItem> {
    const userId = await getStudentUserId();
    const id = `test-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newTest: DailyTestItem = { ...test, id, userId };
    try {
      setDoc(doc(db, 'users', userId, 'dailyTests', id), newTest).catch((err) => {
        console.warn('Background sync daily test:', err);
      });
    } catch (err) {
      console.warn('Fallback saving daily test locally:', err);
    }
    const current = getLocalFallback<DailyTestItem[]>('dailyTests', []);
    const updated = [newTest, ...current];
    setLocalFallback('dailyTests', updated);
    return newTest;
  },

  async updateDailyTest(id: string, updates: Partial<DailyTestItem>): Promise<void> {
    const userId = await getStudentUserId();
    try {
      updateDoc(doc(db, 'users', userId, 'dailyTests', id), updates).catch((err) => {
        console.warn('Background sync update daily test:', err);
      });
    } catch (err) {
      console.warn('Fallback updating daily test locally:', err);
    }
    const current = getLocalFallback<DailyTestItem[]>('dailyTests', []);
    const idx = current.findIndex((t) => t.id === id);
    if (idx !== -1) {
      current[idx] = { ...current[idx], ...updates };
      setLocalFallback('dailyTests', current);
    }
  },

  async deleteDailyTest(id: string): Promise<void> {
    const userId = await getStudentUserId();
    try {
      deleteDoc(doc(db, 'users', userId, 'dailyTests', id)).catch((err) => {
        console.warn('Background sync delete daily test:', err);
      });
    } catch (err) {
      console.warn('Fallback deleting daily test locally:', err);
    }
    const current = getLocalFallback<DailyTestItem[]>('dailyTests', []);
    setLocalFallback('dailyTests', current.filter((t) => t.id !== id));
  },

  // ===== STUDY HISTORY =====
  async getStudyHistory(): Promise<StudyHistoryItem[]> {
    try {
      const col = await getUserCollectionRef('studyHistory');
      const snap = await fetchDocsWithTimeout(col);
      if (snap.empty) {
        return getLocalFallback('studyHistory', []);
      }
      const items: StudyHistoryItem[] = [];
      snap.forEach((d) => items.push({ ...(d.data() as StudyHistoryItem), id: d.id }));
      items.sort((a, b) => b.date.localeCompare(a.date));
      setLocalFallback('studyHistory', items);
      return items;
    } catch (err) {
      console.warn('Using local study history cache:', err);
      return getLocalFallback('studyHistory', []);
    }
  },

  async recordStudySession(historyItem: Omit<StudyHistoryItem, 'id'>): Promise<StudyHistoryItem> {
    const userId = await getStudentUserId();
    const id = `hist-${Date.now()}`;
    const newEntry: StudyHistoryItem = { ...historyItem, id, userId };
    try {
      setDoc(doc(db, 'users', userId, 'studyHistory', id), newEntry).catch((err) => {
        console.warn('Background sync study history:', err);
      });
    } catch (err) {
      console.warn('Fallback saving study history locally:', err);
    }
    const current = getLocalFallback<StudyHistoryItem[]>('studyHistory', []);
    const updated = [newEntry, ...current];
    setLocalFallback('studyHistory', updated);
    return newEntry;
  },

  // ===== CHAT HISTORY =====
  async getChatMessages(): Promise<ChatMessage[]> {
    try {
      const col = await getUserCollectionRef('chatMessages');
      const snap = await fetchDocsWithTimeout(col);
      if (snap.empty) {
        return getLocalFallback('chatMessages', []);
      }
      const items: ChatMessage[] = [];
      snap.forEach((d) => items.push({ ...(d.data() as ChatMessage), id: d.id }));
      items.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
      setLocalFallback('chatMessages', items);
      return items;
    } catch (err) {
      console.warn('Using local chat messages cache:', err);
      return getLocalFallback('chatMessages', []);
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
      setDoc(doc(db, 'users', userId, 'chatMessages', id), newMsg).catch((err) => {
        console.warn('Background sync chat message:', err);
      });
    } catch (err) {
      console.warn('Fallback saving chat message locally:', err);
    }
    const current = getLocalFallback<ChatMessage[]>('chatMessages', []);
    const updated = [...current, newMsg];
    setLocalFallback('chatMessages', updated);
    return newMsg;
  },

  async clearChat(): Promise<void> {
    try {
      const col = await getUserCollectionRef('chatMessages');
      const snap = await fetchDocsWithTimeout(col);
      for (const d of snap.docs) {
        deleteDoc(d.ref).catch(() => {});
      }
    } catch (err) {
      console.warn('Fallback clearing chat locally:', err);
    }
    setLocalFallback('chatMessages', []);
  },

  // ===== USER PREFERENCES =====
  async getPreferences(): Promise<UserPreferences> {
    try {
      const userId = await getStudentUserId();
      const prefDoc = await fetchDocWithTimeout(doc(db, 'users', userId, 'preferences', 'general'));
      if (prefDoc.exists()) {
        const data = prefDoc.data() as UserPreferences;
        setLocalFallback('preferences', data);
        return data;
      }
      return getLocalFallback('preferences', INITIAL_PREFERENCES);
    } catch (err) {
      console.warn('Using local preferences cache:', err);
      return getLocalFallback('preferences', INITIAL_PREFERENCES);
    }
  },

  async updatePreferences(updates: Partial<UserPreferences>): Promise<UserPreferences> {
    const userId = await getStudentUserId();
    const current = await this.getPreferences();
    const updated: UserPreferences = { ...current, ...updates, userId };
    try {
      setDoc(doc(db, 'users', userId, 'preferences', 'general'), updated, { merge: true }).catch((err) => {
        console.warn('Background sync preferences:', err);
      });
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

  // ===== DATABASE RESET & WIPING =====
  async wipeAllUserData(): Promise<void> {
    try {
      const userId = await getStudentUserId();
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
      await Promise.all(
        collections.map(async (colName) => {
          try {
            const colRef = collection(db, 'users', userId, colName);
            const snap = await fetchDocsWithTimeout(colRef, 3500);
            const deletePromises = snap.docs.map((d) => deleteDoc(d.ref).catch(() => {}));
            await Promise.all(deletePromises);
          } catch (e) {
            console.warn(`Could not clear Firestore collection ${colName}:`, e);
          }
        })
      );
    } catch (err) {
      console.warn('Wipe all user data Firestore error:', err);
    }

    // Clean all localStorage keys relating to studymate data
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (
          k &&
          (k.startsWith('sm_') ||
            k.startsWith('studymate_') ||
            k.includes('task') ||
            k.includes('goal') ||
            k.includes('exam') ||
            k.includes('schedule') ||
            k.includes('test') ||
            k.includes('chat'))
        ) {
          // Keep device user ID so user keeps authentication
          if (k !== 'studymate_device_user_id' && k !== 'studymate_clean_slate_active') {
            keysToRemove.push(k);
          }
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn('LocalStorage wipe error:', e);
    }
  },

  async resetAllToDefaults(): Promise<void> {
    await this.wipeAllUserData();
  },
};
