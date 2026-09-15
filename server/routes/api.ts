/**
 * Express REST API Routes
 * Exposes clean, typed endpoints for:
 * 1. AI Structured Context Ingestion
 * 2. Academic Entities CRUD (Tasks, Goals, Exams, Schedule, Tests, Study History, Preferences)
 * 3. AI Controlled Actions Dispatch & Audit Logging
 * 4. Gemini Tool Schemas Provider
 */
import { Router, Request, Response } from 'express';
import { academicStore } from '../db/store.js';
import { StudyAdvisorContextProvider } from '../ai/contextProvider.js';
import { controlledActionRegistry } from '../ai/actionRegistry.js';
import { studyAdvisorService } from '../ai/advisorService.js';
import { STUDY_ADVISOR_GEMINI_TOOLS } from '../ai/toolsSchema.js';

export const apiRouter = Router();

// ==========================================
// 1. AI Structured Context & Diagnostics
// ==========================================

/**
 * Returns the complete structured context payload prepared for Gemini ingestion.
 */
apiRouter.get('/context', (req: Request, res: Response) => {
  try {
    const structuredContext = StudyAdvisorContextProvider.getStructuredUserContext();
    const promptDigest = StudyAdvisorContextProvider.getPromptOptimizedSummary(structuredContext);
    const hasKey = Boolean(
      (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim() !== '' && process.env.OPENROUTER_API_KEY !== 'MY_OPENROUTER_API_KEY') ||
      (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '' && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY')
    );

    res.json({
      success: true,
      context: structuredContext,
      promptDigest,
      toolCount: STUDY_ADVISOR_GEMINI_TOOLS.length,
      geminiIntegrationStatus: hasKey ? 'ACTIVE_GEMINI_SERVER_SERVICE' : 'FALLBACK_HEURISTIC_ACTIVE',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to compile context';
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * Returns tool declarations ready for Gemini function calling.
 */
apiRouter.get('/ai/tools', (req: Request, res: Response) => {
  res.json({
    tools: STUDY_ADVISOR_GEMINI_TOOLS,
    availableActions: controlledActionRegistry.getAvailableActionNames(),
  });
});

/**
 * Dispatches a server-side controlled action (e.g. from Gemini or manual test sandbox).
 */
apiRouter.post('/ai/actions/execute', async (req: Request, res: Response) => {
  try {
    const { actionName, parameters, isDryRun } = req.body;

    if (!actionName) {
      return res.status(400).json({ success: false, error: 'actionName is required' });
    }

    const result = await controlledActionRegistry.executeAction(
      String(actionName),
      parameters || {},
      Boolean(isDryRun)
    );

    res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Action execution exception';
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * Retrieves the audit trail of all actions executed on the server.
 */
apiRouter.get('/ai/actions/audit-log', (req: Request, res: Response) => {
  res.json({
    logs: academicStore.getActionLogs(),
  });
});

/**
 * Requests an advisory review recommendation based on current structured context.
 */
apiRouter.get('/ai/recommendation', async (req: Request, res: Response) => {
  try {
    const recommendation = await studyAdvisorService.analyzeContextAndRecommend();
    res.json({ success: true, recommendation });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to generate recommendation';
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * Server-Side Gemini Chat endpoint for Study Advisor.
 * Evaluates student questions with full contextual awareness of their academic schedule.
 */
apiRouter.post('/ai/chat', async (req: Request, res: Response) => {
  try {
    const { message, history, context } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'message string is required' });
    }

    const reply = await studyAdvisorService.chatWithAdvisor(
      message,
      Array.isArray(history) ? history : [],
      context
    );

    res.json({
      success: true,
      reply,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Advisor chat processing failed';
    res.status(500).json({ success: false, error: msg });
  }
});

apiRouter.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, history, context } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'message string is required' });
    }

    const reply = await studyAdvisorService.chatWithAdvisor(
      message,
      Array.isArray(history) ? history : [],
      context
    );

    res.json({
      success: true,
      reply,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Advisor chat processing failed';
    res.status(500).json({ success: false, error: msg });
  }
});

// ==========================================
// 2. Academic Tasks CRUD
// ==========================================

apiRouter.get('/tasks', (req: Request, res: Response) => {
  res.json(academicStore.getTasks());
});

apiRouter.post('/tasks', (req: Request, res: Response) => {
  try {
    const task = academicStore.createTask(req.body);
    res.status(201).json(task);
  } catch (err: unknown) {
    res.status(400).json({ error: 'Failed to create task' });
  }
});

apiRouter.put('/tasks/:id', (req: Request, res: Response) => {
  const updated = academicStore.updateTask(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Task not found' });
  res.json(updated);
});

apiRouter.delete('/tasks/:id', (req: Request, res: Response) => {
  const deleted = academicStore.deleteTask(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Task not found' });
  res.json({ success: true });
});

// ==========================================
// 3. Goals CRUD
// ==========================================

apiRouter.get('/goals', (req: Request, res: Response) => {
  res.json(academicStore.getGoals());
});

apiRouter.post('/goals', (req: Request, res: Response) => {
  const goal = academicStore.createGoal(req.body);
  res.status(201).json(goal);
});

apiRouter.put('/goals/:id', (req: Request, res: Response) => {
  const updated = academicStore.updateGoal(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Goal not found' });
  res.json(updated);
});

// ==========================================
// 4. Exams CRUD
// ==========================================

apiRouter.get('/exams', (req: Request, res: Response) => {
  res.json(academicStore.getExams());
});

apiRouter.post('/exams', (req: Request, res: Response) => {
  const exam = academicStore.createExam(req.body);
  res.status(201).json(exam);
});

apiRouter.put('/exams/:id', (req: Request, res: Response) => {
  const updated = academicStore.updateExam(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Exam not found' });
  res.json(updated);
});

// ==========================================
// 5. School Timetable Schedule
// ==========================================

apiRouter.get('/schedule', (req: Request, res: Response) => {
  res.json(academicStore.getSchedule());
});

apiRouter.post('/schedule', (req: Request, res: Response) => {
  const item = academicStore.createScheduleItem(req.body);
  res.status(201).json(item);
});

// ==========================================
// 6. Daily Tests & Quizzes
// ==========================================

apiRouter.get('/daily-tests', (req: Request, res: Response) => {
  res.json(academicStore.getDailyTests());
});

apiRouter.post('/daily-tests', (req: Request, res: Response) => {
  const test = academicStore.recordDailyTest(req.body);
  res.status(201).json(test);
});

// ==========================================
// 7. Study History
// ==========================================

apiRouter.get('/study-history', (req: Request, res: Response) => {
  res.json(academicStore.getStudyHistory());
});

apiRouter.post('/study-history', (req: Request, res: Response) => {
  const session = academicStore.logStudySession(req.body);
  res.status(201).json(session);
});

// ==========================================
// 8. User Preferences
// ==========================================

apiRouter.get('/preferences', (req: Request, res: Response) => {
  res.json(academicStore.getPreferences());
});

apiRouter.put('/preferences', (req: Request, res: Response) => {
  const updated = academicStore.updatePreferences(req.body);
  res.json(updated);
});
