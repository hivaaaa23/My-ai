/**
 * Gemini Function Declaration Schemas for Personal Study Advisor
 * Formatted cleanly according to @google/genai FunctionDeclaration specifications.
 *
 * When Gemini is connected, these schemas can be passed directly to the model configuration:
 * tools: [{ functionDeclarations: STUDY_ADVISOR_GEMINI_TOOLS }]
 */

export interface AdvisorToolDeclaration {
  name: string;
  description: string;
  parameters: {
    type: 'OBJECT';
    properties: Record<string, {
      type: 'STRING' | 'NUMBER' | 'INTEGER' | 'BOOLEAN' | 'ARRAY' | 'OBJECT';
      description: string;
      enum?: string[];
      items?: {
        type: 'STRING' | 'NUMBER' | 'INTEGER' | 'OBJECT';
        properties?: Record<string, unknown>;
      };
    }>;
    required: string[];
  };
}

export const STUDY_ADVISOR_GEMINI_TOOLS: AdvisorToolDeclaration[] = [
  {
    name: 'create_study_task',
    description: 'Creates a new actionable study task or homework item with estimated duration and priority.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: {
          type: 'STRING',
          description: 'Concise title of the academic task, e.g. "Review Chapter 4 Series Convergence".',
        },
        subject: {
          type: 'STRING',
          description: 'Course or subject name, e.g. "Calculus II", "Data Structures", "Organic Chemistry".',
        },
        dueDate: {
          type: 'STRING',
          description: 'Target completion date in YYYY-MM-DD format.',
        },
        priority: {
          type: 'STRING',
          enum: ['low', 'medium', 'high', 'urgent'],
          description: 'Urgency and impact of the task.',
        },
        estimatedMinutes: {
          type: 'INTEGER',
          description: 'Estimated focus study time required in minutes.',
        },
        description: {
          type: 'STRING',
          description: 'Specific learning objectives, textbook sections, or exercises.',
        },
        tags: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: 'Tags for categorization (e.g. ["problem-set", "revision"]).',
        },
      },
      required: ['title', 'subject', 'dueDate', 'priority', 'estimatedMinutes'],
    },
  },
  {
    name: 'reschedule_task',
    description: 'Updates the due date or priority of an existing task based on workload balance or deadline shifts.',
    parameters: {
      type: 'OBJECT',
      properties: {
        taskId: {
          type: 'STRING',
          description: 'The unique ID of the task to reschedule.',
        },
        newDueDate: {
          type: 'STRING',
          description: 'The new due date in YYYY-MM-DD format.',
        },
        newPriority: {
          type: 'STRING',
          enum: ['low', 'medium', 'high', 'urgent'],
          description: 'Updated priority level if changed.',
        },
        reason: {
          type: 'STRING',
          description: 'Pedagogical justification for rescheduling (e.g. "To avoid conflict with Chemistry lab").',
        },
      },
      required: ['taskId', 'newDueDate', 'reason'],
    },
  },
  {
    name: 'create_academic_goal',
    description: 'Sets a new measurable academic target, exam preparation milestone, or study habit goal.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: {
          type: 'STRING',
          description: 'Clear statement of the goal.',
        },
        category: {
          type: 'STRING',
          enum: ['academic', 'exam_prep', 'habit', 'skill'],
          description: 'Goal category.',
        },
        subject: {
          type: 'STRING',
          description: 'Associated subject if applicable.',
        },
        targetDate: {
          type: 'STRING',
          description: 'Target completion date in YYYY-MM-DD format.',
        },
        targetValue: {
          type: 'NUMBER',
          description: 'Target quantitative metric (e.g. 100).',
        },
        unit: {
          type: 'STRING',
          description: 'Unit of measurement (e.g. "% readiness", "problems solved", "hours").',
        },
        initialMilestones: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: 'Breakdown sub-milestone titles.',
        },
      },
      required: ['title', 'category', 'targetDate', 'targetValue', 'unit'],
    },
  },
  {
    name: 'update_goal_progress',
    description: 'Updates progress percentage or milestone completion on a student goal.',
    parameters: {
      type: 'OBJECT',
      properties: {
        goalId: {
          type: 'STRING',
          description: 'The ID of the goal to update.',
        },
        newCurrentValue: {
          type: 'NUMBER',
          description: 'The new numerical value achieved.',
        },
        completedMilestoneIndex: {
          type: 'INTEGER',
          description: 'Optional 0-indexed milestone number to mark completed.',
        },
        progressNotes: {
          type: 'STRING',
          description: 'Encouraging advisor feedback or progress notation.',
        },
      },
      required: ['goalId', 'newCurrentValue'],
    },
  },
  {
    name: 'log_study_session',
    description: 'Records a completed study session in the study history with duration and focus rating.',
    parameters: {
      type: 'OBJECT',
      properties: {
        subject: {
          type: 'STRING',
          description: 'Course or subject studied.',
        },
        durationMinutes: {
          type: 'INTEGER',
          description: 'Session duration in minutes.',
        },
        focusScore: {
          type: 'INTEGER',
          description: 'Rating of focus quality from 1 (distracted) to 10 (flow state).',
        },
        topicsCovered: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: 'List of concepts reviewed.',
        },
        notes: {
          type: 'STRING',
          description: 'Reflection on session efficacy.',
        },
      },
      required: ['subject', 'durationMinutes', 'focusScore', 'topicsCovered'],
    },
  },
  {
    name: 'record_daily_test_result',
    description: 'Logs results from a self-assessment quiz or practice exam with weak topic tags.',
    parameters: {
      type: 'OBJECT',
      properties: {
        subject: {
          type: 'STRING',
          description: 'Subject name.',
        },
        title: {
          type: 'STRING',
          description: 'Quiz or test title.',
        },
        score: {
          type: 'NUMBER',
          description: 'Number of correct answers.',
        },
        totalQuestions: {
          type: 'INTEGER',
          description: 'Total questions on the quiz.',
        },
        timeSpentMinutes: {
          type: 'INTEGER',
          description: 'Time taken to complete the test.',
        },
        weakTopics: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: 'Identified concepts requiring remediation.',
        },
        strengths: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: 'Concepts mastered.',
        },
        reflections: {
          type: 'STRING',
          description: 'Advisor or student note on errors.',
        },
      },
      required: ['subject', 'title', 'score', 'totalQuestions', 'timeSpentMinutes'],
    },
  },
  {
    name: 'update_study_preferences',
    description: 'Adjusts user study pace, target daily hours, or weak subject flags based on ongoing diagnostic review.',
    parameters: {
      type: 'OBJECT',
      properties: {
        studyPace: {
          type: 'STRING',
          enum: ['light', 'moderate', 'intensive', 'exam_cram'],
          description: 'Suggested pace mode.',
        },
        targetDailyStudyHours: {
          type: 'NUMBER',
          description: 'Recommended daily study hours.',
        },
        weakSubjects: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: 'Subjects requiring extra advisory attention.',
        },
        advisorPersonality: {
          type: 'STRING',
          enum: ['encouraging', 'analytical', 'strict_disciplinarian', 'socratic'],
          description: 'Advisor communication tone.',
        },
      },
      required: [],
    },
  },
  {
    name: 'reorganize_study_schedule',
    description: 'Batch re-evaluates and aligns pending tasks against upcoming exam dates and weekly schedule density.',
    parameters: {
      type: 'OBJECT',
      properties: {
        focusSubject: {
          type: 'STRING',
          description: 'Subject requiring prioritized allocation.',
        },
        rationale: {
          type: 'STRING',
          description: 'Explanation for re-allocation (e.g. "Exam in 12 days, test scores currently below 75%").',
        },
      },
      required: ['focusSubject', 'rationale'],
    },
  },
];
