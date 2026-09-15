/**
 * StudyMate Domain Types
 * Persian RTL Personal Study Planner for Iranian Konkur High-School Students
 * Persistent Cloud Models & AI Context Representation
 */

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export type TestType = 'educational' | 'consolidating' | 'timed' | 'review' | 'mock';

export interface Task {
  id: string;
  title: string;
  subject: string;
  priority: TaskPriority;
  dueDate: string; // YYYY-MM-DD
  status: TaskStatus;
  completed: boolean;
  estimatedMinutes: number;
  goalId?: string;
  notes?: string;
  isMissed?: boolean;
  missedDate?: string;
  createdAt: string;
  userId?: string;
}

export interface Goal {
  id: string;
  title: string;
  deadline: string; // YYYY-MM-DD
  progress: number; // 0 - 100
  subject?: string;
  category: 'konkur' | 'school' | 'tests';
  relatedTaskIds: string[];
  description?: string;
  userId?: string;
}

export interface Exam {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  subject: string;
  notes?: string;
  isImportant?: boolean;
  userId?: string;
}

export interface Deadline {
  id: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  category: 'exam' | 'school' | 'project' | 'registration';
  priority: TaskPriority;
  completed: boolean;
  notes?: string;
  userId?: string;
}

export type DayOfWeek = 'saturday' | 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

export interface SchoolClass {
  id: string;
  dayOfWeek: DayOfWeek;
  period: number; // 1, 2, 3, 4
  startTime: string;
  endTime: string;
  subject: string;
  teacher?: string;
  room?: string;
  userId?: string;
}

export interface DailyTestItem {
  id: string;
  subject: string;
  topic: string;
  numberOfQuestions: number;
  date: string; // YYYY-MM-DD
  completed: boolean;
  testType?: TestType;
  timeLimitMinutes?: number;
  timeSpentMinutes?: number;
  correctCount?: number;
  wrongCount?: number;
  unansweredCount?: number;
  percentage?: number; // Konkur standard score: ((3*c - w) / (3*total)) * 100
  accuracy?: number; // Raw accuracy: (c / (c + w || 1)) * 100
  notes?: string;
  userId?: string;
}

export interface StudyHistoryItem {
  id: string;
  date: string; // YYYY-MM-DD
  totalMinutes: number;
  tasksCompleted: number;
  questionsSolved: number;
  averageTestPercentage?: number;
  subjectBreakdown: {
    subject: string;
    minutes: number;
    percentage: number;
  }[];
  notes?: string;
  userId?: string;
}

export interface DailyQuote {
  id: string;
  text: string;
  author: string;
  source?: string;
}

export interface ControlledActionSuggestion {
  type:
    | 'add_task'
    | 'plan_study'
    | 'review'
    | 'batch_tasks'
    | 'reschedule'
    | 'add_goal'
    | 'add_exam'
    | 'record_test';
  title: string;
  description?: string;
  requiresConfirmation?: boolean;
  payload?: any;
  status?: 'pending' | 'applied' | 'dismissed';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionSuggestion?: ControlledActionSuggestion;
  createdAt?: string;
  userId?: string;
}

export interface UserPreferences {
  studentName: string;
  grade: string;
  major: string; // e.g. 'علوم تجربی'
  targetMajor: string; // e.g. 'دکتری حرفه‌ای پزشکی دانشگاه علوم پزشکی تهران'
  targetRank: number; // e.g. 500
  dailyGoalMinutes: number; // e.g. 480 (8 hours)
  weeklyTestGoal: number; // e.g. 300 tests
  weakSubjects: string[];
  strongSubjects: string[];
  studyPace: 'intense' | 'balanced' | 'light';
  notificationsEnabled: boolean;
  userId?: string;
}

/**
 * Structured User Context Representation
 * Built to be fed directly to the AI Advisor so it understands the student's complete academic state
 */
export interface AIStructuredUserContext {
  studentSummary: {
    name: string;
    grade: string;
    major: string;
    targetUniversityAndMajor: string;
    targetRank: number;
    dailyGoalMinutes: number;
    weeklyTestTarget: number;
  };
  todayState: {
    todayDate: string;
    todayPersianDate: string;
    dayOfWeek: DayOfWeek;
    todayTasksCount: number;
    completedTasksToday: number;
    todayCompletionPercentage: number;
    estimatedStudyMinutesPlannedToday: number;
    completedStudyMinutesToday: number;
    todayTestsSolvedCount: number;
    todayTestsAverageAccuracy: number;
  };
  todayTasks: Task[];
  urgentAndPendingTasks: Task[];
  activeGoals: Goal[];
  upcomingExamsAndDeadlines: {
    id: string;
    title: string;
    date: string;
    daysRemaining: number;
    isImportant: boolean;
    subject: string;
    notes?: string;
  }[];
  todaySchoolClasses: SchoolClass[];
  recentDailyTests: DailyTestItem[];
  recentStudyHistory: StudyHistoryItem[];
  subjectStrengthsAndWeaknesses: {
    weak: string[];
    strong: string[];
  };
  advisorPacing: 'intense' | 'balanced' | 'light';
  extractedAt: string;
}

export type ActiveScreen = 
  | 'home'
  | 'chat'
  | 'tasks'
  | 'goals'
  | 'exams'
  | 'schedule'
  | 'daily_tests'
  | 'analysis';
