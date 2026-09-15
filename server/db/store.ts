/**
 * Academic Data Store (DAL)
 * Keeps storage & database persistence separate from AI logic and UI.
 */
import {
  Task,
  Goal,
  Exam,
  SchoolScheduleItem,
  DailyTest,
  StudyHistorySession,
  UserPreferences,
  ControlledActionLog
} from '../../src/types/academic.js';

class AcademicDataStore {
  private tasks: Task[] = [];
  private goals: Goal[] = [];
  private exams: Exam[] = [];
  private schedule: SchoolScheduleItem[] = [];
  private dailyTests: DailyTest[] = [];
  private studyHistory: StudyHistorySession[] = [];
  private preferences: UserPreferences = {
    studyPace: 'moderate',
    targetDailyStudyHours: 3.5,
    preferredStudyTimeSlots: ['afternoon', 'evening'],
    weakSubjects: ['Calculus II', 'Organic Chemistry'],
    focusSubjects: ['Calculus II', 'Data Structures', 'Organic Chemistry'],
    learningStyle: 'active_recall',
    advisorPersonality: 'encouraging',
    breakIntervalMinutes: 10,
    focusSessionMinutes: 50,
  };
  private actionLogs: ControlledActionLog[] = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // Initial Tasks
    this.tasks = [
      {
        id: 'task-1',
        title: 'Review Taylor Series & Convergence Tests',
        description: 'Complete problem sets 4.1 through 4.4 in Stewart Calculus.',
        subject: 'Calculus II',
        dueDate: '2026-09-18',
        priority: 'high',
        estimatedMinutes: 90,
        completed: false,
        tags: ['problem-set', 'homework'],
        createdAt: '2026-09-14T08:00:00Z',
      },
      {
        id: 'task-2',
        title: 'Implement Red-Black Tree Balancing in C++',
        description: 'Write insert and fixup routines with rotation test suites.',
        subject: 'Data Structures',
        dueDate: '2026-09-19',
        priority: 'urgent',
        estimatedMinutes: 120,
        completed: false,
        tags: ['coding-lab', 'assignment'],
        createdAt: '2026-09-13T10:30:00Z',
      },
      {
        id: 'task-3',
        title: 'Draft Lab Report: Electrophilic Aromatic Substitution',
        description: 'Include mechanism diagrams, IR spectroscopy tables, and yield calculations.',
        subject: 'Organic Chemistry',
        dueDate: '2026-09-22',
        priority: 'medium',
        estimatedMinutes: 75,
        completed: false,
        tags: ['lab-report'],
        createdAt: '2026-09-14T14:15:00Z',
      },
      {
        id: 'task-4',
        title: 'Read Chapters 8-9: European Diplomatic History 1870-1914',
        description: 'Prepare 5 discussion questions for seminar on Thursday.',
        subject: 'Modern History',
        dueDate: '2026-09-17',
        priority: 'low',
        estimatedMinutes: 60,
        completed: true,
        completedAt: '2026-09-15T09:20:00Z',
        tags: ['reading', 'seminar'],
        createdAt: '2026-09-12T11:00:00Z',
      },
    ];

    // Initial Goals
    this.goals = [
      {
        id: 'goal-1',
        title: 'Score 90%+ on Calculus II Midterm Exam',
        subject: 'Calculus II',
        category: 'exam_prep',
        targetDate: '2026-10-02',
        progressPercentage: 65,
        currentValue: 65,
        targetValue: 100,
        unit: '% syllabus mastered',
        milestones: [
          { id: 'm1', title: 'Finish integration techniques unit', completed: true },
          { id: 'm2', title: 'Complete 3 timed practice midterms', completed: false },
          { id: 'm3', title: 'Attend professor office hours for series convergence', completed: false },
        ],
        notes: 'Need to master alternating series remainder theorem.',
      },
      {
        id: 'goal-2',
        title: 'Complete 100 LeetCode Medium Problems in C++',
        subject: 'Data Structures',
        category: 'skill',
        targetDate: '2026-11-15',
        progressPercentage: 42,
        currentValue: 42,
        targetValue: 100,
        unit: 'problems solved',
        milestones: [
          { id: 'm4', title: '25 Arrays & Hashing', completed: true },
          { id: 'm5', title: '25 Trees & Graphs', completed: true },
          { id: 'm6', title: '25 Dynamic Programming', completed: false },
          { id: 'm7', title: '25 Backtracking & Greedy', completed: false },
        ],
      },
      {
        id: 'goal-3',
        title: 'Maintain 20+ Hours of Weekly Structured Focus Study',
        category: 'habit',
        targetDate: '2026-12-20',
        progressPercentage: 80,
        currentValue: 18.5,
        targetValue: 20,
        unit: 'hours/week',
        milestones: [
          { id: 'm8', title: 'No skipped sessions 3 weeks in a row', completed: true },
          { id: 'm9', title: 'Log all sessions with focus scores > 7/10', completed: false },
        ],
      },
    ];

    // Initial Exams
    this.exams = [
      {
        id: 'exam-1',
        title: 'Calculus II Midterm Exam 1',
        subject: 'Calculus II',
        examDate: '2026-10-02',
        weightPercentage: 25,
        targetScore: 92,
        currentReadinessPercentage: 68,
        topics: ['Trig Substitution', 'Partial Fractions', 'Improper Integrals', 'Sequences & Series'],
        location: 'Hall B - Room 104',
        notes: 'Formula sheet allowed. No graphing calculators.',
      },
      {
        id: 'exam-2',
        title: 'Data Structures Midterm Examination',
        subject: 'Data Structures',
        examDate: '2026-10-08',
        weightPercentage: 30,
        targetScore: 95,
        currentReadinessPercentage: 74,
        topics: ['Big-O Analysis', 'Self-Balancing BSTs', 'Hash Tables with Chaining', 'Graph Traversal'],
        location: 'Turing Computer Lab 3',
      },
      {
        id: 'exam-3',
        title: 'Organic Chemistry Unit 1 Assessment',
        subject: 'Organic Chemistry',
        examDate: '2026-09-28',
        weightPercentage: 20,
        targetScore: 88,
        currentReadinessPercentage: 55,
        topics: ['Stereochemistry (R/S)', 'SN1 vs SN2 Mechanisms', 'E1/E2 Elimination', 'Carbocation Stability'],
        location: 'Curie Science Auditorium',
      },
    ];

    // School Timetable
    this.schedule = [
      {
        id: 'sched-1',
        courseCode: 'MATH 202',
        courseName: 'Calculus II',
        dayOfWeek: 'Monday',
        startTime: '09:00',
        endTime: '10:30',
        instructor: 'Dr. Leonard',
        room: 'Science Complex 210',
        color: '#3b82f6',
      },
      {
        id: 'sched-2',
        courseCode: 'CS 210',
        courseName: 'Data Structures',
        dayOfWeek: 'Monday',
        startTime: '13:00',
        endTime: '14:30',
        instructor: 'Prof. Chen',
        room: 'Tech Hub 102',
        color: '#10b981',
      },
      {
        id: 'sched-3',
        courseCode: 'CHEM 301',
        courseName: 'Organic Chemistry',
        dayOfWeek: 'Tuesday',
        startTime: '10:00',
        endTime: '11:30',
        instructor: 'Dr. Rossi',
        room: 'Bio-Chem 401',
        color: '#f59e0b',
      },
      {
        id: 'sched-4',
        courseCode: 'HIST 120',
        courseName: 'Modern History',
        dayOfWeek: 'Tuesday',
        startTime: '14:00',
        endTime: '15:30',
        instructor: 'Dr. Adams',
        room: 'Humanities Hall 15',
        color: '#8b5cf6',
      },
      {
        id: 'sched-5',
        courseCode: 'MATH 202',
        courseName: 'Calculus II',
        dayOfWeek: 'Wednesday',
        startTime: '09:00',
        endTime: '10:30',
        instructor: 'Dr. Leonard',
        room: 'Science Complex 210',
        color: '#3b82f6',
      },
      {
        id: 'sched-6',
        courseCode: 'CS 210',
        courseName: 'Data Structures',
        dayOfWeek: 'Wednesday',
        startTime: '13:00',
        endTime: '14:30',
        instructor: 'Prof. Chen',
        room: 'Tech Hub 102',
        color: '#10b981',
      },
      {
        id: 'sched-7',
        courseCode: 'CHEM 301 Lab',
        courseName: 'Organic Chemistry Lab',
        dayOfWeek: 'Thursday',
        startTime: '13:00',
        endTime: '16:00',
        instructor: 'Dr. Rossi & TAs',
        room: 'Wet Lab 3B',
        color: '#f59e0b',
      },
    ];

    // Daily Tests & Quizzes
    this.dailyTests = [
      {
        id: 'test-1',
        date: '2026-09-14',
        subject: 'Calculus II',
        title: 'Daily Micro-Quiz: Integration by Parts',
        score: 9,
        totalQuestions: 10,
        percentage: 90,
        timeSpentMinutes: 15,
        strengths: ['Standard polynomial x exp integral', 'Tabular method'],
        weakTopics: ['Inverse trig integration by parts'],
        reflections: 'Fast solving time, need to review arctan integrals.',
      },
      {
        id: 'test-2',
        date: '2026-09-13',
        subject: 'Organic Chemistry',
        title: 'Reaction Mechanism Check: SN1 vs SN2',
        score: 7,
        totalQuestions: 10,
        percentage: 70,
        timeSpentMinutes: 20,
        strengths: ['Solvent effects', 'Leaving group trends'],
        weakTopics: ['Carbocation rearrangement', 'Steric hindrance in secondary alkyl halides'],
        reflections: 'Confused hydride shift with methyl shift on problem 8.',
      },
      {
        id: 'test-3',
        date: '2026-09-12',
        subject: 'Data Structures',
        title: 'Binary Tree Traversal Speed Quiz',
        score: 10,
        totalQuestions: 10,
        percentage: 100,
        timeSpentMinutes: 12,
        strengths: ['Iterative in-order using stack', 'Level-order BFS queue'],
        weakTopics: [],
        reflections: 'Mastered this chapter thoroughly.',
      },
      {
        id: 'test-4',
        date: '2026-09-10',
        subject: 'Calculus II',
        title: 'Trigonometric Substitution Drill',
        score: 8,
        totalQuestions: 10,
        percentage: 80,
        timeSpentMinutes: 25,
        strengths: ['x = a tan(theta) substitutions'],
        weakTopics: ['Secant substitution triangle back-conversion'],
      },
    ];

    // Study History Log
    this.studyHistory = [
      {
        id: 'hist-1',
        date: '2026-09-14',
        startTime: '16:00',
        durationMinutes: 90,
        subject: 'Calculus II',
        focusScore: 8,
        topicsCovered: ['Improper integrals', 'Comparison theorem'],
        notes: 'Solid session. Finished 12 textbook exercises without phone distraction.',
      },
      {
        id: 'hist-2',
        date: '2026-09-14',
        startTime: '19:30',
        durationMinutes: 75,
        subject: 'Data Structures',
        focusScore: 9,
        topicsCovered: ['Binary search trees', 'Tree height balancing'],
        notes: 'Implemented AVL tree rotations successfully.',
      },
      {
        id: 'hist-3',
        date: '2026-09-13',
        startTime: '15:00',
        durationMinutes: 60,
        subject: 'Organic Chemistry',
        focusScore: 6,
        topicsCovered: ['Nucleophiles & electrophiles', 'Zaitsev vs Hofmann elimination'],
        notes: 'Felt tired during the second half. Need more active recall flashcards.',
      },
      {
        id: 'hist-4',
        date: '2026-09-12',
        startTime: '17:00',
        durationMinutes: 105,
        subject: 'Modern History',
        focusScore: 8,
        topicsCovered: ['Alliances in late 19th-century Europe', 'Balkan crises'],
        notes: 'Annotated source documents and compiled timeline.',
      },
    ];

    // Seed initial action log indicating setup
    this.actionLogs.push({
      id: 'log-init',
      timestamp: new Date().toISOString(),
      actionName: 'system_bootstrap',
      parameters: { status: 'ready_for_advisor_service' },
      status: 'success',
      message: 'StudyAdvisor context and action store initialized with structured schema.',
    });
  }

  // --- Tasks API ---
  getTasks(): Task[] {
    return [...this.tasks];
  }

  getTask(id: string): Task | undefined {
    return this.tasks.find((t) => t.id === id);
  }

  createTask(taskData: Omit<Task, 'id' | 'createdAt'>): Task {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.tasks.push(newTask);
    return newTask;
  }

  updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): Task | null {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;
    this.tasks[index] = { ...this.tasks[index], ...updates };
    return this.tasks[index];
  }

  deleteTask(id: string): boolean {
    const initialLen = this.tasks.length;
    this.tasks = this.tasks.filter((t) => t.id !== id);
    return this.tasks.length < initialLen;
  }

  // --- Goals API ---
  getGoals(): Goal[] {
    return [...this.goals];
  }

  createGoal(goalData: Omit<Goal, 'id'>): Goal {
    const newGoal: Goal = {
      ...goalData,
      id: `goal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    this.goals.push(newGoal);
    return newGoal;
  }

  updateGoal(id: string, updates: Partial<Omit<Goal, 'id'>>): Goal | null {
    const index = this.goals.findIndex((g) => g.id === id);
    if (index === -1) return null;
    this.goals[index] = { ...this.goals[index], ...updates };
    return this.goals[index];
  }

  // --- Exams API ---
  getExams(): Exam[] {
    return [...this.exams];
  }

  createExam(examData: Omit<Exam, 'id'>): Exam {
    const newExam: Exam = {
      ...examData,
      id: `exam-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    this.exams.push(newExam);
    return newExam;
  }

  updateExam(id: string, updates: Partial<Omit<Exam, 'id'>>): Exam | null {
    const index = this.exams.findIndex((e) => e.id === id);
    if (index === -1) return null;
    this.exams[index] = { ...this.exams[index], ...updates };
    return this.exams[index];
  }

  // --- Schedule API ---
  getSchedule(): SchoolScheduleItem[] {
    return [...this.schedule];
  }

  createScheduleItem(itemData: Omit<SchoolScheduleItem, 'id'>): SchoolScheduleItem {
    const newItem: SchoolScheduleItem = {
      ...itemData,
      id: `sched-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    this.schedule.push(newItem);
    return newItem;
  }

  // --- Daily Tests API ---
  getDailyTests(): DailyTest[] {
    return [...this.dailyTests];
  }

  recordDailyTest(testData: Omit<DailyTest, 'id'>): DailyTest {
    const newTest: DailyTest = {
      ...testData,
      id: `test-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    this.dailyTests.unshift(newTest);
    return newTest;
  }

  // --- Study History API ---
  getStudyHistory(): StudyHistorySession[] {
    return [...this.studyHistory];
  }

  logStudySession(sessionData: Omit<StudyHistorySession, 'id'>): StudyHistorySession {
    const newSession: StudyHistorySession = {
      ...sessionData,
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    this.studyHistory.unshift(newSession);
    return newSession;
  }

  // --- Preferences API ---
  getPreferences(): UserPreferences {
    return { ...this.preferences };
  }

  updatePreferences(updates: Partial<UserPreferences>): UserPreferences {
    this.preferences = { ...this.preferences, ...updates };
    return { ...this.preferences };
  }

  // --- Controlled Actions Audit Logging ---
  getActionLogs(): ControlledActionLog[] {
    return [...this.actionLogs];
  }

  recordActionLog(log: Omit<ControlledActionLog, 'id' | 'timestamp'>): ControlledActionLog {
    const entry: ControlledActionLog = {
      ...log,
      id: `action-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.actionLogs.unshift(entry);
    return entry;
  }
}

// Export singleton instance for the server runtime
export const academicStore = new AcademicDataStore();
