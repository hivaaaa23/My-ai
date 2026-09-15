/**
 * Persian Date, Number, and Countdown Utilities for StudyMate
 */

export const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return '';
  return String(num).replace(/[0-9]/g, (w) => PERSIAN_DIGITS[+w]);
}

export function formatMinutesToPersianTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) {
    return `${toPersianDigits(h)} ساعت و ${toPersianDigits(m)} دقیقه`;
  } else if (h > 0) {
    return `${toPersianDigits(h)} ساعت`;
  }
  return `${toPersianDigits(m)} دقیقه`;
}

/**
 * Calculates remaining days from now until a target ISO date string (YYYY-MM-DD)
 */
export function calculateDaysRemaining(targetDateStr: string): {
  days: number;
  label: string;
  isPast: boolean;
  isToday: boolean;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { days: 0, label: 'امروز', isPast: false, isToday: true };
  } else if (diffDays === 1) {
    return { days: 1, label: 'فردا', isPast: false, isToday: false };
  } else if (diffDays === 2) {
    return { days: 2, label: 'پس‌فردا', isPast: false, isToday: false };
  } else if (diffDays > 0) {
    return {
      days: diffDays,
      label: `${toPersianDigits(diffDays)} روز مانده`,
      isPast: false,
      isToday: false,
    };
  } else {
    return {
      days: Math.abs(diffDays),
      label: `${toPersianDigits(Math.abs(diffDays))} روز گذشته`,
      isPast: true,
      isToday: false,
    };
  }
}

/**
 * Maps DayOfWeek to Persian labels
 */
export const PERSIAN_WEEKDAYS: Record<string, { full: string; short: string }> = {
  saturday: { full: 'شنبه', short: 'ش' },
  sunday: { full: 'یک‌شنبه', short: 'ی' },
  monday: { full: 'دوشنبه', short: 'د' },
  tuesday: { full: 'سه‌شنبه', short: 'س' },
  wednesday: { full: 'چهارشنبه', short: 'چ' },
  thursday: { full: 'پنج‌شنبه', short: 'پ' },
};

/**
 * Formats a date string to readable Persian text
 */
export function formatPersianDateString(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${toPersianDigits(parts[0])}/${toPersianDigits(parts[1])}/${toPersianDigits(parts[2])}`;
    }
    return toPersianDigits(dateStr);
  } catch {
    return dateStr;
  }
}

/**
 * Returns today's date formatted in Persian text with weekday
 */
export function getTodayPersianDisplay(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'persian',
  };
  try {
    return new Intl.DateTimeFormat('fa-IR', options).format(now);
  } catch {
    // Fallback if Intl Persian is unavailable
    const dayNames = ['یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
    return `${dayNames[now.getDay()]} - ${toPersianDigits(now.getDate())} / ${toPersianDigits(now.getMonth() + 1)}`;
  }
}
