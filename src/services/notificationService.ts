/**
 * Notification Service for StudyMate PWA & Web App
 * Supports Web Notifications API, ServiceWorker Registration, Web Audio Chime,
 * and Smart Contextual Triggers (Exam Eve, Task Deadlines, Daily Review).
 */

import { Exam, Task } from '../types/studymate';
import { calculateDaysRemaining } from '../utils/persianDate';

export interface StudyAlert {
  id: string;
  type: 'exam_eve' | 'task_deadline' | 'nightly_review' | 'system';
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
  actionScreen?: 'exams' | 'tasks' | 'analysis' | 'home';
}

const STORAGE_KEY_SENT_NOTIFICATIONS = 'studymate_sent_notifications_v1';
const STORAGE_KEY_PREFS = 'studymate_notification_prefs_v1';

export interface NotificationPreferences {
  enabled: boolean;
  examAlerts: boolean;
  taskAlerts: boolean;
  nightlyReviewAlerts: boolean;
  soundEnabled: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  enabled: true,
  examAlerts: true,
  taskAlerts: true,
  nightlyReviewAlerts: true,
  soundEnabled: true,
};

export class NotificationService {
  /**
   * Check if browser supports Web Notifications
   */
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Get current permission state
   */
  static getPermission(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  /**
   * Request permission from user
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (err) {
      console.warn('Notification permission request error:', err);
      return 'denied';
    }
  }

  /**
   * Load user notification preferences
   */
  static getPreferences(): NotificationPreferences {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PREFS);
      if (stored) {
        return { ...DEFAULT_PREFS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to parse notification prefs:', e);
    }
    return DEFAULT_PREFS;
  }

  /**
   * Save user notification preferences
   */
  static savePreferences(prefs: NotificationPreferences): void {
    try {
      localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(prefs));
    } catch (e) {
      console.warn('Failed to save notification prefs:', e);
    }
  }

  /**
   * Play a pleasant synthesized chime sound using Web Audio API
   */
  static playAlertSound(): void {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      
      // Dual-tone chime (F5 -> A5)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(698.46, now); // F5
      osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.15); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880.0, now);
      osc2.frequency.exponentialRampToValueAtTime(1046.5, now + 0.25); // C6

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.05);
      osc1.stop(now + 0.6);
      osc2.stop(now + 0.6);
    } catch (e) {
      console.warn('Web Audio chime not available:', e);
    }
  }

  /**
   * Send a system Web Notification if permission granted
   */
  static async sendSystemNotification(title: string, options: {
    body: string;
    tag?: string;
    data?: Record<string, unknown>;
  }): Promise<boolean> {
    const prefs = this.getPreferences();
    if (!prefs.enabled) return false;

    if (prefs.soundEnabled) {
      this.playAlertSound();
    }

    if (!this.isSupported() || Notification.permission !== 'granted') {
      return false;
    }

    try {
      // Try via ServiceWorker registration if available for best mobile support
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && 'showNotification' in registration) {
          await registration.showNotification(title, {
            body: options.body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: options.tag || 'studymate-alert',
            dir: 'rtl',
            lang: 'fa',
            vibrate: [200, 100, 200],
            data: options.data || { url: '/' },
          } as NotificationOptions);
          return true;
        }
      }

      // Standard desktop/window Notification fallback
      new Notification(title, {
        body: options.body,
        icon: '/icon-192.png',
        tag: options.tag || 'studymate-alert',
        dir: 'rtl',
        lang: 'fa',
      });
      return true;
    } catch (err) {
      console.warn('Failed to display native system notification:', err);
      return false;
    }
  }

  /**
   * Generate active contextual study alerts based on current data
   */
  static evaluateStudyAlerts(exams: Exam[], tasks: Task[]): StudyAlert[] {
    const alerts: StudyAlert[] = [];
    const todayStr = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();

    // 1. Exam Eve and Exam Day Alerts
    exams.forEach((exam) => {
      const countdown = calculateDaysRemaining(exam.date);
      if (countdown.days === 1) {
        // Eve of exam (tomorrow)
        alerts.push({
          id: `exam_eve_${exam.id}_${exam.date}`,
          type: 'exam_eve',
          title: `🔔 یادآوری شب آزمون: ${exam.title}`,
          body: `فردا آزمون «${exam.title}» داری! مرور خلاصه‌نویسی‌ها، کنترل وسایل و خواب به‌موقع از ساعت ۲۲ فراموش نشه.`,
          timestamp: 'شب آزمون (فردا)',
          read: false,
          priority: 'high',
          actionScreen: 'exams',
        });
      } else if (countdown.days === 0) {
        // Today is exam day
        alerts.push({
          id: `exam_today_${exam.id}_${exam.date}`,
          type: 'exam_eve',
          title: `🎯 امروز روز آزمون است: ${exam.title}`,
          body: `با آرامش و اعتماد به نفس در آزمون حاضر شو. تمرکز روی استراتژی آزمون و مدیریت زمان یادت نره.`,
          timestamp: 'امروز',
          read: false,
          priority: 'high',
          actionScreen: 'exams',
        });
      }
    });

    // 2. Pending Tasks Deadline Alerts
    const todayUnfinishedTasks = tasks.filter(
      (t) => !t.completed && (t.dueDate === todayStr || t.priority === 'urgent')
    );

    if (todayUnfinishedTasks.length > 0) {
      const firstTask = todayUnfinishedTasks[0];
      const count = todayUnfinishedTasks.length;
      alerts.push({
        id: `task_deadline_${todayStr}_${firstTask.id}`,
        type: 'task_deadline',
        title: `⏳ ${count > 1 ? `${count} پارت مطالعه نیازمند تکمیل` : `پارت مطالعه: ${firstTask.title}`}`,
        body: count > 1 
          ? `امروز هنوز ${count} پارت انجام‌نشده داری (مثل ${firstTask.title} - ${firstTask.subject}). برای تحقق برنامه روزانه اقدام کن.`
          : `پارت «${firstTask.title}» (${firstTask.subject} - ${firstTask.estimatedMinutes} دقیقه) هنوز تیک نخورده است.`,
        timestamp: 'ددلاین امروز',
        read: false,
        priority: todayUnfinishedTasks.some((t) => t.priority === 'urgent') ? 'high' : 'medium',
        actionScreen: 'tasks',
      });
    }

    // 3. Nightly Review Reminder (Evening after 20:00)
    if (currentHour >= 20 || currentHour < 2) {
      alerts.push({
        id: `nightly_review_${todayStr}`,
        type: 'nightly_review',
        title: '📊 زمان ثبت گزارش روزانه و تست‌ها',
        body: 'پارت‌های مطالعه خوانده‌شده امروزت رو نهایی کن تا ساعت مطالعه کل و نمودارهای بازدهی در بخش تحلیل آپدیت بشن.',
        timestamp: 'گزارش شبانه',
        read: false,
        priority: 'medium',
        actionScreen: 'analysis',
      });
    }

    return alerts;
  }

  /**
   * Check and trigger system notification for highest-priority unseen alert today
   */
  static async checkAndTriggerDailyAlerts(exams: Exam[], tasks: Task[]): Promise<void> {
    const prefs = this.getPreferences();
    if (!prefs.enabled) return;

    const alerts = this.evaluateStudyAlerts(exams, tasks);
    if (alerts.length === 0) return;

    let sentMap: Record<string, number> = {};
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SENT_NOTIFICATIONS);
      if (stored) sentMap = JSON.parse(stored);
    } catch {
      sentMap = {};
    }

    const now = Date.now();
    // Filter alerts not sent in the last 6 hours
    const candidateAlert = alerts.find((alert) => {
      if (alert.type === 'exam_eve' && !prefs.examAlerts) return false;
      if (alert.type === 'task_deadline' && !prefs.taskAlerts) return false;
      if (alert.type === 'nightly_review' && !prefs.nightlyReviewAlerts) return false;

      const lastSentTime = sentMap[alert.id];
      if (!lastSentTime) return true;
      return now - lastSentTime > 6 * 60 * 60 * 1000; // 6 hours throttle
    });

    if (candidateAlert) {
      const sent = await this.sendSystemNotification(candidateAlert.title, {
        body: candidateAlert.body,
        tag: candidateAlert.id,
      });

      if (sent) {
        sentMap[candidateAlert.id] = now;
        try {
          localStorage.setItem(STORAGE_KEY_SENT_NOTIFICATIONS, JSON.stringify(sentMap));
        } catch {
          // ignore storage quota errors
        }
      }
    }
  }

  /**
   * Register Service Worker
   */
  static registerServiceWorker(): void {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('PWA ServiceWorker registered with scope:', reg.scope);
          })
          .catch((err) => {
            console.warn('ServiceWorker registration error:', err);
          });
      });
    }
  }
}
