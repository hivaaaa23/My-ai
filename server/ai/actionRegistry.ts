/**
 * Controlled Server-Side Action Registry
 *
 * Implements strict, guarded, server-authoritative mutations on the data store.
 * The AI Advisor cannot modify data arbitrarily; it can only invoke these registered,
 * validated actions with controlled parameter schemas and complete audit logging.
 */
import { academicStore } from '../db/store.js';
import { ControlledActionLog, Priority } from '../../src/types/academic.js';

export interface ActionExecutionResult {
  success: boolean;
  actionName: string;
  message: string;
  data?: unknown;
  logId?: string;
  guardrailViolations?: string[];
}

export type ActionHandler = (
  params: Record<string, unknown>,
  isDryRun?: boolean
) => Promise<ActionExecutionResult>;

class ControlledActionRegistry {
  private handlers: Map<string, ActionHandler> = new Map();

  constructor() {
    this.registerBuiltinActions();
  }

  /**
   * Dispatches an action safely with error boundary and audit logging.
   */
  public async executeAction(
    actionName: string,
    params: Record<string, unknown>,
    isDryRun: boolean = false
  ): Promise<ActionExecutionResult> {
    const handler = this.handlers.get(actionName);

    if (!handler) {
      const errorLog = academicStore.recordActionLog({
        actionName,
        parameters: params,
        status: 'failed',
        message: `Action '${actionName}' is not recognized in the controlled action registry.`,
      });
      return {
        success: false,
        actionName,
        message: `Unknown action: '${actionName}'. Action denied by registry.`,
        logId: errorLog.id,
      };
    }

    try {
      const result = await handler(params, isDryRun);

      if (!isDryRun) {
        const log = academicStore.recordActionLog({
          actionName,
          parameters: params,
          status: result.success ? 'success' : 'rejected_by_guardrails',
          message: result.message,
          affectedEntities: result.data ? (result.data as { affected?: any[] }).affected : undefined,
        });
        result.logId = log.id;
      }

      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Internal execution error';
      const log = academicStore.recordActionLog({
        actionName,
        parameters: params,
        status: 'failed',
        message: `Execution exception: ${message}`,
      });
      return {
        success: false,
        actionName,
        message: `Action execution failed: ${message}`,
        logId: log.id,
      };
    }
  }

  public getAvailableActionNames(): string[] {
    return Array.from(this.handlers.keys());
  }

  private registerBuiltinActions() {
    // 1. Create Task
    this.handlers.set('create_study_task', async (params, isDryRun) => {
      const violations: string[] = [];
      const title = String(params.title || '').trim();
      const subject = String(params.subject || '').trim();
      const dueDate = String(params.dueDate || '').trim();
      const priority = (params.priority || 'medium') as Priority;
      const estimatedMinutes = Number(params.estimatedMinutes) || 45;
      const description = params.description ? String(params.description).trim() : undefined;
      const tags = Array.isArray(params.tags) ? params.tags.map(String) : [];

      if (!title) violations.push('Task title is required and cannot be blank.');
      if (!subject) violations.push('Task subject is required.');
      if (!dueDate || !/^\d{4}-\d{2}-\d{2}/.test(dueDate)) {
        violations.push('Due date must be in YYYY-MM-DD format.');
      }
      if (estimatedMinutes <= 0 || estimatedMinutes > 480) {
        violations.push('Estimated study time must be between 1 and 480 minutes (max 8 hours).');
      }

      if (violations.length > 0) {
        return {
          success: false,
          actionName: 'create_study_task',
          message: `Guardrail check failed: ${violations.join(' ')}`,
          guardrailViolations: violations,
        };
      }

      if (isDryRun) {
        return {
          success: true,
          actionName: 'create_study_task',
          message: `[DRY-RUN VALIDATED] Task '${title}' (${subject}) would be scheduled for ${dueDate}.`,
          data: { title, subject, dueDate, priority, estimatedMinutes },
        };
      }

      const created = academicStore.createTask({
        title,
        subject,
        dueDate,
        priority,
        estimatedMinutes,
        description,
        tags,
        completed: false,
      });

      return {
        success: true,
        actionName: 'create_study_task',
        message: `Successfully created task '${title}' for ${subject} due on ${dueDate}.`,
        data: {
          task: created,
          affected: [{ entityType: 'task', entityId: created.id }],
        },
      };
    });

    // 2. Reschedule Task
    this.handlers.set('reschedule_task', async (params, isDryRun) => {
      const violations: string[] = [];
      const taskId = String(params.taskId || '');
      const newDueDate = String(params.newDueDate || '');
      const newPriority = params.newPriority as Priority | undefined;
      const reason = String(params.reason || 'AI Advisor schedule balancing');

      const existing = academicStore.getTask(taskId);
      if (!existing) {
        violations.push(`Task with ID '${taskId}' does not exist.`);
      }
      if (!newDueDate || !/^\d{4}-\d{2}-\d{2}/.test(newDueDate)) {
        violations.push('New due date must be in valid YYYY-MM-DD format.');
      }

      if (violations.length > 0) {
        return {
          success: false,
          actionName: 'reschedule_task',
          message: `Guardrails rejected reschedule: ${violations.join(' ')}`,
          guardrailViolations: violations,
        };
      }

      if (isDryRun) {
        return {
          success: true,
          actionName: 'reschedule_task',
          message: `[DRY-RUN VALIDATED] Would move task '${existing?.title}' from ${existing?.dueDate} to ${newDueDate}.`,
          data: { taskId, newDueDate, newPriority, reason },
        };
      }

      const updated = academicStore.updateTask(taskId, {
        dueDate: newDueDate,
        ...(newPriority ? { priority: newPriority } : {}),
      });

      return {
        success: true,
        actionName: 'reschedule_task',
        message: `Rescheduled '${existing?.title}' to ${newDueDate}. Reason: ${reason}`,
        data: {
          task: updated,
          affected: [{ entityType: 'task', entityId: taskId }],
        },
      };
    });

    // 3. Create Academic Goal
    this.handlers.set('create_academic_goal', async (params, isDryRun) => {
      const title = String(params.title || '').trim();
      const category = (params.category || 'academic') as any;
      const subject = params.subject ? String(params.subject).trim() : undefined;
      const targetDate = String(params.targetDate || '');
      const targetValue = Number(params.targetValue) || 100;
      const unit = String(params.unit || '%');
      const initialMilestones = Array.isArray(params.initialMilestones)
        ? params.initialMilestones.map((m, idx) => ({
            id: `m-${Date.now()}-${idx}`,
            title: String(m),
            completed: false,
          }))
        : [];

      if (!title || !targetDate) {
        return {
          success: false,
          actionName: 'create_academic_goal',
          message: 'Goal title and targetDate are required.',
          guardrailViolations: ['Missing required title or targetDate'],
        };
      }

      if (isDryRun) {
        return {
          success: true,
          actionName: 'create_academic_goal',
          message: `[DRY-RUN VALIDATED] Goal '${title}' with target ${targetValue} ${unit} by ${targetDate}.`,
        };
      }

      const goal = academicStore.createGoal({
        title,
        category,
        subject,
        targetDate,
        progressPercentage: 0,
        currentValue: 0,
        targetValue,
        unit,
        milestones: initialMilestones,
      });

      return {
        success: true,
        actionName: 'create_academic_goal',
        message: `Established new goal: '${title}'.`,
        data: {
          goal,
          affected: [{ entityType: 'goal', entityId: goal.id }],
        },
      };
    });

    // 4. Update Goal Progress
    this.handlers.set('update_goal_progress', async (params, isDryRun) => {
      const goalId = String(params.goalId || '');
      const newCurrentValue = Number(params.newCurrentValue);
      const milestoneIndex = params.completedMilestoneIndex !== undefined ? Number(params.completedMilestoneIndex) : undefined;
      const notes = params.progressNotes ? String(params.progressNotes) : undefined;

      const goals = academicStore.getGoals();
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) {
        return {
          success: false,
          actionName: 'update_goal_progress',
          message: `Goal with ID '${goalId}' not found.`,
          guardrailViolations: ['Invalid goal ID'],
        };
      }

      const progressPercentage = Math.min(100, Math.round((newCurrentValue / goal.targetValue) * 100));

      const updatedMilestones = [...goal.milestones];
      if (milestoneIndex !== undefined && updatedMilestones[milestoneIndex]) {
        updatedMilestones[milestoneIndex].completed = true;
      }

      if (isDryRun) {
        return {
          success: true,
          actionName: 'update_goal_progress',
          message: `[DRY-RUN VALIDATED] Would update '${goal.title}' to ${progressPercentage}%.`,
        };
      }

      const updated = academicStore.updateGoal(goalId, {
        currentValue: newCurrentValue,
        progressPercentage,
        milestones: updatedMilestones,
        ...(notes ? { notes } : {}),
      });

      return {
        success: true,
        actionName: 'update_goal_progress',
        message: `Updated goal '${goal.title}' progress to ${progressPercentage}%.`,
        data: {
          goal: updated,
          affected: [{ entityType: 'goal', entityId: goalId }],
        },
      };
    });

    // 5. Log Study Session
    this.handlers.set('log_study_session', async (params, isDryRun) => {
      const subject = String(params.subject || '').trim();
      const durationMinutes = Number(params.durationMinutes) || 45;
      const focusScore = Math.min(10, Math.max(1, Number(params.focusScore) || 7));
      const topicsCovered = Array.isArray(params.topicsCovered) ? params.topicsCovered.map(String) : ['General Review'];
      const notes = params.notes ? String(params.notes) : undefined;

      if (!subject) {
        return {
          success: false,
          actionName: 'log_study_session',
          message: 'Subject is required to log a study session.',
          guardrailViolations: ['Missing subject'],
        };
      }

      if (isDryRun) {
        return {
          success: true,
          actionName: 'log_study_session',
          message: `[DRY-RUN VALIDATED] Log ${durationMinutes}m session for ${subject} with focus ${focusScore}/10.`,
        };
      }

      const now = new Date();
      const session = academicStore.logStudySession({
        date: now.toISOString().split('T')[0],
        startTime: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        durationMinutes,
        subject,
        focusScore,
        topicsCovered,
        notes,
      });

      return {
        success: true,
        actionName: 'log_study_session',
        message: `Recorded ${durationMinutes} min study session for ${subject}.`,
        data: {
          session,
          affected: [{ entityType: 'study_history', entityId: session.id }],
        },
      };
    });

    // 6. Record Daily Test Result
    this.handlers.set('record_daily_test_result', async (params, isDryRun) => {
      const subject = String(params.subject || '').trim();
      const title = String(params.title || '').trim();
      const score = Number(params.score) || 0;
      const totalQuestions = Number(params.totalQuestions) || 10;
      const timeSpentMinutes = Number(params.timeSpentMinutes) || 15;
      const weakTopics = Array.isArray(params.weakTopics) ? params.weakTopics.map(String) : [];
      const strengths = Array.isArray(params.strengths) ? params.strengths.map(String) : [];
      const reflections = params.reflections ? String(params.reflections) : undefined;

      const percentage = Math.round((score / totalQuestions) * 100);

      if (!subject || !title) {
        return {
          success: false,
          actionName: 'record_daily_test_result',
          message: 'Subject and title are required.',
          guardrailViolations: ['Missing subject or title'],
        };
      }

      if (isDryRun) {
        return {
          success: true,
          actionName: 'record_daily_test_result',
          message: `[DRY-RUN VALIDATED] Would record test '${title}' (${score}/${totalQuestions}, ${percentage}%).`,
        };
      }

      const recorded = academicStore.recordDailyTest({
        date: new Date().toISOString().split('T')[0],
        subject,
        title,
        score,
        totalQuestions,
        percentage,
        timeSpentMinutes,
        weakTopics,
        strengths,
        reflections,
      });

      return {
        success: true,
        actionName: 'record_daily_test_result',
        message: `Saved test '${title}': ${percentage}% (${score}/${totalQuestions}).`,
        data: {
          test: recorded,
          affected: [{ entityType: 'daily_test' as any, entityId: recorded.id }],
        },
      };
    });

    // 7. Update User Preferences
    this.handlers.set('update_study_preferences', async (params, isDryRun) => {
      const updates: Record<string, any> = {};
      if (params.studyPace) updates.studyPace = params.studyPace;
      if (params.targetDailyStudyHours) updates.targetDailyStudyHours = Number(params.targetDailyStudyHours);
      if (Array.isArray(params.weakSubjects)) updates.weakSubjects = params.weakSubjects.map(String);
      if (params.advisorPersonality) updates.advisorPersonality = params.advisorPersonality;

      if (isDryRun) {
        return {
          success: true,
          actionName: 'update_study_preferences',
          message: `[DRY-RUN VALIDATED] Would update study preferences with: ${JSON.stringify(updates)}`,
        };
      }

      const pref = academicStore.updatePreferences(updates);
      return {
        success: true,
        actionName: 'update_study_preferences',
        message: 'Updated user study preferences.',
        data: {
          preferences: pref,
          affected: [{ entityType: 'preference', entityId: 'user_preferences' }],
        },
      };
    });

    // 8. Reorganize Study Schedule / Priority Balancing
    this.handlers.set('reorganize_study_schedule', async (params, isDryRun) => {
      const focusSubject = String(params.focusSubject || '').trim();
      const rationale = String(params.rationale || 'Exam preparation balancing');

      const tasks = academicStore.getTasks();
      const subjectTasks = tasks.filter((t) => t.subject.toLowerCase() === focusSubject.toLowerCase() && !t.completed);

      if (subjectTasks.length === 0) {
        return {
          success: false,
          actionName: 'reorganize_study_schedule',
          message: `No active tasks found for subject '${focusSubject}' to prioritize.`,
        };
      }

      if (isDryRun) {
        return {
          success: true,
          actionName: 'reorganize_study_schedule',
          message: `[DRY-RUN VALIDATED] Would escalate priority on ${subjectTasks.length} pending task(s) for ${focusSubject}.`,
        };
      }

      const affectedIds: string[] = [];
      for (const task of subjectTasks) {
        academicStore.updateTask(task.id, { priority: 'urgent' });
        affectedIds.push(task.id);
      }

      return {
        success: true,
        actionName: 'reorganize_study_schedule',
        message: `Elevated priority for ${subjectTasks.length} tasks in '${focusSubject}' to Urgent. Rationale: ${rationale}`,
        data: {
          affectedTaskCount: subjectTasks.length,
          affected: affectedIds.map((id) => ({ entityType: 'task' as const, entityId: id })),
        },
      };
    });
  }
}

export const controlledActionRegistry = new ControlledActionRegistry();
