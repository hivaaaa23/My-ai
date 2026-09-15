/**
 * StudyMate - استادی‌میت
 * Mobile-first Persian RTL Study Planner for Iranian Konkur High-School Students
 * Persistent Cloud Architecture with Firebase Firestore
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ActiveScreen,
  Task,
  Goal,
  Exam,
  SchoolClass,
  DailyTestItem,
  ChatMessage,
  DailyQuote,
  ControlledActionSuggestion,
  StudyHistoryItem,
  UserPreferences,
} from './types/studymate';
import { FirestoreDatabase } from './services/firestoreDb';
import { generateMockAiReply } from './services/mockAiAdvisor';
import { api } from './services/apiClient';

// Components
import { AppHeader } from './components/AppHeader';
import { ScreenSwitcher } from './components/ScreenSwitcher';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { ChatScreen } from './components/ChatScreen';
import { TasksScreen } from './components/TasksScreen';
import { GoalsScreen } from './components/GoalsScreen';
import { ExamsScreen } from './components/ExamsScreen';
import { SchoolScheduleScreen } from './components/SchoolScheduleScreen';
import { DailyTestsScreen } from './components/DailyTestsScreen';
import { AnalysisScreen } from './components/AnalysisScreen';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('home');

  // Loading & Sync state
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Domain state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [schedule, setSchedule] = useState<SchoolClass[]>([]);
  const [dailyTests, setDailyTests] = useState<DailyTestItem[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [studyHistory, setStudyHistory] = useState<StudyHistoryItem[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({
    targetDailyStudyMinutes: 360,
    maxDailyStudyMinutes: 480,
    schoolDaysPerWeek: 5,
    trackKonkurTime: true,
    theme: 'light',
    language: 'fa',
  });
  const [quote, setQuote] = useState<DailyQuote>(FirestoreDatabase.getTodayQuote());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Initial Load from Firestore
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // Ensure seed if brand new empty database
      await FirestoreDatabase.ensureSeededIfEmpty();

      // Parallel fetch of all collections
      const [
        fetchedTasks,
        fetchedGoals,
        fetchedExams,
        fetchedSchedule,
        fetchedTests,
        fetchedChat,
      ] = await Promise.all([
        FirestoreDatabase.getTasks(),
        FirestoreDatabase.getGoals(),
        FirestoreDatabase.getExams(),
        FirestoreDatabase.getSchedule(),
        FirestoreDatabase.getDailyTests(),
        FirestoreDatabase.getChatMessages(),
      ]);

      setTasks(fetchedTasks);
      setGoals(fetchedGoals);
      setExams(fetchedExams);
      setSchedule(fetchedSchedule);
      setDailyTests(fetchedTests);
      setChatMessages(fetchedChat);
      setQuote(FirestoreDatabase.getTodayQuote());
    } catch (err) {
      console.error('Failed to load initial Firestore data:', err);
      setErrorMessage('خطا در برقراری ارتباط با پایگاه داده فایربیس. داده‌های آفلاین در دسترس هستند.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Generic helper for background sync
  const performSync = async <T,>(operation: () => Promise<T>, updateState: () => void) => {
    setIsSyncing(true);
    try {
      await operation();
      updateState();
    } catch (err) {
      console.warn('Sync warning:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Tasks handlers
  const handleAddTask = async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    setIsSyncing(true);
    try {
      const newTask = await FirestoreDatabase.addTask(taskData);
      setTasks((prev) => [newTask, ...prev]);
      setToastMessage(`✓ «${taskData.title}» به برنامه‌ها اضافه شد`);
    } catch (err) {
      console.error('Error adding task:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    // Optimistic UI update
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    await performSync(
      () => FirestoreDatabase.updateTask(id, updates),
      () => {}
    );
  };

  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await performSync(
      () => FirestoreDatabase.deleteTask(id),
      () => {}
    );
  };

  const handleToggleTask = async (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: !t.completed,
              status: !t.completed ? 'completed' : 'todo',
            }
          : t
      )
    );
    await performSync(
      () => FirestoreDatabase.toggleTask(id),
      () => {}
    );
  };

  // Goals handlers
  const handleAddGoal = async (goalData: Omit<Goal, 'id'>) => {
    setIsSyncing(true);
    try {
      const newGoal = await FirestoreDatabase.addGoal(goalData);
      setGoals((prev) => [newGoal, ...prev]);
    } catch (err) {
      console.error('Error adding goal:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateGoal = async (id: string, updates: Partial<Goal>) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
    await performSync(
      () => FirestoreDatabase.updateGoal(id, updates),
      () => {}
    );
  };

  const handleDeleteGoal = async (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    await performSync(
      () => FirestoreDatabase.deleteGoal(id),
      () => {}
    );
  };

  // Exams handlers
  const handleAddExam = async (examData: Omit<Exam, 'id'>) => {
    setIsSyncing(true);
    try {
      const newExam = await FirestoreDatabase.addExam(examData);
      setExams((prev) => [...prev, newExam]);
    } catch (err) {
      console.error('Error adding exam:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateExam = async (id: string, updates: Partial<Exam>) => {
    setExams((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    await performSync(
      () => FirestoreDatabase.updateExam(id, updates),
      () => {}
    );
  };

  const handleDeleteExam = async (id: string) => {
    setExams((prev) => prev.filter((e) => e.id !== id));
    await performSync(
      () => FirestoreDatabase.deleteExam(id),
      () => {}
    );
  };

  // School Schedule handlers
  const handleAddClass = async (classData: Omit<SchoolClass, 'id'>) => {
    setIsSyncing(true);
    try {
      const newClass = await FirestoreDatabase.addClass(classData);
      setSchedule((prev) => [...prev, newClass]);
    } catch (err) {
      console.error('Error adding class:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateClass = async (id: string, updates: Partial<SchoolClass>) => {
    setSchedule((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    await performSync(
      () => FirestoreDatabase.updateClass(id, updates),
      () => {}
    );
  };

  const handleDeleteClass = async (id: string) => {
    setSchedule((prev) => prev.filter((c) => c.id !== id));
    await performSync(
      () => FirestoreDatabase.deleteClass(id),
      () => {}
    );
  };

  // Daily Tests handlers
  const handleAddDailyTest = async (testData: Omit<DailyTestItem, 'id'>) => {
    setIsSyncing(true);
    try {
      const newTest = await FirestoreDatabase.addDailyTest(testData);
      setDailyTests((prev) => [newTest, ...prev]);
    } catch (err) {
      console.error('Error adding daily test:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateDailyTest = async (id: string, updates: Partial<DailyTestItem>) => {
    setDailyTests((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    await performSync(
      () => FirestoreDatabase.updateDailyTest(id, updates),
      () => {}
    );
  };

  const handleDeleteDailyTest = async (id: string) => {
    setDailyTests((prev) => prev.filter((t) => t.id !== id));
    await performSync(
      () => FirestoreDatabase.deleteDailyTest(id),
      () => {}
    );
  };

  // Chat handlers
  const handleSendMessage = async (text: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Add user message to state and Firestore
    const userMsg: Omit<ChatMessage, 'id'> = {
      sender: 'user',
      text,
      timestamp: timeStr,
      createdAt: new Date().toISOString(),
    };
    const savedUserMsg = await FirestoreDatabase.addChatMessage(userMsg);
    setChatMessages((prev) => [...prev, savedUserMsg]);

    // Generate AI advisor reply securely via server-side Gemini
    let reply: { text: string; suggestedAction?: ControlledActionSuggestion };
    try {
      reply = await api.chatWithAdvisor(
        text,
        chatMessages.slice(-6).map((m) => ({ sender: m.sender, text: m.text })),
        {
          tasks,
          dailyTests,
          schedule,
          exams,
          goals,
          preferences,
        }
      );
    } catch (err) {
      console.warn('Server-side advisor chat failed, utilizing local fallback:', err);
      reply = await generateMockAiReply(text);
    }

    // Process controlled action
    let finalAction = reply.suggestedAction;

    // If safe and unambiguous and doesn't require confirmation, automatically create in Firestore
    if (finalAction && !finalAction.requiresConfirmation) {
      try {
        if (finalAction.type === 'add_task' && finalAction.payload) {
          await handleAddTask({
            title: finalAction.payload.title || finalAction.title,
            subject: finalAction.payload.subject || 'برنامه مشاور',
            priority: finalAction.payload.priority || 'high',
            dueDate: finalAction.payload.dueDate || new Date().toISOString().split('T')[0],
            status: 'todo',
            completed: false,
            estimatedMinutes: finalAction.payload.estimatedMinutes || 45,
            notes: finalAction.payload.notes || 'ثبت‌شده از طریق گفتگوی هوشمند مشاور',
          });
          finalAction = { ...finalAction, status: 'applied' };
        } else if (finalAction.type === 'batch_tasks' && finalAction.payload?.tasks) {
          for (const t of finalAction.payload.tasks) {
            await handleAddTask({
              title: t.title,
              subject: t.subject || 'تکلیف مدرسه',
              priority: t.priority || 'high',
              dueDate: t.dueDate || new Date().toISOString().split('T')[0],
              status: 'todo',
              completed: false,
              estimatedMinutes: t.estimatedMinutes || 45,
              notes: t.notes || 'تکلیف استخراج‌شده از مدرسه توسط هوش مصنوعی',
            });
          }
          finalAction = { ...finalAction, status: 'applied' };
        }
      } catch (actionErr) {
        console.error('Failed to auto-execute controlled action:', actionErr);
      }
    }

    const replyTimeStr = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;

    const assistantMsg: Omit<ChatMessage, 'id'> = {
      sender: 'assistant',
      text: reply.text,
      timestamp: replyTimeStr,
      actionSuggestion: finalAction,
      createdAt: new Date().toISOString(),
    };
    const savedAssistantMsg = await FirestoreDatabase.addChatMessage(assistantMsg);
    setChatMessages((prev) => [...prev, savedAssistantMsg]);
  };

  const handleApplyRescheduling = async (plan: { taskId: string; newDueDate: string; priority?: any }[]) => {
    for (const item of plan) {
      await handleUpdateTask(item.taskId, {
        dueDate: item.newDueDate,
        ...(item.priority ? { priority: item.priority } : {}),
        isMissed: false,
      });
    }
  };

  const handleExecuteControlledAction = async (action: ControlledActionSuggestion, messageId?: string) => {
    if (action.type === 'reschedule' && action.payload?.plan) {
      await handleApplyRescheduling(action.payload.plan);
    } else if (action.type === 'add_task' && action.payload) {
      await handleAddTask({
        title: action.payload.title || action.title,
        subject: action.payload.subject || 'برنامه مشاور',
        priority: action.payload.priority || 'high',
        dueDate: action.payload.dueDate || new Date().toISOString().split('T')[0],
        status: 'todo',
        completed: false,
        estimatedMinutes: action.payload.estimatedMinutes || 45,
        notes: action.payload.notes || 'تسک ایجاد شده از گفتگوی مشاور',
      });
    } else if (action.type === 'batch_tasks' && action.payload?.tasks) {
      for (const t of action.payload.tasks) {
        await handleAddTask({
          title: t.title,
          subject: t.subject || 'تکلیف مدرسه',
          priority: t.priority || 'high',
          dueDate: t.dueDate || new Date().toISOString().split('T')[0],
          status: 'todo',
          completed: false,
          estimatedMinutes: t.estimatedMinutes || 45,
          notes: t.notes || 'تکلیف مدرسه ایجاد شده از گفتگوی مشاور',
        });
      }
    }

    if (messageId) {
      setChatMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                actionSuggestion: msg.actionSuggestion
                  ? { ...msg.actionSuggestion, status: 'applied' }
                  : undefined,
              }
            : msg
        )
      );
    }
  };

  const handleClearChat = async () => {
    setChatMessages([]);
    await performSync(
      () => FirestoreDatabase.clearChat(),
      () => {}
    );
  };

  const handleAddTaskFromChat = async (taskTitle: string) => {
    await handleAddTask({
      title: taskTitle,
      subject: 'توصیه مشاور',
      priority: 'high',
      dueDate: new Date().toISOString().split('T')[0],
      status: 'todo',
      completed: false,
      estimatedMinutes: 60,
      notes: 'اضافه شده از طریق گفتگوی مشاور هوشمند استادی‌میت',
    });
  };

  const handleResetData = async () => {
    if (window.confirm('آیا مایلید تمام داده‌های کنکور در دیتابیس فایربیس به داده‌های نمونه اولیه بازنشانی شوند؟')) {
      setIsLoading(true);
      try {
        await FirestoreDatabase.resetAllToDefaults();
        await loadInitialData();
      } catch (err) {
        console.error('Error resetting database:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Badge counts
  const pendingTasksCount = tasks.filter((t) => !t.completed).length;
  const upcomingExamsCount = exams.length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col items-center">
      {/* Mobile Frame Container */}
      <div className="w-full max-w-lg min-h-screen bg-slate-50/60 flex flex-col shadow-md border-x border-slate-200/80 relative">
        {/* Sticky App Header */}
        <AppHeader
          activeScreen={activeScreen}
          onResetData={handleResetData}
          isSyncing={isSyncing}
        />

        {/* Scrollable Screen Switcher Tabs */}
        <ScreenSwitcher
          activeScreen={activeScreen}
          onSelectScreen={setActiveScreen}
          pendingTasksCount={pendingTasksCount}
          upcomingExamsCount={upcomingExamsCount}
        />

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="mx-4 mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs transition animate-fade-in">
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="mx-4 mt-2 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs text-rose-700">
            <div className="flex items-center space-x-reverse space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={loadInitialData}
              className="p-1 rounded-md hover:bg-rose-100 transition text-rose-700"
              title="تلاش مجدد"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 px-4 py-4 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-80 space-y-4">
              <div className="w-14 h-14 rounded-2xl glass-box flex items-center justify-center text-[#AA0033] shadow-lg">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-[#28264B]">
                  درحال بارگذاری پایگاه داده فایربیس...
                </h3>
                <p className="text-xs text-[#4E5174]">
                  همگام‌سازی اهداف، آزمون‌ها و پارت‌های مطالعه استادی‌میت
                </p>
              </div>
            </div>
          ) : (
            <>
              {activeScreen === 'home' && (
                <HomeScreen
                  tasks={tasks}
                  exams={exams}
                  dailyTests={dailyTests}
                  quote={quote}
                  onNavigate={setActiveScreen}
                  onToggleTask={handleToggleTask}
                  onQuickAddTask={() => setActiveScreen('tasks')}
                />
              )}

              {activeScreen === 'chat' && (
                <ChatScreen
                  messages={chatMessages}
                  onSendMessage={handleSendMessage}
                  onClearChat={handleClearChat}
                  onAddTaskFromChat={handleAddTaskFromChat}
                  onExecuteControlledAction={handleExecuteControlledAction}
                  onNavigate={setActiveScreen}
                />
              )}

              {activeScreen === 'tasks' && (
                <TasksScreen
                  tasks={tasks}
                  onAddTask={handleAddTask}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  onToggleTask={handleToggleTask}
                />
              )}

              {activeScreen === 'goals' && (
                <GoalsScreen
                  goals={goals}
                  tasks={tasks}
                  onAddGoal={handleAddGoal}
                  onUpdateGoal={handleUpdateGoal}
                  onDeleteGoal={handleDeleteGoal}
                />
              )}

              {activeScreen === 'exams' && (
                <ExamsScreen
                  exams={exams}
                  onAddExam={handleAddExam}
                  onUpdateExam={handleUpdateExam}
                  onDeleteExam={handleDeleteExam}
                />
              )}

              {activeScreen === 'schedule' && (
                <SchoolScheduleScreen
                  schedule={schedule}
                  onAddClass={handleAddClass}
                  onUpdateClass={handleUpdateClass}
                  onDeleteClass={handleDeleteClass}
                />
              )}

              {activeScreen === 'daily_tests' && (
                <DailyTestsScreen
                  tests={dailyTests}
                  onAddTest={handleAddDailyTest}
                  onUpdateTest={handleUpdateDailyTest}
                  onDeleteTest={handleDeleteDailyTest}
                />
              )}

              {activeScreen === 'analysis' && (
                <AnalysisScreen
                  tasks={tasks}
                  dailyTests={dailyTests}
                  schedule={schedule}
                  studyHistory={studyHistory}
                  preferences={preferences}
                  onApplyRescheduling={handleApplyRescheduling}
                />
              )}
            </>
          )}
        </main>

        {/* Fixed Mobile Bottom Navigation Bar */}
        <BottomNav
          activeScreen={activeScreen}
          onSelectScreen={setActiveScreen}
          pendingTasksCount={pendingTasksCount}
        />
      </div>
    </div>
  );
}
