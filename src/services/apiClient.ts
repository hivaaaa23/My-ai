/**
 * Frontend API Client
 * Interacts with the decoupled server-side REST endpoints.
 */
import {
  Task,
  Goal,
  Exam,
  SchoolScheduleItem,
  DailyTest,
  StudyHistorySession,
  UserPreferences,
  StructuredUserContext,
  ControlledActionLog,
} from '../types/academic';

export interface ContextResponse {
  success: boolean;
  context: StructuredUserContext;
  promptDigest: string;
  toolCount: number;
  geminiIntegrationStatus: string;
}

export interface ToolsResponse {
  tools: any[];
  availableActions: string[];
}

export interface ActionExecutionResponse {
  success: boolean;
  actionName: string;
  message: string;
  data?: any;
  logId?: string;
  guardrailViolations?: string[];
}

export interface RecommendationResponse {
  success: boolean;
  recommendation: {
    id: string;
    timestamp: string;
    advisorAnalysis: string;
    suggestedActions: {
      actionName: string;
      description: string;
      parameters: Record<string, unknown>;
    }[];
    urgencyLevel: 'routine' | 'elevated' | 'critical';
    confidenceScore: number;
  };
}

export const api = {
  // Context & AI Bridge
  async getContext(): Promise<ContextResponse> {
    const res = await fetch('/api/context');
    if (!res.ok) throw new Error('Failed to fetch structured AI context');
    return res.json();
  },

  async getTools(): Promise<ToolsResponse> {
    const res = await fetch('/api/ai/tools');
    if (!res.ok) throw new Error('Failed to fetch AI tools');
    return res.json();
  },

  async executeControlledAction(
    actionName: string,
    parameters: Record<string, unknown>,
    isDryRun: boolean = false
  ): Promise<ActionExecutionResponse> {
    const res = await fetch('/api/ai/actions/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionName, parameters, isDryRun }),
    });
    return res.json();
  },

  async getAuditLogs(): Promise<{ logs: ControlledActionLog[] }> {
    const res = await fetch('/api/ai/actions/audit-log');
    if (!res.ok) throw new Error('Failed to fetch action audit logs');
    return res.json();
  },

  async getAdvisorRecommendation(): Promise<RecommendationResponse> {
    const res = await fetch('/api/ai/recommendation');
    if (!res.ok) throw new Error('Failed to get advisor recommendation');
    return res.json();
  },

  async chatWithAdvisor(
    message: string,
    history?: { sender: 'user' | 'assistant'; text: string }[],
    context?: Record<string, unknown>
  ): Promise<{
    text: string;
    suggestedAction?: {
      type: 'add_task' | 'batch_tasks' | 'reschedule' | 'add_goal' | 'add_exam' | 'record_test';
      title: string;
      description?: string;
      requiresConfirmation?: boolean;
      payload?: any;
      status?: 'pending' | 'applied' | 'dismissed';
    };
  }> {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, context }),
    });
    if (!res.ok) {
      throw new Error(`Advisor chat request failed with status ${res.status}`);
    }
    const data = await res.json();
    return data.reply;
  },

  // CRUD for Tasks
  async createTask(task: Partial<Task>): Promise<Task> {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    return res.json();
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  async deleteTask(id: string): Promise<void> {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
  },

  // CRUD for Goals
  async createGoal(goal: Partial<Goal>): Promise<Goal> {
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal),
    });
    return res.json();
  },

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
    const res = await fetch(`/api/goals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  // CRUD for Exams
  async createExam(exam: Partial<Exam>): Promise<Exam> {
    const res = await fetch('/api/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exam),
    });
    return res.json();
  },

  async updateExam(id: string, updates: Partial<Exam>): Promise<Exam> {
    const res = await fetch(`/api/exams/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  // Log study session
  async logStudySession(session: Partial<StudyHistorySession>): Promise<StudyHistorySession> {
    const res = await fetch('/api/study-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    });
    return res.json();
  },

  // Daily test recording
  async recordDailyTest(test: Partial<DailyTest>): Promise<DailyTest> {
    const res = await fetch('/api/daily-tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(test),
    });
    return res.json();
  },

  // Update Preferences
  async updatePreferences(updates: Partial<UserPreferences>): Promise<UserPreferences> {
    const res = await fetch('/api/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },
};
