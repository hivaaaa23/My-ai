/**
 * Academic & Study Advisor Domain Models
 * Core structured context types for tasks, goals, exams, deadlines, schedules, tests, study history, performance, and preferences.
 */

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type SubjectCategory = 'STEM' | 'Humanities' | 'Languages' | 'Arts' | 'Social Sciences' | 'Other';

export interface Task {
  id: string;
  title: string;
  description?: string;
  subject: string;
  dueDate: string; // ISO format or YYYY-MM-DD
  priority: Priority;
  estimatedMinutes: number;
  completed: boolean;
  completedAt?: string;
  tags: string[];
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  subject?: string;
  category: 'academic' | 'exam_prep' | 'habit' | 'skill';
  targetDate: string;
  progressPercentage: number;
  currentValue: number;
  targetValue: number;
  unit: string; // e.g., 'chapters', 'hours', '%', 'practice tests'
  milestones: {
    id: string;
    title: string;
    completed: boolean;
  }[];
  notes?: string;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  examDate: string;
  weightPercentage: number; // e.g. 30% of final grade
  targetScore: number; // e.g. 90%
  currentReadinessPercentage: number;
  topics: string[];
  location?: string;
  notes?: string;
}

export interface UnifiedDeadline {
  id: string;
  type: 'task' | 'exam' | 'project' | 'daily_test';
  title: string;
  subject: string;
  dueDate: string;
  urgencyDays: number;
  priority: Priority;
  completed: boolean;
}

export interface SchoolScheduleItem {
  id: string;
  courseCode: string;
  courseName: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  instructor?: string;
  room?: string;
  color: string;
}

export interface DailyTest {
  id: string;
  date: string; // YYYY-MM-DD
  subject: string;
  title: string;
  score: number; // e.g. 18
  totalQuestions: number; // e.g. 20
  percentage: number; // 90%
  timeSpentMinutes: number;
  weakTopics: string[];
  strengths: string[];
  reflections?: string;
}

export interface StudyHistorySession {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  durationMinutes: number;
  subject: string;
  focusScore: number; // 1 to 10
  topicsCovered: string[];
  notes?: string;
  completedTaskIds?: string[];
}

export interface TestPerformanceAnalytics {
  overallAveragePercentage: number;
  subjectBreakdown: {
    subject: string;
    averageScore: number;
    testsTaken: number;
    trend: 'improving' | 'declining' | 'stable';
    weakestTopics: string[];
    strongestTopics: string[];
  }[];
  recentScores: {
    date: string;
    subject: string;
    percentage: number;
  }[];
  totalTestsCount: number;
}

export interface UserPreferences {
  studyPace: 'light' | 'moderate' | 'intensive' | 'exam_cram';
  targetDailyStudyHours: number;
  preferredStudyTimeSlots: ('morning' | 'afternoon' | 'evening' | 'night')[];
  weakSubjects: string[];
  focusSubjects: string[];
  learningStyle: 'visual' | 'active_recall' | 'spaced_repetition' | 'problem_solving';
  advisorPersonality: 'encouraging' | 'analytical' | 'strict_disciplinarian' | 'socratic';
  breakIntervalMinutes: number;
  focusSessionMinutes: number;
}

/**
 * High-level unified structure prepared specifically for the Gemini Personal Study Advisor.
 * Clean, sanitized, and structured for deterministic prompt injection and function calling.
 */
export interface StructuredUserContext {
  studentProfile: {
    name: string;
    gradeLevel: string;
    majorOrFocus: string;
  };
  metrics: {
    pendingTasksCount: number;
    completedTasksCount: number;
    upcomingExamsCount: number;
    totalStudyHoursThisWeek: number;
    averageTestScore: number;
    adherenceRatePercentage: number;
  };
  tasks: Task[];
  goals: Goal[];
  exams: Exam[];
  upcomingDeadlines: UnifiedDeadline[];
  schoolSchedule: SchoolScheduleItem[];
  dailyTests: DailyTest[];
  studyHistory: StudyHistorySession[];
  testPerformance: TestPerformanceAnalytics;
  userPreferences: UserPreferences;
  generatedAt: string;
}

/**
 * Server-side Controlled Action representation
 */
export interface ControlledActionLog {
  id: string;
  timestamp: string;
  actionName: string;
  parameters: Record<string, unknown>;
  status: 'success' | 'failed' | 'rejected_by_guardrails';
  message: string;
  affectedEntities?: {
    entityType: 'task' | 'goal' | 'exam' | 'schedule' | 'study_history' | 'preference';
    entityId: string;
  }[];
}
