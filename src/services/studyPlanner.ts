/**
 * Core Study Planning Engine for StudyMate
 * Reusable planning, rescheduling, and diagnostic logic.
 * Adheres to:
 * - Smart task redistribution (never bulk-dumping missed tasks onto tomorrow)
 * - School schedule awareness (school periods reduce available private study hours)
 * - Iranian Konkur & Final Exam subject priorities
 * - Natural language assignment extraction
 */

import {
  Task,
  TaskPriority,
  Goal,
  Exam,
  SchoolClass,
  DailyTestItem,
  StudyHistoryItem,
  UserPreferences,
  DayOfWeek,
  TestType,
} from '../types/studymate';

export interface ReschedulingPlanItem {
  taskId: string;
  taskTitle: string;
  subject: string;
  oldDueDate: string;
  newDueDate: string;
  priority: TaskPriority;
  estimatedMinutes: number;
  reason: string;
}

export interface SmartReschedulingResult {
  rescheduledCount: number;
  unresolvedCount: number;
  totalEstimatedMinutes: number;
  plan: ReschedulingPlanItem[];
  explanation: string;
}

export interface DayStudyCapacity {
  date: string;
  dayOfWeek: DayOfWeek;
  dayOfWeekPersian: string;
  isHolidayOrWeekend: boolean;
  schoolPeriodsCount: number;
  schoolMinutes: number;
  maxRecommendedStudyMinutes: number;
  alreadyPlannedMinutes: number;
  availableRemainingMinutes: number;
}

export interface ExtractedAssignment {
  subject: string;
  title: string;
  taskType: 'study' | 'tests' | 'exercises' | 'exam_prep';
  questionCount?: number;
  dueDate: string;
  dueDateLabel: string;
  estimatedMinutes: number;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  notes?: string;
  isDuplicate: boolean;
  existingTaskId?: string;
}

export interface AssignmentExtractionResult {
  assignments: ExtractedAssignment[];
  duplicatesCount: number;
  newAssignmentsCount: number;
  summaryPersian: string;
}

export interface ComprehensiveAnalysis {
  studyTime: {
    todayMinutes: number;
    weeklyMinutes: number;
    targetWeeklyHours: number;
    weeklyProgressPercent: number;
    dailyAveragesMinutes: number;
  };
  tasks: {
    total: number;
    completed: number;
    missed: number;
    inProgress: number;
    completionRate: number;
    missedTasksList: Task[];
  };
  tests: {
    totalTests: number;
    totalQuestions: number;
    totalCorrect: number;
    totalWrong: number;
    totalUnanswered: number;
    averagePercentage: number; // Konkur standard score
    averageAccuracy: number; // raw accuracy
    byType: Record<TestType, { count: number; questions: number; avgScore: number }>;
  };
  strengths: {
    subject: string;
    scoreText: string;
    details: string;
  }[];
  weaknesses: {
    subject: string;
    issueText: string;
    suggestedFix: string;
  }[];
  recommendations: string[];
}

// Persian day helpers
export const PERSIAN_DAY_MAP: Record<number, { day: DayOfWeek; name: string; isHoliday: boolean }> = {
  0: { day: 'sunday', name: 'یک‌شنبه', isHoliday: false },
  1: { day: 'monday', name: 'دوشنبه', isHoliday: false },
  2: { day: 'tuesday', name: 'سه‌شنبه', isHoliday: false },
  3: { day: 'wednesday', name: 'چهارشنبه', isHoliday: false },
  4: { day: 'thursday', name: 'پنج‌شنبه', isHoliday: false }, // half-day or study day in Iran
  5: { day: 'friday', name: 'جمعه', isHoliday: true }, // Official weekend in Iran
  6: { day: 'saturday', name: 'شنبه', isHoliday: false },
};

export const KONKUR_11TH_MATH_SUBJECTS = [
  'حسابان ۱',
  'هندسه ۲',
  'فیزیک ۲',
  'شیمی ۲',
  'آمار و احتمال',
  'فارسی ۲',
  'عربی ۲',
  'زبان انگلیسی ۲',
  'دین و زندگی ۲',
  'زمین‌شناسی',
];

/**
 * Detect all tasks that are past their due date and not completed
 */
export function detectMissedTasks(tasks: Task[], referenceDateStr?: string): Task[] {
  const today = referenceDateStr || new Date().toISOString().split('T')[0];
  return tasks.filter((t) => !t.completed && t.dueDate < today);
}

/**
 * Calculate available study time for a specific date considering school hours and existing tasks
 */
export function calculateAvailableStudyTimeForDate(
  dateStr: string,
  schoolSchedule: SchoolClass[],
  existingTasks: Task[],
  preferences?: UserPreferences
): DayStudyCapacity {
  const targetDate = new Date(dateStr);
  const dayIndex = targetDate.getDay();
  const dayInfo = PERSIAN_DAY_MAP[dayIndex] || { day: 'saturday', name: 'شنبه', isHoliday: false };

  // Count school periods for this day of week
  const classesOnThisDay = schoolSchedule.filter((c) => c.dayOfWeek === dayInfo.day);
  const schoolPeriodsCount = classesOnThisDay.length;
  const schoolMinutes = schoolPeriodsCount * 85; // Average ~85 min class period + commute

  // Maximum safe study limit without student burnout
  let maxRecommendedStudyMinutes = 390; // ~6.5 hours default for high-school
  if (dayInfo.isHoliday) {
    maxRecommendedStudyMinutes = 540; // ~9 hours on Friday
  } else if (dayInfo.day === 'thursday') {
    maxRecommendedStudyMinutes = 480; // ~8 hours on Thursday
  } else if (schoolPeriodsCount >= 3) {
    maxRecommendedStudyMinutes = 330; // ~5.5 hours on heavy school days
  }

  // Calculate study minutes already occupied by tasks due on this date
  const tasksForThisDay = existingTasks.filter((t) => t.dueDate === dateStr && !t.completed);
  const alreadyPlannedMinutes = tasksForThisDay.reduce(
    (acc, curr) => acc + (curr.estimatedMinutes || 45),
    0
  );

  const availableRemainingMinutes = Math.max(0, maxRecommendedStudyMinutes - alreadyPlannedMinutes);

  return {
    date: dateStr,
    dayOfWeek: dayInfo.day,
    dayOfWeekPersian: dayInfo.name,
    isHolidayOrWeekend: dayInfo.isHoliday,
    schoolPeriodsCount,
    schoolMinutes,
    maxRecommendedStudyMinutes,
    alreadyPlannedMinutes,
    availableRemainingMinutes,
  };
}

/**
 * Intelligently reschedule missed tasks.
 * RULE: DO NOT move everything to tomorrow!
 * Distribute across the next 2-5 days according to capacity and priority.
 */
export function smartRescheduleMissedTasks(
  missedTasks: Task[],
  allTasks: Task[],
  schoolSchedule: SchoolClass[],
  preferences?: UserPreferences,
  referenceDateStr?: string
): SmartReschedulingResult {
  if (missedTasks.length === 0) {
    return {
      rescheduledCount: 0,
      unresolvedCount: 0,
      totalEstimatedMinutes: 0,
      plan: [],
      explanation: 'هیچ تسک عقب‌افتاده‌ای وجود ندارد. برنامه شما منظم و به‌روز است.',
    };
  }

  const today = referenceDateStr || new Date().toISOString().split('T')[0];
  const todayDate = new Date(today);

  // Sort missed tasks: urgent first, then high, then medium, then low
  const priorityWeight: Record<string, number> = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  const sortedMissed = [...missedTasks].sort((a, b) => {
    const pwA = priorityWeight[a.priority] || 1;
    const pwB = priorityWeight[b.priority] || 1;
    return pwB - pwA;
  });

  // Prepare capacities for the next 5 days
  const futureDays: DayStudyCapacity[] = [];
  for (let i = 1; i <= 5; i++) {
    const nextDate = new Date(todayDate);
    nextDate.setDate(todayDate.getDate() + i);
    const dateStr = nextDate.toISOString().split('T')[0];
    const capacity = calculateAvailableStudyTimeForDate(
      dateStr,
      schoolSchedule,
      allTasks,
      preferences
    );
    futureDays.push(capacity);
  }

  const plan: ReschedulingPlanItem[] = [];
  let totalMinutes = 0;
  let unresolvedCount = 0;

  for (const task of sortedMissed) {
    const taskMinutes = task.estimatedMinutes || 45;
    totalMinutes += taskMinutes;

    // Find the best day that has remaining capacity
    // Urgent tasks aim for Day 1 or Day 2
    // Lower priority tasks can be placed on Day 3, 4, or 5 (weekend/light days)
    let assignedDay: DayStudyCapacity | null = null;

    if (task.priority === 'urgent' || task.priority === 'high') {
      assignedDay = futureDays.find((d) => d.availableRemainingMinutes >= taskMinutes) || futureDays[0];
    } else {
      // Find the least loaded day among days 2..5
      const candidateDays = futureDays.slice(1);
      candidateDays.sort((a, b) => b.availableRemainingMinutes - a.availableRemainingMinutes);
      assignedDay = candidateDays[0] || futureDays[futureDays.length - 1];
    }

    if (assignedDay) {
      assignedDay.availableRemainingMinutes = Math.max(
        0,
        assignedDay.availableRemainingMinutes - taskMinutes
      );
      assignedDay.alreadyPlannedMinutes += taskMinutes;

      plan.push({
        taskId: task.id,
        taskTitle: task.title,
        subject: task.subject,
        oldDueDate: task.dueDate,
        newDueDate: assignedDay.date,
        priority: task.priority,
        estimatedMinutes: taskMinutes,
        reason:
          task.priority === 'urgent'
            ? `اولویت بالا: قرارگیری در اولین بازه خالی (${assignedDay.dayOfWeekPersian})`
            : `توزیع متعادل جهت جلوگیری از انباشتگی (${assignedDay.dayOfWeekPersian})`,
      });
    } else {
      unresolvedCount++;
    }
  }

  const explanation = `برنامه‌ریزی هوشمند: ${plan.length} تسک عقب‌افتاده به جای انتقال یکجا به فردا، در بازه ۵ روز آینده و با توجه به ساعات مدرسه توزیع شدند.`;

  return {
    rescheduledCount: plan.length,
    unresolvedCount,
    totalEstimatedMinutes: totalMinutes,
    plan,
    explanation,
  };
}

/**
 * Natural language parser for school assignments
 * Understands sentences like:
 * "امروز مدرسه گفت فصل ۳ فیزیک رو بخونم، ۲۰ تست ریاضی بزنم و برای پنجشنبه شیمی آماده بشم."
 */
export function extractSchoolAssignments(
  userText: string,
  existingTasks: Task[],
  todayStr?: string
): AssignmentExtractionResult {
  const today = todayStr || new Date().toISOString().split('T')[0];
  const todayDate = new Date(today);

  // Helper date calculators
  const tomorrow = new Date(todayDate);
  tomorrow.setDate(todayDate.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const dayAfter = new Date(todayDate);
  dayAfter.setDate(todayDate.getDate() + 2);
  const dayAfterStr = dayAfter.toISOString().split('T')[0];

  // Subject detectors
  const subjectMatchers: { pattern: RegExp; subject: string }[] = [
    { pattern: /حسابان|حساب|ریاضیات|ریاضی/i, subject: 'حسابان ۱' },
    { pattern: /هندسه/i, subject: 'هندسه ۲' },
    { pattern: /فیزیک/i, subject: 'فیزیک ۲' },
    { pattern: /شیمی/i, subject: 'شیمی ۲' },
    { pattern: /آمار|احتمال/i, subject: 'آمار و احتمال' },
    { pattern: /فارسی|ادبیات/i, subject: 'فارسی ۲' },
    { pattern: /عربی/i, subject: 'عربی ۲' },
    { pattern: /دینی|دین و زندگی/i, subject: 'دین و زندگی ۲' },
    { pattern: /زبان|انگلیسی/i, subject: 'زبان انگلیسی ۲' },
    { pattern: /زمین|زمین‌شناسی/i, subject: 'زمین‌شناسی' },
  ];

  // Split text by commas, 'و', semicolons, newlines
  const segments = userText
    .split(/[\n،,;]|\s+و\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);

  const assignments: ExtractedAssignment[] = [];
  let duplicatesCount = 0;

  for (const segment of segments) {
    // Find subject
    const matchedSubject = subjectMatchers.find((m) => m.pattern.test(segment));
    if (!matchedSubject) continue;

    // Detect question count (e.g., ۲۰ تست, 20 تست)
    const testMatch = segment.match(/([۰-۹0-9]+)\s*تست/);
    let questionCount: number | undefined;
    let taskType: ExtractedAssignment['taskType'] = 'study';

    if (testMatch) {
      taskType = 'tests';
      // Convert Persian digits if needed
      const rawNum = testMatch[1].replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
      questionCount = parseInt(rawNum, 10) || 20;
    } else if (/تمرین|حل سوال|تکلیف|مسائل/i.test(segment)) {
      taskType = 'exercises';
    } else if (/امتحان|آزمونک|پرسش/i.test(segment)) {
      taskType = 'exam_prep';
    }

    // Detect target deadline
    let targetDueDate = tomorrowStr;
    let dueDateLabel = 'فردا';

    if (/امروز/i.test(segment)) {
      targetDueDate = today;
      dueDateLabel = 'امروز';
    } else if (/پس‌فردا|پس فردا/i.test(segment)) {
      targetDueDate = dayAfterStr;
      dueDateLabel = 'پس‌فردا';
    } else if (/پنجشنبه|پنج‌شنبه/i.test(segment)) {
      // Find upcoming Thursday
      const daysUntilThu = (4 - todayDate.getDay() + 7) % 7 || 7;
      const thuDate = new Date(todayDate);
      thuDate.setDate(todayDate.getDate() + daysUntilThu);
      targetDueDate = thuDate.toISOString().split('T')[0];
      dueDateLabel = 'پنج‌شنبه';
    } else if (/شنبه/i.test(segment)) {
      const daysUntilSat = (6 - todayDate.getDay() + 7) % 7 || 7;
      const satDate = new Date(todayDate);
      satDate.setDate(todayDate.getDate() + daysUntilSat);
      targetDueDate = satDate.toISOString().split('T')[0];
      dueDateLabel = 'شنبه آینده';
    }

    // Determine estimated duration
    let estimatedMinutes = 50;
    if (questionCount) {
      estimatedMinutes = Math.min(120, Math.max(30, Math.round(questionCount * 2.2)));
    } else if (taskType === 'study') {
      estimatedMinutes = 60;
    } else if (taskType === 'exercises') {
      estimatedMinutes = 45;
    }

    // Create title
    let title = segment;
    if (!title.startsWith('مطالعه') && !title.startsWith('حل') && !title.startsWith('تکلیف')) {
      if (taskType === 'tests' && questionCount) {
        title = `حل ${questionCount} تست ${matchedSubject.subject} (${segment})`;
      } else if (taskType === 'exercises') {
        title = `تکلیف و تمرین ${matchedSubject.subject}: ${segment}`;
      } else {
        title = `مطالعه ${matchedSubject.subject}: ${segment}`;
      }
    }

    // Check for duplicate in existing tasks
    const existing = existingTasks.find(
      (t) =>
        t.subject === matchedSubject.subject &&
        (t.title.includes(segment) || segment.includes(t.title) || (t.dueDate === targetDueDate && t.title.includes(matchedSubject.subject)))
    );

    const isDuplicate = !!existing;
    if (isDuplicate) {
      duplicatesCount++;
    }

    assignments.push({
      subject: matchedSubject.subject,
      title: title.trim(),
      taskType,
      questionCount,
      dueDate: targetDueDate,
      dueDateLabel,
      estimatedMinutes,
      priority: taskType === 'exam_prep' ? 'urgent' : 'high',
      notes: `ثبت شده بر اساس تکالیف مدرسه (${segment})`,
      isDuplicate,
      existingTaskId: existing?.id,
    });
  }

  const newAssignmentsCount = assignments.filter((a) => !a.isDuplicate).length;

  let summaryPersian = '';
  if (assignments.length === 0) {
    summaryPersian = 'موردی از تکالیف مدرسه یا نام درس شناسایی نشد. لطفاً نام درس و موضوع را مشخص‌تر بیان کنید.';
  } else {
    summaryPersian = `تعداد ${assignments.length} تکلیف شناسایی شد (${newAssignmentsCount} مورد جدید، ${duplicatesCount} مورد تکراری یا مشابه).`;
  }

  return {
    assignments,
    duplicatesCount,
    newAssignmentsCount,
    summaryPersian,
  };
}

/**
 * Calculate comprehensive analysis for the student's study metrics
 */
export function calculateComprehensiveAnalysis(
  tasks: Task[],
  dailyTests: DailyTestItem[],
  studyHistory: StudyHistoryItem[],
  preferences?: UserPreferences
): ComprehensiveAnalysis {
  const today = new Date().toISOString().split('T')[0];

  // 1. Task calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed);
  const missedTasksList = detectMissedTasks(tasks, today);
  const inProgressTasks = tasks.filter((t) => !t.completed && t.dueDate >= today);
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // 2. Study time calculations
  const completedMinutes = completedTasks.reduce((acc, curr) => acc + (curr.estimatedMinutes || 45), 0);
  const weeklyStudyHistoryMinutes = studyHistory.reduce((acc, curr) => acc + (curr.totalMinutes || 0), 0);
  const weeklyTotalMinutes = Math.max(completedMinutes, weeklyStudyHistoryMinutes);

  const targetWeeklyHours = preferences?.dailyGoalMinutes
    ? Math.round((preferences.dailyGoalMinutes * 6.5) / 60)
    : 45;
  const weeklyProgressPercent = Math.min(100, Math.round((weeklyTotalMinutes / 60 / targetWeeklyHours) * 100));

  // 3. Test metrics
  const completedTests = dailyTests.filter((t) => t.completed);
  const totalTests = completedTests.length;
  let totalQuestions = 0;
  let totalCorrect = 0;
  let totalWrong = 0;
  let totalUnanswered = 0;
  let sumPercentage = 0;
  let sumAccuracy = 0;

  const byType: Record<TestType, { count: number; questions: number; avgScore: number }> = {
    educational: { count: 0, questions: 0, avgScore: 0 },
    consolidating: { count: 0, questions: 0, avgScore: 0 },
    timed: { count: 0, questions: 0, avgScore: 0 },
    review: { count: 0, questions: 0, avgScore: 0 },
    mock: { count: 0, questions: 0, avgScore: 0 },
  };

  // Group by subject for strengths & weaknesses
  const subjectScores: Record<string, { totalQ: number; correct: number; wrong: number; scores: number[] }> = {};

  for (const test of completedTests) {
    const q = test.numberOfQuestions || 0;
    const c = test.correctCount || 0;
    const w = test.wrongCount || 0;
    const u = test.unansweredCount !== undefined ? test.unansweredCount : Math.max(0, q - c - w);

    totalQuestions += q;
    totalCorrect += c;
    totalWrong += w;
    totalUnanswered += u;

    // Standard Iranian Konkur score: (3*c - w) / (3*q) * 100
    const testScore = test.percentage !== undefined ? test.percentage : q > 0 ? ((3 * c - w) / (3 * q)) * 100 : 0;
    const testAccuracy = test.accuracy !== undefined ? test.accuracy : c + w > 0 ? (c / (c + w)) * 100 : 0;

    sumPercentage += testScore;
    sumAccuracy += testAccuracy;

    // Type tracking
    const type = test.testType || 'consolidating';
    if (byType[type]) {
      byType[type].count += 1;
      byType[type].questions += q;
      byType[type].avgScore += testScore;
    }

    // Subject tracking
    if (!subjectScores[test.subject]) {
      subjectScores[test.subject] = { totalQ: 0, correct: 0, wrong: 0, scores: [] };
    }
    subjectScores[test.subject].totalQ += q;
    subjectScores[test.subject].correct += c;
    subjectScores[test.subject].wrong += w;
    subjectScores[test.subject].scores.push(testScore);
  }

  const averagePercentage = totalTests > 0 ? Math.round(sumPercentage / totalTests) : 0;
  const averageAccuracy = totalTests > 0 ? Math.round(sumAccuracy / totalTests) : 0;

  // Finalize type averages
  (Object.keys(byType) as TestType[]).forEach((t) => {
    if (byType[t].count > 0) {
      byType[t].avgScore = Math.round(byType[t].avgScore / byType[t].count);
    }
  });

  // 4. Strengths & Weaknesses
  const strengths: ComprehensiveAnalysis['strengths'] = [];
  const weaknesses: ComprehensiveAnalysis['weaknesses'] = [];

  Object.entries(subjectScores).forEach(([subject, data]) => {
    const avgScore = Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length);
    if (avgScore >= 68) {
      strengths.push({
        subject,
        scoreText: `میانگین تراز/درصد: ${avgScore}٪`,
        details: `تسلط مطلوب با ${data.totalQ} تست و دقت پاسخگویی پایدار`,
      });
    } else if (avgScore < 50 || data.wrong > data.correct) {
      weaknesses.push({
        subject,
        issueText: `درصد پایین (${avgScore}٪) و تعداد پاسخ‌های غلط بالا (${data.wrong} غلط)`,
        suggestedFix: `نیاز به تست‌های آموزشی بدون زمان‌گیری و مرور مباحث پایه کتاب درسی`,
      });
    }
  });

  // If no tests recorded yet, supply default insights based on 11th Math curriculum
  if (strengths.length === 0) {
    strengths.push({
      subject: 'حسابان و فیزیک پایه',
      scoreText: 'روند صعودی در تمرین‌های تشریحی',
      details: 'پیوستگی مناسب در حل تمرینات هفتگی',
    });
  }

  if (weaknesses.length === 0 && missedTasksList.length > 0) {
    weaknesses.push({
      subject: 'مدیریت زمان و تسک‌های معوق',
      issueText: `${missedTasksList.length} تسک عقب‌افتاده در برنامه`,
      suggestedFix: 'استفاده از بازتوزیع هوشمند جهت جبران بدون فشار اضافه به فردا',
    });
  }

  // 5. Strategic Recommendations
  const recommendations: string[] = [];
  if (missedTasksList.length > 2) {
    recommendations.push(
      'از انباشت تسک‌های معوق روی یک روز خودداری کنید؛ تسک‌ها را با دکمه بازتوزیع هوشمند در طول هفته پخش کنید.'
    );
  }
  if (byType.timed.count < 2 && totalTests > 3) {
    recommendations.push(
      'برای شبیه‌سازی شرایط کنکور و آزمون‌های آزمایشی، سهم تست‌های «زمان‌دار» را در دروس حسابان و شیمی افزایش دهید.'
    );
  }
  if (completionRate < 60) {
    recommendations.push(
      'حجم پارت‌های مطالعاتی را به بخش‌های ۴۵ تا ۶۰ دقیقه‌ای با فواصل استراحت ۱۰ دقیقه‌ای کاهش دهید.'
    );
  } else {
    recommendations.push(
      'عملکرد هفتگی شما در مسیر هدف است. روی تست‌های مروری برای تثبیت حافظه بلندمدت تمرکز کنید.'
    );
  }

  return {
    studyTime: {
      todayMinutes: completedMinutes,
      weeklyMinutes: weeklyTotalMinutes,
      targetWeeklyHours,
      weeklyProgressPercent,
      dailyAveragesMinutes: Math.round(weeklyTotalMinutes / 7),
    },
    tasks: {
      total: totalTasks,
      completed: completedTasks.length,
      missed: missedTasksList.length,
      inProgress: inProgressTasks.length,
      completionRate,
      missedTasksList,
    },
    tests: {
      totalTests,
      totalQuestions,
      totalCorrect,
      totalWrong,
      totalUnanswered,
      averagePercentage,
      averageAccuracy,
      byType,
    },
    strengths,
    weaknesses,
    recommendations,
  };
}
