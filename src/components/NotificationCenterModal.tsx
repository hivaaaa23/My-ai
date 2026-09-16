import React, { useState } from 'react';
import {
  Bell,
  CheckCircle,
  Clock,
  Calendar,
  Volume2,
  VolumeX,
  Send,
  X,
  ExternalLink,
  Info,
  ShieldCheck,
} from 'lucide-react';
import {
  NotificationService,
  StudyAlert,
  NotificationPreferences,
} from '../services/notificationService';
import { ActiveScreen } from '../types/studymate';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: StudyAlert[];
  onNavigate: (screen: ActiveScreen) => void;
  onShowToast: (msg: string) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  alerts,
  onNavigate,
  onShowToast,
}) => {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    NotificationService.getPermission()
  );
  const [prefs, setPrefs] = useState<NotificationPreferences>(
    NotificationService.getPreferences()
  );
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const result = await NotificationService.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      onShowToast('✓ دسترسی نوتیفیکیشن با موفقیت فعال شد!');
      // Trigger instant welcome test notification
      await NotificationService.sendSystemNotification('🎓 استادی‌میت | نوتیفیکیشن فعال شد', {
        body: 'از این پس یادآورهای شب آزمون، ددلاین پارت‌ها و گزارش روزانه به شما یادآوری می‌شود.',
      });
    } else if (result === 'denied') {
      onShowToast('⚠️ دسترسی توسط مرورگر رد شد. لطفاً از تنظیمات مرورگر سایت را مجاز کنید.');
    }
  };

  const handleTogglePref = (key: keyof NotificationPreferences) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    NotificationService.savePreferences(updated);
    onShowToast('✓ تنظیمات اعلان ذخیره شد');
  };

  const handleSendTestNotification = async () => {
    setIsTesting(true);
    NotificationService.playAlertSound();
    const success = await NotificationService.sendSystemNotification(
      '🔔 آزمایشی: یادآوری شب آزمون قلم‌چی',
      {
        body: 'فردا آزمون جامع داری! مرور خلاصه‌نویسی‌ها و تنظیم ساعت خواب فراموش نشود.',
        tag: 'test-notification',
      }
    );
    setIsTesting(false);

    if (success) {
      onShowToast('✓ نوتیفیکیشن تستی به گوشی ارسال شد!');
    } else {
      onShowToast('⚠️ نوتیفیکیشن آزمایشی در برنامه پخش شد (دسترسی سیستمی غیرفعال است).');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-4 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-reverse space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#BE123C] flex items-center justify-center text-white">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold">مرکز اعلانات و یادآورها</h2>
              <p className="text-[11px] text-slate-300">شب آزمون، ددلاین‌ها و گزارش روزانه</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-slate-800 text-xs">
          {/* Permission Status Banner */}
          <div className="p-3.5 rounded-xl border bg-slate-50 border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center space-x-reverse space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>وضعیت نوتیفیکیشن سیستم:</span>
              </span>
              {permission === 'granted' ? (
                <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                  فعال و مجاز
                </span>
              ) : permission === 'denied' ? (
                <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                  مسدود در مرورگر
                </span>
              ) : (
                <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full text-[10px]">
                  نیازمند تأیید
                </span>
              )}
            </div>

            {permission !== 'granted' ? (
              <div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  برای اینکه وقتی خارج از برنامه‌اید آلارم شب آزمون یا سررسید پارت‌های مطالعه روی
                  گوشی شما ظاهر شود، مجوز اعلان را تأیید کنید.
                </p>
                <button
                  onClick={handleRequestPermission}
                  className="mt-2 w-full py-2 bg-[#BE123C] hover:bg-[#9F1239] text-white font-bold rounded-lg transition shadow-xs flex items-center justify-center space-x-reverse space-x-1.5"
                >
                  <Bell className="w-4 h-4" />
                  <span>فعال‌سازی دریافت نوتیفیکیشن روی گوشی</span>
                </button>
              </div>
            ) : (
              <p className="text-slate-600 text-[11px]">
                اعلان‌های گوشی فعال هستند و هشدارهای مهم در زمان مقرر ارسال خواهند شد.
              </p>
            )}

            {/* Test Notification Button */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">تست صدا و پیام هشدار:</span>
              <button
                onClick={handleSendTestNotification}
                disabled={isTesting}
                className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold rounded-lg transition flex items-center space-x-reverse space-x-1 text-[11px]"
              >
                <Send className="w-3 h-3 text-[#BE123C]" />
                <span>ارسال اعلان تستی</span>
              </button>
            </div>
          </div>

          {/* Active Alerts List */}
          <div>
            <h3 className="font-extrabold text-slate-900 text-xs mb-2 flex items-center justify-between">
              <span>هشدارهای فعال تحصیلی شما ({alerts.length})</span>
            </h3>

            {alerts.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center text-slate-500 bg-slate-50/50">
                <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                <p className="font-medium text-xs">در حال حاضر همه چیز طبق برنامه است!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  هیچ آزمون فردا یا ددلاین عقب‌مانده‌ای ندارید.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-xl border transition flex flex-col space-y-1.5 ${
                      alert.priority === 'high'
                        ? 'bg-rose-50/70 border-rose-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs flex items-center space-x-reverse space-x-1">
                        {alert.type === 'exam_eve' ? (
                          <Calendar className="w-3.5 h-3.5 text-[#BE123C]" />
                        ) : alert.type === 'task_deadline' ? (
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                        ) : (
                          <Info className="w-3.5 h-3.5 text-blue-600" />
                        )}
                        <span>{alert.title}</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {alert.timestamp}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed">{alert.body}</p>

                    {alert.actionScreen && (
                      <div className="pt-1 flex justify-end">
                        <button
                          onClick={() => {
                            onNavigate(alert.actionScreen!);
                            onClose();
                          }}
                          className="text-[11px] font-bold text-[#BE123C] hover:underline flex items-center space-x-reverse space-x-1"
                        >
                          <span>مشاهده و اقدام</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preferences Toggles */}
          <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-3">
            <h4 className="font-extrabold text-slate-900 text-xs">شخصی‌سازی هشدارهای یادآور</h4>

            {/* Exam Alerts Toggle */}
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <div>
                <p className="font-bold text-slate-800">یادآوری شب آزمون و روز آزمون</p>
                <p className="text-[10px] text-slate-500">
                  ارسال هشدار ۲۴ ساعت قبل از آزمون‌های ثبت‌شده
                </p>
              </div>
              <button
                onClick={() => handleTogglePref('examAlerts')}
                className={`w-11 h-6 rounded-full transition relative ${
                  prefs.examAlerts ? 'bg-[#BE123C]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition transform ${
                    prefs.examAlerts ? 'right-0.5' : 'right-5.5'
                  }`}
                />
              </button>
            </div>

            {/* Task Deadline Toggle */}
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <div>
                <p className="font-bold text-slate-800">هشدار پایان ددلاین پارت‌ها</p>
                <p className="text-[10px] text-slate-500">
                  یادآوری کارهای انجام‌نشده و دارای اولویت بالا
                </p>
              </div>
              <button
                onClick={() => handleTogglePref('taskAlerts')}
                className={`w-11 h-6 rounded-full transition relative ${
                  prefs.taskAlerts ? 'bg-[#BE123C]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition transform ${
                    prefs.taskAlerts ? 'right-0.5' : 'right-5.5'
                  }`}
                />
              </button>
            </div>

            {/* Nightly Review Toggle */}
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <div>
                <p className="font-bold text-slate-800">یادآوری ثبت گزارش شبانه</p>
                <p className="text-[10px] text-slate-500">
                  اعلان در پایان روز برای تکمیل پارت‌ها و تست‌ها
                </p>
              </div>
              <button
                onClick={() => handleTogglePref('nightlyReviewAlerts')}
                className={`w-11 h-6 rounded-full transition relative ${
                  prefs.nightlyReviewAlerts ? 'bg-[#BE123C]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition transform ${
                    prefs.nightlyReviewAlerts ? 'right-0.5' : 'right-5.5'
                  }`}
                />
              </button>
            </div>

            {/* Sound Chime Toggle */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center space-x-reverse space-x-1.5">
                {prefs.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-slate-700" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
                <div>
                  <p className="font-bold text-slate-800">پخش ملودی آلارم (Chime)</p>
                  <p className="text-[10px] text-slate-500">صدای اختصاصی هنگام ارسال یادآورها</p>
                </div>
              </div>
              <button
                onClick={() => handleTogglePref('soundEnabled')}
                className={`w-11 h-6 rounded-full transition relative ${
                  prefs.soundEnabled ? 'bg-[#BE123C]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition transform ${
                    prefs.soundEnabled ? 'right-0.5' : 'right-5.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition text-xs shadow-xs"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
