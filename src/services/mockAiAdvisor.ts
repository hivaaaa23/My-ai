/**
 * Mock AI Advisor Service for Iranian Konkur
 * Provides contextual, intelligent Persian study recommendations and answers.
 * Ready to be swapped with server-side Gemini API in the future.
 */

export interface AdvisorResponse {
  text: string;
  suggestedAction?: {
    type: 'add_task' | 'plan_study' | 'review';
    title: string;
  };
}

export async function generateMockAiReply(userQuery: string): Promise<AdvisorResponse> {
  // Simulate natural brief AI thinking time
  await new Promise((resolve) => setTimeout(resolve, 800));

  const lower = userQuery.toLowerCase().trim();

  if (lower.includes('زیست') || lower.includes('زیست‌شناسی')) {
    return {
      text: `برای درس زیست‌شناسی کنکور، اولویت اول تسلط صددرصدی روی خط‌به‌خط متن کتاب درسی و تمام قیدها و اشکال است. 
پیشنهاد مشاوره‌ای من:
۱. مطالعه پاراگرافی همراه با طرح سوال ذهنی
۲. بررسی شکل‌ها و کشیدن نمودار درختی فرایندها
۳. حل تست‌های مضربی بلافاصله پس از مطالعه برای تثبیت مفاهیم
۴. تحلیل دقیق تک‌تک گزینه‌ها در پاسخ‌نامه تشریحی (حتی گزینه‌های غلط).`,
      suggestedAction: {
        type: 'add_task',
        title: 'حل ۳۵ تست زیست دوازدهم + هایلایت قیدهای مهم کتاب',
      },
    };
  }

  if (lower.includes('شیمی') || lower.includes('مسائل')) {
    return {
      text: `در درس شیمی، سوالات به دو بخش «مفاهیم و حفظیات» و «مسائل استوکیومتری و تعادل» تقسیم می‌شوند.
راهکار عملیاتی:
• برای حفظیات: خلاصه‌نویسی دست‌نویس از جدول تناوبی، رنگ رسوب‌ها و واکنش‌ها
• برای مسائل: تمرین روزانه ۱۰ مسئله سرعتی با تکنیک کسر تبدیل بدون استفاده از ماشین‌حساب.`,
      suggestedAction: {
        type: 'add_task',
        title: 'تمرین ۱۰ مسئله استوکیومتری شیمی در ۱۵ دقیقه',
      },
    };
  }

  if (lower.includes('فیزیک') || lower.includes('فرمول')) {
    return {
      text: `در فیزیک، حفظ کردن فرمول بدون درک شهودی جواب نمی‌دهد!
توصیه من این است که یک «دفترچه فرمول و تله‌های تستی» داشته باشی و برای هر تیپ تست، روند رسم شکل، تحلیل نیروها و تعیین علامت‌ها را علامت‌گذاری کنی. در فصل‌های دینامیک و حرکت‌شناسی، رسم شکل نیمی از راه حل است.`,
      suggestedAction: {
        type: 'add_task',
        title: 'رسم نمودار درختی فرمول‌های حرکت با شتاب ثابت',
      },
    };
  }

  if (lower.includes('خستگی') || lower.includes('انگیزه') || lower.includes('تمرکز') || lower.includes('استرس')) {
    return {
      text: `خستگی در دوران کنکور کاملاً طبیعی است و نشانه ضعف تو نیست، بلکه نشانه تلاش جدی توست!
برای بازگرداندن انرژی:
۱. روش ۲۵ دقیقه مطالعه و ۵ دقیقه استراحت (پومودورو) را تست کن.
۲. هنگام استراحت سراغ گوشی نرو؛ چند نفس عمیق بکش و کمی آب بنوش.
۳. درس‌های تحلیلی (ریاضی/فیزیک) را در ساعاتی که سرحال‌تری و دروس خواندنی را در زمان افت انرژی قرار بده.`,
    };
  }

  if (lower.includes('برنامه') || lower.includes('قلم‌چی') || lower.includes('سنجش') || lower.includes('آزمون')) {
    return {
      text: `برای آزمون‌های آزمایشی، استراتژی «هفته اول یادگیری عمیق، هفته دوم تست زمان‌دار و مرور» بهترین نتیجه را می‌دهد.
فراموش نکن که ارزش «تحلیل آزمون» در بعدازظهر جمعه کمتر از خود آزمون صبح نیست؛ تمام سوالات غلط و نزده باید علت‌یابی شوند.`,
      suggestedAction: {
        type: 'plan_study',
        title: 'تنظیم وقت تحلیل آزمون در جدول برنامه‌ریزی',
      },
    };
  }

  // General helpful response
  return {
    text: `پیامت رو دریافت کردم! به عنوان مشاور همراهت، توصیه می‌کنم همیشه تعادل بین تست آموزشی و تست زمان‌دار رو حفظ کنی. پیوستگی در مطالعه و ثبت دقیق ساعت مطالعه روزانه کلید موفقیت در کنکور سراسریه. اگر در مورد برنامه‌ریزی درس خاصی سوال داری، اسم درس رو بگو تا دقیق بررسی کنیم!`,
    suggestedAction: {
      type: 'review',
      title: 'بررسی وظایف بازمانده امروز در بخش برنامه‌ها',
    },
  };
}
