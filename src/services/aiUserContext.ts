/**
 * AI User Context Service
 * Collects, processes, and aggregates the student's current academic state
 * (today's tasks, goals, upcoming exams, school schedule, recent study history,
 * test performance, and preferences) into a clean, structured payload for the AI Advisor.
 */

import { FirestoreDatabase } from './firestoreDb';
import {
  AIStructuredUserContext,
  DayOfWeek,
  Task,
  Goal,
  Exam,
  Deadline,
  SchoolClass,
  DailyTestItem,
  StudyHistoryItem,
  UserPreferences,
} from '../types/studymate';
import {
  calculateDaysRemaining,
  getTodayPersianDisplay,
} from '../utils/persianDate';

// Map JS day to Persian school DayOfWeek
function getCurrentDayOfWeek(): DayOfWeek {
  const day = new Date().getDay();
  // JS: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  switch (day) {
    case 6:
      return 'saturday';
    case 0:
      return 'sunday';
    case 1:
      return 'monday';
    case 2:
      return 'tuesday';
    case 3:
      return 'wednesday';
    case 4:
      return 'thursday';
    case 5:
    default:
      return 'friday' as DayOfWeek; // School usually off on Friday
  }
}

export const AIUserContextService = {
  /**
   * Builds the comprehensive, structured AI user context
   */
  async buildUserContext(): Promise<AIStructuredUserContext> {
    const todayStr = new Date().toISOString().split('T')[0];
    const dayOfWeek = getCurrentDayOfWeek();

    // Fetch all domain data from Firestore
    const [tasks, goals, exams, deadlines, schedule, dailyTests, studyHistory, preferences] =
      await Promise.all([
        FirestoreDatabase.getTasks(),
        FirestoreDatabase.getGoals(),
        FirestoreDatabase.getExams(),
        FirestoreDatabase.getDeadlines(),
        FirestoreDatabase.getSchedule(),
        FirestoreDatabase.getDailyTests(),
        FirestoreDatabase.getStudyHistory(),
        FirestoreDatabase.getPreferences(),
      ]);

    // 1. Today's Tasks
    const todayTasks = tasks.filter((t) => t.dueDate === todayStr);
    const completedTasksToday = todayTasks.filter((t) => t.completed).length;
    const todayCompletionPercentage =
      todayTasks.length > 0 ? Math.round((completedTasksToday / todayTasks.length) * 100) : 0;

    const estimatedStudyMinutesPlannedToday = todayTasks.reduce(
      (acc, t) => acc + (t.estimatedMinutes || 60),
      0
    );
    const completedStudyMinutesToday = todayTasks
      .filter((t) => t.completed)
      .reduce((acc, t) => acc + (t.estimatedMinutes || 60), 0);

    // Urgent and pending tasks across all dates
    const urgentAndPendingTasks = tasks.filter(
      (t) => !t.completed && (t.priority === 'urgent' || t.priority === 'high')
    );

    // 2. Upcoming Exams and Deadlines
    const upcomingExams = exams
      .map((ex) => {
        const remaining = calculateDaysRemaining(ex.date);
        return {
          id: ex.id,
          title: ex.title,
          date: ex.date,
          daysRemaining: remaining.days,
          isPast: remaining.isPast,
          isImportant: !!ex.isImportant,
          subject: ex.subject,
          notes: ex.notes,
        };
      })
      .filter((ex) => !ex.isPast)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);

    // 3. Today's School Classes
    const todaySchoolClasses = schedule
      .filter((c) => c.dayOfWeek === dayOfWeek)
      .sort((a, b) => a.period - b.period);

    // 4. Test Performance Analysis
    const todayTests = dailyTests.filter((t) => t.date === todayStr);
    const todayTestsSolvedCount = todayTests.reduce(
      (acc, t) => acc + (t.numberOfQuestions || 0),
      0
    );
    const completedTodayTests = todayTests.filter((t) => t.completed);
    const todayTestsAverageAccuracy =
      completedTodayTests.length > 0
        ? Math.round(
            completedTodayTests.reduce((acc, t) => acc + (t.percentage || 0), 0) /
              completedTodayTests.length
          )
        : 0;

    // 5. Build AI Structured Context
    const context: AIStructuredUserContext = {
      studentSummary: {
        name: preferences.studentName,
        grade: preferences.grade,
        major: preferences.major,
        targetUniversityAndMajor: preferences.targetMajor,
        targetRank: preferences.targetRank,
        dailyGoalMinutes: preferences.dailyGoalMinutes,
        weeklyTestTarget: preferences.weeklyTestGoal,
      },
      todayState: {
        todayDate: todayStr,
        todayPersianDate: getTodayPersianDisplay(),
        dayOfWeek,
        todayTasksCount: todayTasks.length,
        completedTasksToday,
        todayCompletionPercentage,
        estimatedStudyMinutesPlannedToday,
        completedStudyMinutesToday,
        todayTestsSolvedCount,
        todayTestsAverageAccuracy,
      },
      todayTasks,
      urgentAndPendingTasks,
      activeGoals: goals,
      upcomingExamsAndDeadlines: upcomingExams,
      todaySchoolClasses,
      recentDailyTests: dailyTests.slice(0, 10),
      recentStudyHistory: studyHistory.slice(0, 7),
      subjectStrengthsAndWeaknesses: {
        weak: preferences.weakSubjects,
        strong: preferences.strongSubjects,
      },
      advisorPacing: preferences.studyPace,
      extractedAt: new Date().toISOString(),
    };

    return context;
  },

  /**
   * Formats the user context into an expressive, clean Persian text prompt
   * ready to be sent to an LLM/Gemini system prompt when activated.
   */
  formatContextForAIPrompt(context: AIStructuredUserContext): string {
    const s = context.studentSummary;
    const t = context.todayState;

    return `
=== وضعیت تحصیلی کنکوری دانش‌آموز (StudyMate Context) ===
- نام و مشخصات: ${s.name} | پایه: ${s.grade} | رشته: ${s.major}
- هدف غایی: ${s.targetUniversityAndMajor} (رتبه هدف: زیر ${s.targetRank})
- تاریخ امروز: ${t.todayPersianDate} (${t.dayOfWeek})
- پیشرفت امروز: ${t.completedTasksToday} از ${t.todayTasksCount} پارت مطالعه انجام شده (${t.todayCompletionPercentage}٪)
- زمان مطالعه امروز: ${t.completedStudyMinutesToday} دقیقه تکمیل شده از ${t.estimatedStudyMinutesPlannedToday} دقیقه برنامه‌ریزی
- تست‌های حل‌شده امروز: ${t.todayTestsSolvedCount} تست (میانگین درصد: ${t.todayTestsAverageAccuracy}٪)
- دروس نیازمند تمرکز و چالش‌برانگیز: ${context.subjectStrengthsAndWeaknesses.weak.join('، ')}
- نقاط قوت: ${context.subjectStrengthsAndWeaknesses.strong.join('، ')}
- نزدیک‌ترین آزمون‌های مهم: ${context.upcomingExamsAndDeadlines
      .slice(0, 2)
      .map((e) => `${e.title} (${e.daysRemaining} روز مانده)`)
      .join(' | ')}
- کلاس‌های مدرسه امروز: ${
      context.todaySchoolClasses.length > 0
        ? context.todaySchoolClasses.map((c) => `زنگ ${c.period}: ${c.subject}`).join('، ')
        : 'امروز کلاس مدرسه‌ای ثبت نشده است'
    }
=========================================================
`.trim();
  },
};
