import type { PlanCourse, StudentProfile } from '../types/student';
import { calculateStudentProgress, getRegistrationEligibility, findScheduleConflicts } from './academicEngine';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedActions?: { label: string; action: string }[];
}

function normalizeArabic(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[إأآا]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '');
}

export function generateAssistantResponse(
  question: string,
  student: StudentProfile,
  courses: PlanCourse[],
): string {
  const q = normalizeArabic(question);
  const progress = calculateStudentProgress(student, courses);
  const latestSemester = student.semesterHistory[student.semesterHistory.length - 1];
  const active = student.currentRegisteredSections;

  // 1. الأمور المالية والرسوم (Prioritized before general numbers/hours)
  if (/مالي|ماليه|رسوم|دفع|دفعات|قسط|اقساط|رصيد|فلوس|فاتوره|ذمه/.test(q)) {
    const fin = student.financialSummary;
    const balance = fin.currentBalance;
    const balanceMsg =
      balance > 0
        ? `المبلغ المستحق الدفع حالياً هو **${balance.toFixed(2)} د.أ**.`
        : `حسابك المالي مسدد بالكامل ولا توجد أي التزامات مالية مستحقة.`;
    return `💳 **الملف المالي لجامعة NextAura:**\n- **الرصيد السابق:** ${fin.previousBalance.toFixed(2)} د.أ\n- **إجمالي رسوم الفصل:** ${fin.totalFees.toFixed(2)} د.أ\n- **إجمالي الدفعات المسددة:** ${fin.totalPayments.toFixed(2)} د.أ\n- **الحالة:** ${balanceMsg}\n\nيمكنك إجراء دفعة تجريبية فورية عبر صفحة "المركز المالي".`;
  }

  // 2. الامتحانات
  if (/امتحان|امتحانات|فاينل|ميد|قاعه|مقعد/.test(q)) {
    const ex = student.exams;
    if (!ex || !ex.length) {
      return 'لم يتم الإعلان عن مواعيد امتحانات جديدة حتى الآن للفصل الحالي.';
    }
    const upcoming = [...ex].sort((a, b) => a.date.localeCompare(b.date));
    const list = upcoming
      .slice(0, 4)
      .map(
        (e) =>
          `• **${e.courseName}** [${e.examType}]\n  التاريخ: ${e.dayName} ${e.date} (${e.time}) | القاعة: ${e.room}${e.seatNumber ? ` | المقعد: ${e.seatNumber}` : ''}`,
      )
      .join('\n\n');
    return `📝 **جدول أقرب الامتحانات المعلنة:**\n\n${list}`;
  }

  // 3. الغيابات والإنذارات
  if (/غياب|غيابات|حرمان|حضور|انذار/.test(q)) {
    const abs = student.absences;
    if (!abs || !abs.length) {
      return 'سجل حضورك منتظم ولا توجد أي غيابات مسجلة بحقك للفصل الحالي.';
    }
    const warningCourses = abs.filter((a) => a.status === 'تنبيه' || a.status === 'مرتفع');
    let msg = `📋 **موجز سجل الغياب للفصل الحالي:**\n`;
    abs.forEach((a) => {
      msg += `• **${a.courseName}:** ${a.absencesCount} غيابات (${a.absencePercentage}% من المحاضرات) — الحالة: ${a.status}\n`;
    });
    if (warningCourses.length > 0) {
      msg += `\n⚠️ **تنبيه:** لديك (${warningCourses.length}) مساق يقترب من حد الحرمان المسموح (15%). يُرجى الحرص على الالتزام وتقديم الأعذار الرسمية.`;
    }
    return msg;
  }

  // 4. التعارضات
  if (/تعارض|تعارضات|تضارب/.test(q)) {
    const conflicts = findScheduleConflicts(active);
    if (!conflicts.length) {
      return '✅ جدولك الدراسي سليم ومثالي، ولا يوجد أي تعارض زمني بين شعبك المسجلة حالياً.';
    }
    return `⚠️ **تم رصد تعارض زمني في جدولك:**\n${conflicts.map((c) => `• ${c.reason}`).join('\n')}\nيرجى تعديل الشعبة من صفحة السحب والإضافة.`;
  }

  // 5. المواد المؤهلة للتسجيل واقتراح المساقات
  if (/اقدر|استطيع|مؤهل|انزل|اسجل|تسجيل|اقتراح|انصحني/.test(q)) {
    const eligible = courses.filter(
      (c) => getRegistrationEligibility(c.code, student, courses).state === 'ELIGIBLE',
    );
    if (!eligible.length) {
      return 'لا تتوفر مواد مستوفية للشروط ظاهرة حالياً؛ يرجى مراجعة مرشدك الأكاديمي أو التحقق من المتطلبات السابقة في الخطة.';
    }
    const sample = eligible.slice(0, 8);
    const formatted = sample
      .map((c) => `• **${c.name}** (${c.code}) — ${c.credits} ساعات [${c.group}]`)
      .join('\n');
    return `✨ **المساقات المقترحة التي استوفيت متطلباتها السابقة ويحق لك تسجيلها:**\n\n${formatted}\n\n🔎 تتوفر ${eligible.length} مادة مؤهلة إجمالاً. توجه إلى صفحة "تسجيل المواد" لاختيار الشعب المتوافقة مع وقتك.`;
  }

  // 6. GPA / معدل
  if (/معدل|gpa|علامات|علاماتي|تقدير|شرف/.test(q)) {
    const semGpa = latestSemester?.semesterGpa ? `${latestSemester.semesterGpa.toFixed(1)}%` : 'غير متوفر';
    const cumGpa = latestSemester?.cumulativeGpa ? `${latestSemester.cumulativeGpa.toFixed(1)}%` : 'غير متوفر';
    const standing = student.academicStatus;
    return `مرحباً بك يا ${student.name.split(' ')[0]}!\n\n📊 **ملخص أدائك الأكاديمي الحالي في جامعة NextAura:**\n- **المعدل التراكمي:** ${cumGpa}\n- **المعدل الفصلي الأخير:** ${semGpa}\n- **الحالة الأكاديمية:** ${standing}\n\n💡 يمكنك استخدام صفحة "محاكاة المعدل" لاحتساب المعدل المتوقع عند تحصيل درجات معينة هذا الفصل.`;
  }

  // 7. الجدول والمواد المسجلة
  if (/مسجل|جدول|شعب|محاضره|محاضرات|دوام/.test(q)) {
    if (!active.length) {
      return 'لا توجد مساقات مسجلة في جدولك للفصل الحالي. يمكنك الانتقال إلى صفحة "تسجيل المواد" لاختيار شعبك.';
    }
    const list = active
      .map(
        (s) =>
          `• **${s.courseName}** (${s.courseCode})\n  الشعبة: ${s.sectionNumber} | الأيام: ${s.days} (${s.startTime}–${s.endTime}) | القاعة: ${s.room} | المدرس: ${s.instructor}`,
      )
      .join('\n\n');
    return `📅 **جدولك الدراسي للفصل الحالي (${active.reduce((n, s) => n + s.credits, 0)} ساعة):**\n\n${list}`;
  }

  // 8. الساعات / التخرج
  if (/ساعه|ساعات|تخرج|متطلبات|متبقي|انجاز|خطه/.test(q)) {
    return `🎓 **مسارك نحو التخرج من جامعة NextAura:**\n- **الساعات المنجزة:** ${progress.totalCompletedHours} من أصل ${progress.totalPlanHours} ساعة معتمدة.\n- **الساعات المتبقية:** ${progress.remainingHours} ساعة.\n- **الساعات المسجلة هذا الفصل:** ${active.reduce((n, s) => n + s.credits, 0)} ساعة.\n- **نسبة الإنجاز الإجمالية:** ${progress.completionPercentage}% من الخطة الدراسية.`;
  }

  // Default friendly response
  return `أهلاً بك يا ${student.name.split(' ')[0]} في **جامعة NextAura**! 🌟\n\nأنا مساعدك الأكاديمي الذكي، مستعد للإجابة عن:\n- تفاصيل معدلك التراكمي والفصلي ومحاكاة الدرجات.\n- متطلبات التخرج والساعات المتبقية من خطتك الدراسية.\n- اقتراح المساقات المتاحة للتسجيل وفق استيفاء الشروط.\n- جدول المحاضرات، القاعات، الامتحانات، وسجل الغيابات.\n- رصيدك المالي والرسوم المستحقة.\n\nكيف يمكنني مساعدتك اليوم؟`;
}
