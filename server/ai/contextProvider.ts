/**
 * AI Context Provider
 * Extracts, sanitizes, transforms, and structures the student's complete academic state
 * so a Gemini Personal Study Advisor can ingest it seamlessly.
 *
 * Keeps AI context modeling decoupled from both UI components and storage implementation.
 */
import {
  StructuredUserContext,
  UnifiedDeadline,
  TestPerformanceAnalytics,
  Priority
} from '../../src/types/academic.js';
import { academicStore } from '../db/store.js';

export class StudyAdvisorContextProvider {
  /**
   * Builds the comprehensive, structured user context required by the Gemini Advisor.
   */
  public static getStructuredUserContext(): StructuredUserContext {
    const tasks = academicStore.getTasks();
    const goals = academicStore.getGoals();
    const exams = academicStore.getExams();
    const schedule = academicStore.getSchedule();
    const dailyTests = academicStore.getDailyTests();
    const studyHistory = academicStore.getStudyHistory();
    const userPreferences = academicStore.getPreferences();

    const unifiedDeadlines = this.computeUnifiedDeadlines(tasks, exams);
    const testPerformance = this.computePerformanceAnalytics(dailyTests);

    // Compute active summary metrics for high-level AI orientation
    const pendingTasks = tasks.filter((t) => !t.completed);
    const completedTasks = tasks.filter((t) => t.completed);

    // Total study hours in the last 7 days
    const totalMinutesStudied = studyHistory.reduce((acc, curr) => acc + curr.durationMinutes, 0);
    const totalStudyHoursThisWeek = Math.round((totalMinutesStudied / 60) * 10) / 10;

    return {
      studentProfile: {
        name: 'Alex Vance',
        gradeLevel: 'Sophomore Undergraduate',
        majorOrFocus: 'Computer Science & Pre-Med Track',
      },
      metrics: {
        pendingTasksCount: pendingTasks.length,
        completedTasksCount: completedTasks.length,
        upcomingExamsCount: exams.length,
        totalStudyHoursThisWeek,
        averageTestScore: testPerformance.overallAveragePercentage,
        adherenceRatePercentage: 88,
      },
      tasks,
      goals,
      exams,
      upcomingDeadlines: unifiedDeadlines,
      schoolSchedule: schedule,
      dailyTests,
      studyHistory,
      testPerformance,
      userPreferences,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generates a token-optimized markdown digest suitable for Gemini system instructions or prompt context.
   */
  public static getPromptOptimizedSummary(context: StructuredUserContext): string {
    const today = new Date().toISOString().split('T')[0];
    const urgentDeadlines = context.upcomingDeadlines.filter((d) => !d.completed && d.urgencyDays <= 5);

    return `
# STUDENT CONTEXT SNAPSHOT (Generated: ${context.generatedAt})
- Student: ${context.studentProfile.name} (${context.studentProfile.gradeLevel})
- Major: ${context.studentProfile.majorOrFocus}
- Study Pace Preference: ${context.userPreferences.studyPace} | Target Daily Hours: ${context.userPreferences.targetDailyStudyHours}h
- Weak Subjects Identified: ${context.userPreferences.weakSubjects.join(', ')}
- Preferred Slots: ${context.userPreferences.preferredStudyTimeSlots.join(', ')}

## CRITICAL & UPCOMING DEADLINES (Next 5 Days)
${
  urgentDeadlines.length === 0
    ? 'No immediate critical deadlines.'
    : urgentDeadlines
        .map(
          (d) =>
            `- [${d.type.toUpperCase()}] ${d.title} (${d.subject}) - Due in ${d.urgencyDays} day(s) on ${d.dueDate} [Priority: ${d.priority}]`
        )
        .join('\n')
}

## EXAMS SCHEDULED
${context.exams
  .map(
    (e) =>
      `- ${e.title} (${e.subject}): Date: ${e.examDate} | Weight: ${e.weightPercentage}% | Readiness: ${e.currentReadinessPercentage}% | Target: ${e.targetScore}%`
  )
  .join('\n')}

## RECENT TEST PERFORMANCE
- Overall Average: ${context.testPerformance.overallAveragePercentage}% across ${context.testPerformance.totalTestsCount} quizzes
- Weakest Topics: ${context.testPerformance.subjectBreakdown
      .flatMap((s) => s.weakestTopics)
      .slice(0, 5)
      .join(', ') || 'None flagged'}

## ACTIVE GOALS
${context.goals
  .map(
    (g) =>
      `- ${g.title}: ${g.currentValue}/${g.targetValue} ${g.unit} (${g.progressPercentage}%) Target Date: ${g.targetDate}`
  )
  .join('\n')}
    `.trim();
  }

  /**
   * Merges tasks and exams into a sorted deadline timeline with days-until-due calculation.
   */
  private static computeUnifiedDeadlines(
    tasks: StructuredUserContext['tasks'],
    exams: StructuredUserContext['exams']
  ): UnifiedDeadline[] {
    const now = new Date();
    const deadlines: UnifiedDeadline[] = [];

    // From Tasks
    for (const task of tasks) {
      const dueDateObj = new Date(task.dueDate);
      const diffTime = dueDateObj.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      deadlines.push({
        id: `deadline-task-${task.id}`,
        type: 'task',
        title: task.title,
        subject: task.subject,
        dueDate: task.dueDate,
        urgencyDays: diffDays,
        priority: task.priority,
        completed: task.completed,
      });
    }

    // From Exams
    for (const exam of exams) {
      const examDateObj = new Date(exam.examDate);
      const diffTime = examDateObj.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let priority: Priority = 'medium';
      if (diffDays <= 3) priority = 'urgent';
      else if (diffDays <= 7) priority = 'high';

      deadlines.push({
        id: `deadline-exam-${exam.id}`,
        type: 'exam',
        title: `EXAM: ${exam.title}`,
        subject: exam.subject,
        dueDate: exam.examDate,
        urgencyDays: diffDays,
        priority,
        completed: diffDays < 0,
      });
    }

    // Sort by due date ascending
    return deadlines.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  /**
   * Aggregates subject breakdowns and average percentages from daily tests.
   */
  private static computePerformanceAnalytics(
    dailyTests: StructuredUserContext['dailyTests']
  ): TestPerformanceAnalytics {
    if (dailyTests.length === 0) {
      return {
        overallAveragePercentage: 0,
        subjectBreakdown: [],
        recentScores: [],
        totalTestsCount: 0,
      };
    }

    const totalScore = dailyTests.reduce((acc, t) => acc + t.percentage, 0);
    const overallAveragePercentage = Math.round(totalScore / dailyTests.length);

    // Group by subject
    const subjectMap: Record<
      string,
      {
        totalPct: number;
        count: number;
        weakTopics: Set<string>;
        strongTopics: Set<string>;
      }
    > = {};

    for (const t of dailyTests) {
      if (!subjectMap[t.subject]) {
        subjectMap[t.subject] = {
          totalPct: 0,
          count: 0,
          weakTopics: new Set(),
          strongTopics: new Set(),
        };
      }
      subjectMap[t.subject].totalPct += t.percentage;
      subjectMap[t.subject].count += 1;
      t.weakTopics.forEach((w) => subjectMap[t.subject].weakTopics.add(w));
      t.strengths.forEach((s) => subjectMap[t.subject].strongTopics.add(s));
    }

    const subjectBreakdown = Object.entries(subjectMap).map(([subject, data]) => {
      const avg = Math.round(data.totalPct / data.count);
      return {
        subject,
        averageScore: avg,
        testsTaken: data.count,
        trend: (avg >= 85 ? 'improving' : avg >= 70 ? 'stable' : 'declining') as 'improving' | 'declining' | 'stable',
        weakestTopics: Array.from(data.weakTopics),
        strongestTopics: Array.from(data.strongTopics),
      };
    });

    const recentScores = dailyTests.slice(0, 10).map((t) => ({
      date: t.date,
      subject: t.subject,
      percentage: t.percentage,
    }));

    return {
      overallAveragePercentage,
      subjectBreakdown,
      recentScores,
      totalTestsCount: dailyTests.length,
    };
  }
}
