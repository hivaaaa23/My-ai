/**
 * Personal Study Advisor Service Layer
 *
 * Implements server-side AI integration supporting:
 * - OpenRouter API (sk-or-v1-...)
 * - Google GenAI SDK (@google/genai)
 * Adheres strictly to the 11th Grade Mathematics Konkur & Final Exam advisory system instruction
 * with complete 15-subject syllabus.
 */

import { StructuredUserContext } from '../../src/types/academic.js';
import { StudyAdvisorContextProvider } from './contextProvider.js';
import { controlledActionRegistry, ActionExecutionResult } from './actionRegistry.js';
import { STUDY_ADVISOR_GEMINI_TOOLS, AdvisorToolDeclaration } from './toolsSchema.js';
import { STUDY_ADVISOR_SYSTEM_INSTRUCTION } from './advisorSystemInstruction.js';
import { generateAdvisorCompletion } from './llmClient.js';
import {
  extractSchoolAssignments,
  detectMissedTasks,
  smartRescheduleMissedTasks,
} from '../../src/services/studyPlanner.js';

export interface AdvisorRecommendation {
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
}

export interface ControlledActionSuggestion {
  type:
    | 'add_task'
    | 'batch_tasks'
    | 'reschedule'
    | 'add_goal'
    | 'add_exam'
    | 'record_test';
  title: string;
  description?: string;
  requiresConfirmation?: boolean;
  payload?: Record<string, any>;
  status?: 'pending' | 'applied' | 'dismissed';
}

export interface AdvisorChatReply {
  text: string;
  suggestedAction?: ControlledActionSuggestion;
}

export interface ChatHistoryItem {
  sender: 'user' | 'assistant';
  text: string;
}

export class PersonalStudyAdvisorService {
  /**
   * Returns tool declarations ready for function calling.
   */
  public getTools(): AdvisorToolDeclaration[] {
    return STUDY_ADVISOR_GEMINI_TOOLS;
  }

  /**
   * Main conversational advisor endpoint powered by LLM (OpenRouter / Gemini).
   */
  public async chatWithAdvisor(
    userMessage: string,
    history: ChatHistoryItem[] = [],
    clientContext?: Record<string, unknown>
  ): Promise<AdvisorChatReply> {
    // Prepare live student academic snapshot
    const context = StudyAdvisorContextProvider.getStructuredUserContext();
    const contextPrompt = this.formatContextForAdvisor(context, clientContext);

    // Analyze user message for controlled action intentions
    const clientTasks = (clientContext?.tasks as any[]) || [];
    const clientSchedule = (clientContext?.schedule as any[]) || [];
    const clientPreferences = clientContext?.preferences as any;

    const heuristicAction = this.detectComprehensiveIntent(userMessage, clientTasks, clientSchedule, clientPreferences);

    // Call LLM backend
    try {
      const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

      // Include recent conversation history
      const recentHistory = history.slice(-6);
      for (const item of recentHistory) {
        messages.push({
          role: item.sender === 'user' ? 'user' : 'assistant',
          content: item.text,
        });
      }

      // Add current message with context
      const promptContent = `
[اطلاعات وضعیت تحصیلی دانش‌آموز یازدهم ریاضی]:
${contextPrompt}

[دستورالعمل مهم اقدام سیستمی]:
اگر پیام دانش‌آموز شامل برنامه‌ریزی، اضافه کردن تسک، تست، مطالعه مبحث یا تکلیف است:
۱. حتماً با لحن مشاوره‌ای گرم، واقع‌بینانه و حمایتی پاسخ بده.
۲. در انتهای پاسخت دقیقاً یک بلوک ACTION_PROPOSAL قرار بده تا مستقیماً به برنامه‌اش اضافه شود:
ACTION_PROPOSAL: {"type": "add_task", "title": "عنوان پارت", "requiresConfirmation": false, "payload": {"title": "...", "subject": "...", "dueDate": "${new Date().toISOString().split('T')[0]}", "priority": "high", "estimatedMinutes": 45, "notes": "..."}}

[پیام دانش‌آموز]:
${userMessage}
`.trim();

      messages.push({
        role: 'user',
        content: promptContent,
      });

      const completion = await generateAdvisorCompletion({
        systemInstruction: STUDY_ADVISOR_SYSTEM_INSTRUCTION,
        messages,
        temperature: 0.6,
        maxTokens: 1200,
      });

      if (completion.text) {
        const { cleanText, suggestedAction: llmAction } = this.parseActionSuggestion(completion.text);
        const finalAction = llmAction || heuristicAction;

        return {
          text: cleanText,
          suggestedAction: finalAction,
        };
      }
    } catch (err) {
      console.warn('LLM completion failed, falling back to expert Persian advisor engine:', err);
    }

    // Heuristic fallback if LLM has issues or network timeout
    return this.generateFallbackAdvisorReply(userMessage, context, heuristicAction);
  }

  /**
   * Comprehensive Intent Detector
   * Captures all variations of Persian planning prompts (tests, reading, assignments, rescheduling, multi-subject schedules).
   */
  private detectComprehensiveIntent(
    userMessage: string,
    existingTasks: any[] = [],
    schedule: any[] = [],
    preferences?: any
  ): ControlledActionSuggestion | undefined {
    const text = userMessage.trim();

    // 1. School assignments parser (e.g. "امروز مدرسه گفت...")
    if (/مدرسه\s*گفت|تکلیف|معلم|استاد|تکالیف/i.test(text)) {
      const assignmentResult = extractSchoolAssignments(text, existingTasks);
      if (assignmentResult.assignments.length > 0) {
        const tasksToCreate = assignmentResult.assignments.map((a) => ({
          title: a.title,
          subject: a.subject,
          dueDate: a.dueDate,
          priority: a.priority,
          estimatedMinutes: a.estimatedMinutes,
          notes: a.notes || `تکلیف مدرسه: ${a.title}`,
          completed: false,
        }));

        return {
          type: 'batch_tasks',
          title: `ثبت ${assignmentResult.assignments.length} تکلیف مدرسه`,
          description: assignmentResult.summaryPersian,
          requiresConfirmation: false,
          payload: {
            tasks: tasksToCreate,
            duplicatesAvoided: assignmentResult.duplicatesCount,
          },
        };
      }
    }

    // 2. Smart Rescheduling request (e.g. "تسک‌های عقب‌افتاده رو بازتوزیع کن")
    if (/عقب[\s‌-]*افتاده|معوق|جبران|بازتوزیع|پخش\s*کن/i.test(text)) {
      const missed = detectMissedTasks(existingTasks);
      if (missed.length > 0) {
        const rescheduleResult = smartRescheduleMissedTasks(missed, existingTasks, schedule, preferences);
        return {
          type: 'reschedule',
          title: `بازتوزیع هوشمند ${missed.length} پارت عقب‌افتاده`,
          description: rescheduleResult.explanation,
          requiresConfirmation: true,
          payload: {
            plan: rescheduleResult.plan,
            totalEstimatedMinutes: rescheduleResult.totalEstimatedMinutes,
          },
        };
      }
    }

    // 3. Subject identification from 11th Grade Mathematics curriculum
    let subject = '';
    if (/حسابان|تابع|مثلثات|جبر|معادله|حد|پیوستگی/i.test(text)) subject = 'حسابان ۱';
    else if (/هندسه|دایره|تبدیل|مثلث/i.test(text)) subject = 'هندسه ۲';
    else if (/آمار|احتمال|مبانی ریاضیات/i.test(text)) subject = 'آمار و احتمال';
    else if (/فیزیک|الکتریسیته|جریان|مغناطیس|القای/i.test(text)) subject = 'فیزیک ۲';
    else if (/شیمی|استوکیومتری|هدایای زمینی|غذای سالم|پوشاک/i.test(text)) subject = 'شیمی ۲';
    else if (/آزمایشگاه/i.test(text)) subject = 'آزمایشگاه علوم تجربی ۲';
    else if (/فارسی|ادبیات|تعلیمی|پایداری|غنایی|حماسی/i.test(text)) subject = 'ادبیات فارسی ۲';
    else if (/نگارش|واژه‌گزینی/i.test(text)) subject = 'نگارش ۲';
    else if (/دین و زندگی|دینی|هدایت|امامت/i.test(text)) subject = 'دین و زندگی ۲';
    else if (/انگلیسی|زبان|کتاب کار/i.test(text)) subject = 'زبان انگلیسی ۲';
    else if (/عربی|قواعد|مستثنی|افعال ناقصه|مفعول مطلق/i.test(text)) subject = 'عربی ۲';
    else if (/تاریخ|قاجار|پهلوی/i.test(text)) subject = 'تاریخ معاصر ایران';
    else if (/زمین|زمین‌شناسی/i.test(text)) subject = 'زمین‌شناسی';
    else if (/محیط زیست|انسان و محیط/i.test(text)) subject = 'انسان و محیط زیست';

    // Target due date calculation
    const today = new Date();
    let targetDate = new Date();
    if (/فردا/i.test(text)) {
      targetDate.setDate(today.getDate() + 1);
    } else if (/پس‌فردا|پسفردا/i.test(text)) {
      targetDate.setDate(today.getDate() + 2);
    } else if (/شنبه/i.test(text)) {
      targetDate.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7 || 7));
    } else if (/پنجشنبه/i.test(text)) {
      targetDate.setDate(today.getDate() + ((4 - today.getDay() + 7) % 7 || 7));
    } else if (/جمعه/i.test(text)) {
      targetDate.setDate(today.getDate() + ((5 - today.getDay() + 7) % 7 || 7));
    }
    const dueDateStr = targetDate.toISOString().split('T')[0];

    // Check for test count (e.g. ۲۰ تست فیزیک، ۳۰ تا تست)
    const testCountMatch = text.match(/([۰-۹0-9]+)\s*(?:تا\s*)?تست/i);
    const questionCount = testCountMatch
      ? parseInt(testCountMatch[1].replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()), 10)
      : undefined;

    // Check if user is asking to add a plan / task
    const isPlanOrAddIntent =
      /اضافه|ثبت|بذار|بگذار|برنامه|مطالعه|بخونم|بزنم|کار کنم|پارت|تست/i.test(text);

    if (subject && isPlanOrAddIntent) {
      const taskTitle = questionCount
        ? `حل ${questionCount} تست ${subject}`
        : /مطالعه|بخونم/i.test(text)
        ? `مطالعه و مرور ${subject}`
        : `پارت مطالعه ${subject}`;

      return {
        type: 'add_task',
        title: taskTitle,
        description: `برنامه‌ریزی برای تاریخ ${dueDateStr}`,
        requiresConfirmation: false,
        payload: {
          title: taskTitle,
          subject,
          dueDate: dueDateStr,
          priority: questionCount && questionCount >= 30 ? 'urgent' : 'high',
          estimatedMinutes: questionCount ? Math.min(120, Math.max(30, questionCount * 2)) : 60,
          notes: 'ثبت‌شده از طریق گفتگوی هوشمند مشاور',
        },
      };
    }

    // Check for general daily plan generation request (e.g. "برنامه برای فردا بزار")
    if (/برنامه.*?(?:فردا|امروز|بزار|بگذار|بنویس|تنظیم)/i.test(text)) {
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      const planDueDate = /فردا/i.test(text) ? tomorrow.toISOString().split('T')[0] : today.toISOString().split('T')[0];

      return {
        type: 'batch_tasks',
        title: 'برنامه پیشنهادی متوازن یازدهم ریاضی',
        description: `۳ پارت مطالعه و تست‌زنی برای تاریخ ${planDueDate}`,
        requiresConfirmation: false,
        payload: {
          tasks: [
            {
              title: 'مطالعه و حل ۲۵ تست حسابان ۱ (تابع و مثلثات)',
              subject: 'حسابان ۱',
              dueDate: planDueDate,
              priority: 'high',
              estimatedMinutes: 75,
              notes: 'پارت اول مطالعه کنکوری',
            },
            {
              title: 'حل ۲۰ تست فیزیک ۲ (الکتریسیته ساکن)',
              subject: 'فیزیک ۲',
              dueDate: planDueDate,
              priority: 'high',
              estimatedMinutes: 60,
              notes: 'پارت دوم مطالعه و تست',
            },
            {
              title: 'مرور مفهومی شیمی ۲ جهت آمادگی نهایی',
              subject: 'شیمی ۲',
              dueDate: planDueDate,
              priority: 'medium',
              estimatedMinutes: 45,
              notes: 'پارت شبانه تشریحی نهایی',
            },
          ],
        },
      };
    }

    return undefined;
  }

  /**
   * Formats student academic data for advisor context.
   */
  private formatContextForAdvisor(
    context: StructuredUserContext,
    clientContext?: Record<string, unknown>
  ): string {
    const tasks = (clientContext?.tasks as any[]) || context.tasks;
    const pendingTasks = tasks.filter((t: any) => !t.completed);
    const completedTasks = tasks.filter((t: any) => t.completed);
    const today = new Date().toISOString().split('T')[0];
    const missedTasks = tasks.filter((t: any) => !t.completed && t.dueDate < today);

    const upcomingExams = ((clientContext?.exams as any[]) || context.exams).slice(0, 3).map((e: any) => {
      return `- ${e.title} (${e.subject}) | تاریخ: ${e.examDate || e.date} | آمادگی: ${e.currentReadinessPercentage || 70}٪`;
    });

    const recentTests = ((clientContext?.dailyTests as any[]) || context.dailyTests).slice(0, 3).map((t: any) => {
      return `- ${t.topic || t.title} (${t.subject}): ${t.correctCount || t.score || 0} از ${t.numberOfQuestions || 20}`;
    });

    return `
- رشته و مقطع: پایه یازدهم ریاضی و فیزیک
- وضعیت پارت‌ها: ${pendingTasks.length} پارت در دست اقدام، ${completedTasks.length} پارت تکمیل‌شده
- کارهای معوق: ${missedTasks.length} تسک
- آزمون‌های پیش‌رو:
${upcomingExams.length > 0 ? upcomingExams.join('\n') : 'آزمون فوری ثبت نشده است.'}
- کارنامه تست‌های اخیر:
${recentTests.length > 0 ? recentTests.join('\n') : 'تست جدیدی ثبت نشده است.'}
`.trim();
  }

  /**
   * Extracts action proposals from the advisor's response.
   */
  private parseActionSuggestion(rawText: string): { cleanText: string; suggestedAction?: ControlledActionSuggestion } {
    let cleanText = rawText;
    let suggestedAction: ControlledActionSuggestion | undefined = undefined;

    const actionIdx = rawText.indexOf('ACTION_PROPOSAL:');
    if (actionIdx !== -1) {
      const proposalPart = rawText.slice(actionIdx + 'ACTION_PROPOSAL:'.length).trim();
      const firstBrace = proposalPart.indexOf('{');
      const lastBrace = proposalPart.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const jsonStr = proposalPart.slice(firstBrace, lastBrace + 1);
        try {
          const parsed = JSON.parse(jsonStr);
          suggestedAction = {
            type: parsed.type || 'add_task',
            title: parsed.title || 'اقدام پیشنهادی',
            description: parsed.description,
            requiresConfirmation: Boolean(parsed.requiresConfirmation),
            payload: parsed.payload,
          };
          cleanText = rawText.slice(0, actionIdx).trim();
        } catch (e) {
          console.warn('Failed to parse ACTION_PROPOSAL JSON:', e);
        }
      }
    }

    // Safety cleanup of any trailing action block text
    cleanText = cleanText.replace(/ACTION_PROPOSAL:\s*\{[\s\S]*\}?/g, '').trim();

    return { cleanText, suggestedAction };
  }

  /**
   * Fallback heuristic reply generator aligned with the 11th Grade Math syllabus.
   */
  private generateFallbackAdvisorReply(
    userMessage: string,
    context: StructuredUserContext,
    heuristicAction?: ControlledActionSuggestion
  ): AdvisorChatReply {
    const text = userMessage.trim();

    if (heuristicAction && heuristicAction.type === 'add_task') {
      return {
        text: `پارت مطالعه «${heuristicAction.title}» طبق زمان‌بندی در برنامه‌ات ثبت شد. برای کسب بالاترین راندمان، پس از مرور فرمول‌ها، تست‌ها را به صورت زمان‌دار و با تحلیل دقیق پاسخ‌نامه حل کن.`,
        suggestedAction: heuristicAction,
      };
    }

    if (heuristicAction && heuristicAction.type === 'batch_tasks') {
      const count = heuristicAction.payload?.tasks?.length || 0;
      return {
        text: `برنامه پیشنهادی شامل ${count} پارت متوازن از دروس تخصصی و نهایی تنظیم شد و مستقیماً در لیست برنامه‌هایت قرار گرفت تا خیالت از پیشرفت متوازن راحت باشد.`,
        suggestedAction: heuristicAction,
      };
    }

    if (heuristicAction && heuristicAction.type === 'reschedule') {
      return {
        text: `تسک‌های عقب‌افتاده بررسی شدند. برای حفظ کیفیت یادگیری و جلوگیری از خستگی، یک برنامه بازتوزیع متعادل آماده شده است. با دکمه زیر آن را تأیید کن تا اعمال شود.`,
        suggestedAction: heuristicAction,
      };
    }

    return {
      text: `پیامت را بررسی کردم. به عنوان مشاور یازدهم ریاضی، تعادل بین مفاهیم نهایی و تکنیک تست‌زنی کنکور اولویت ماست. اگر می‌خواهی درسی (مثل حسابان ۱، هندسه ۲، فیزیک ۲ یا شیمی ۲) را به برنامه‌ات اضافه کنم، کافیست نام درس یا تعداد تست را در چت بنویسی.`,
      suggestedAction: heuristicAction,
    };
  }

  public async analyzeContextAndRecommend(customContext?: StructuredUserContext): Promise<AdvisorRecommendation> {
    const context = customContext || StudyAdvisorContextProvider.getStructuredUserContext();
    return {
      id: `rec-${Date.now()}`,
      timestamp: new Date().toISOString(),
      advisorAnalysis: 'تمرکز ویژه بر حسابان ۱ و فیزیک ۲ برای هماهنگی امتحانات نهایی و آزمون‌های آزمایشی توصیه می‌شود.',
      suggestedActions: [
        {
          actionName: 'create_study_task',
          description: 'حل ۳۰ تست حسابان ۱ مبحث تابع وارون',
          parameters: {
            title: 'حل ۳۰ تست حسابان ۱ مبحث تابع وارون',
            subject: 'حسابان ۱',
            dueDate: new Date().toISOString().split('T')[0],
            priority: 'high',
            estimatedMinutes: 60,
          },
        },
      ],
      urgencyLevel: 'routine',
      confidenceScore: 0.95,
    };
  }

  public async executeActionProposal(
    actionName: string,
    parameters: Record<string, unknown>
  ): Promise<ActionExecutionResult> {
    return controlledActionRegistry.executeAction(actionName, parameters, false);
  }
}

export const personalStudyAdvisorService = new PersonalStudyAdvisorService();
export const studyAdvisorService = personalStudyAdvisorService;
