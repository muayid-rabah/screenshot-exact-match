import { demoStudents } from '../data/demoStudents';
import { offeredCourseSections } from '../data/offeredSections';
import { allPlanCourses, loadStudentState, saveStudentState } from '../lib/student-store';
import {
  calculateStudentProgress,
  getRegistrationEligibility,
  checkSectionConflict,
  findScheduleConflicts,
  getCourseStatusForStudent,
} from '../services/academicEngine';
import { generateAssistantResponse } from '../services/smartAssistant';
import type { CourseSection, StudentProfile } from '../types/student';

// CORS response helper
function corsJson(data: any, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    },
  });
}

function corsOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    },
  });
}

// In-memory runtime student cache for server-side persistence
const serverStudentCache = new Map<string, StudentProfile>();

function getStudent(id?: string | null): StudentProfile | null {
  if (!id) return demoStudents[0];
  const cached = serverStudentCache.get(id);
  if (cached) return cached;
  const found = demoStudents.find((s) => s.universityId === id || s.id === id);
  if (found) {
    serverStudentCache.set(found.universityId, { ...found });
    return serverStudentCache.get(found.universityId)!;
  }
  return null;
}

// Global runtime sections for capacity mutations
let runtimeOfferedSections: CourseSection[] = [...offeredCourseSections];

export async function handleApiRequest(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return corsOptions();
  }

  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, ''); // strip trailing slash

  // 1. API Root & Info
  if (pathname === '/api' || pathname === '/api/info') {
    return corsJson({
      university: 'جامعة NextAura | NextAura University',
      tagline: 'البوابة الأكاديمية الذكية المتكاملة',
      version: '1.0.0',
      currentSemester: '2025/2026 - الفصل الثاني',
      documentation: '/api/docs',
      openapi: '/api/openapi.json',
      endpoints: [
        { path: 'GET /api/info', description: 'معلومات عامة عن الجامعة والبوابة والأطراف المتاحة' },
        { path: 'GET /api/students', description: 'قائمة الطلاب المتاحين مع ملخص دراسي' },
        { path: 'GET /api/student?id={universityId}', description: 'الملف الأكاديمي والمالي الشامل للطالب' },
        { path: 'GET /api/schedule?studentId={id}', description: 'الجدول الدراسي الأسبوعي وحالة التعارضات' },
        { path: 'GET /api/plan?studentId={id}', description: 'الخطة الدراسية كاملة (132 ساعة) وحالات الإنجاز' },
        { path: 'GET /api/eligible-courses?studentId={id}', description: 'المساقات المؤهلة للتسجيل وفق المتطلبات السابقة' },
        { path: 'GET /api/offered-sections', description: 'المواد والشعب المطروحة والمقاعد الشاغرة' },
        { path: 'GET /api/exams?studentId={id}', description: 'جدول الامتحانات والقاعات والمقاعد' },
        { path: 'GET /api/absences?studentId={id}', description: 'سجل الغيابات ونسب الحرمان لكل مساق' },
        { path: 'GET /api/financial?studentId={id}', description: 'المركز المالي، الرسوم، الدفعات، وكشف الحساب' },
        { path: 'POST /api/assistant/chat', description: 'المساعد الذكي (NextAura AI) للإجابة اللغوية المباشرة' },
        { path: 'POST /api/registration/add', description: 'إضافة مساق إلى الجدول الدراسي' },
        { path: 'POST /api/registration/drop', description: 'سحب مساق من الجدول الدراسي' },
      ],
    });
  }

  // 2. Students List
  if (pathname === '/api/students') {
    const list = demoStudents.map((s) => ({
      universityId: s.universityId,
      name: s.name,
      faculty: s.faculty,
      major: s.major,
      academicStatus: s.academicStatus,
      profileType: s.profileType,
      earnedCredits: s.earnedCredits,
      currentRegisteredCredits: s.currentRegisteredSections.reduce((n, sec) => n + sec.credits, 0),
      currentBalance: s.financialSummary.currentBalance,
      latestCumulativeGpa: s.semesterHistory[s.semesterHistory.length - 1]?.cumulativeGpa || 0,
    }));
    return corsJson({ count: list.length, students: list });
  }

  // 3. Single Student Details
  if (pathname === '/api/student') {
    const id = url.searchParams.get('id') || url.searchParams.get('universityId');
    const student = getStudent(id);
    if (!student) {
      return corsJson({ error: 'الطالب غير موجود. يرجى تزويد رقم جامعي صالح.' }, 404);
    }
    const progress = calculateStudentProgress(student, allPlanCourses);
    return corsJson({
      universityId: student.universityId,
      name: student.name,
      faculty: student.faculty,
      major: student.major,
      degree: student.degree,
      studyType: student.studyType,
      admissionYear: student.admissionYear,
      academicAdvisor: student.academicAdvisor,
      academicStatus: student.academicStatus,
      progress: {
        totalPlanHours: progress.totalPlanHours,
        totalCompletedHours: progress.totalCompletedHours,
        remainingHours: progress.remainingHours,
        currentRegisteredHours: progress.currentRegisteredHours,
        completionPercentage: progress.completionPercentage,
      },
      currentRegisteredSections: student.currentRegisteredSections,
      financialSummary: student.financialSummary,
      absencesCount: student.absences.length,
      upcomingExamsCount: student.exams.length,
      semesterHistory: student.semesterHistory,
    });
  }

  // 4. Student Schedule
  if (pathname === '/api/schedule') {
    const id = url.searchParams.get('studentId') || url.searchParams.get('id');
    const student = getStudent(id);
    if (!student) {
      return corsJson({ error: 'الطالب غير موجود' }, 404);
    }
    const conflicts = findScheduleConflicts(student.currentRegisteredSections);
    const totalCredits = student.currentRegisteredSections.reduce((n, s) => n + s.credits, 0);

    // Group by days
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    const weeklySchedule: Record<string, CourseSection[]> = {};
    days.forEach((day) => {
      weeklySchedule[day] = student.currentRegisteredSections.filter((s) => s.daysArray.includes(day));
    });

    return corsJson({
      studentId: student.universityId,
      studentName: student.name,
      totalCredits,
      hasConflicts: conflicts.length > 0,
      conflicts,
      registeredSections: student.currentRegisteredSections,
      weeklySchedule,
    });
  }

  // 5. Degree Plan (132 credits)
  if (pathname === '/api/plan') {
    const id = url.searchParams.get('studentId') || url.searchParams.get('id');
    const student = getStudent(id);
    if (!student) {
      return corsJson({ error: 'الطالب غير موجود' }, 404);
    }
    const progress = calculateStudentProgress(student, allPlanCourses);
    const categorizedCourses = allPlanCourses.map((c) => ({
      ...c,
      status: getCourseStatusForStudent(c, student),
      eligibility: getRegistrationEligibility(c.code, student, allPlanCourses),
    }));

    return corsJson({
      studentId: student.universityId,
      studentName: student.name,
      progress,
      coursesCount: categorizedCourses.length,
      courses: categorizedCourses,
    });
  }

  // 6. Eligible Courses For Registration
  if (pathname === '/api/eligible-courses') {
    const id = url.searchParams.get('studentId') || url.searchParams.get('id');
    const student = getStudent(id);
    if (!student) {
      return corsJson({ error: 'الطالب غير موجود' }, 404);
    }
    const eligible = allPlanCourses
      .map((c) => ({
        course: c,
        eligibility: getRegistrationEligibility(c.code, student, allPlanCourses),
      }))
      .filter((item) => item.eligibility.state === 'ELIGIBLE')
      .map((item) => ({
        code: item.course.code,
        name: item.course.name,
        credits: item.course.credits,
        group: item.course.group,
        prerequisites: item.course.prerequisites,
      }));

    return corsJson({
      studentId: student.universityId,
      studentName: student.name,
      eligibleCoursesCount: eligible.length,
      eligibleCourses: eligible,
    });
  }

  // 7. Offered Course Sections Catalog
  if (pathname === '/api/offered-sections') {
    const courseCode = url.searchParams.get('courseCode');
    let sections = runtimeOfferedSections;
    if (courseCode) {
      sections = sections.filter((s) => s.courseCode === courseCode);
    }
    return corsJson({
      totalOfferedSections: sections.length,
      sections,
    });
  }

  // 8. Exams Schedule
  if (pathname === '/api/exams') {
    const id = url.searchParams.get('studentId') || url.searchParams.get('id');
    const student = getStudent(id);
    if (!student) {
      return corsJson({ error: 'الطالب غير موجود' }, 404);
    }
    return corsJson({
      studentId: student.universityId,
      studentName: student.name,
      examsCount: student.exams.length,
      exams: student.exams,
    });
  }

  // 9. Absences & Attendance Report
  if (pathname === '/api/absences') {
    const id = url.searchParams.get('studentId') || url.searchParams.get('id');
    const student = getStudent(id);
    if (!student) {
      return corsJson({ error: 'الطالب غير موجود' }, 404);
    }
    const warningCourses = student.absences.filter((a) => a.status === 'تنبيه' || a.status === 'مرتفع');
    return corsJson({
      studentId: student.universityId,
      studentName: student.name,
      hasWarnings: warningCourses.length > 0,
      warningCourses,
      absences: student.absences,
    });
  }

  // 10. Financial Account Ledger
  if (pathname === '/api/financial') {
    const id = url.searchParams.get('studentId') || url.searchParams.get('id');
    const student = getStudent(id);
    if (!student) {
      return corsJson({ error: 'الطالب غير موجود' }, 404);
    }
    return corsJson({
      studentId: student.universityId,
      studentName: student.name,
      summary: student.financialSummary,
      transactions: student.transactions,
    });
  }

  // 11. Smart AI Assistant Chat Endpoint
  if (pathname === '/api/assistant/chat' || pathname === '/api/chat') {
    if (request.method !== 'POST') {
      return corsJson({ error: 'طريقة الطلب يجب أن تكون POST' }, 405);
    }
    try {
      const body = await request.json();
      const message = body?.message || body?.question || body?.prompt || '';
      const studentId = body?.studentId || body?.id || '202310001';
      const student = getStudent(studentId) || demoStudents[0];

      if (!message.trim()) {
        return corsJson({ error: 'حقل message مطلوب' }, 400);
      }

      const reply = generateAssistantResponse(message, student, allPlanCourses);
      return corsJson({
        reply,
        studentId: student.universityId,
        studentName: student.name,
        timestamp: new Date().toISOString(),
      });
    } catch (e: any) {
      return corsJson({ error: 'فشل معالجة الطلب: ' + (e.message || String(e)) }, 400);
    }
  }

  // 12. Register Course Section
  if (pathname === '/api/registration/add') {
    if (request.method !== 'POST') {
      return corsJson({ error: 'طريقة الطلب يجب أن تكون POST' }, 405);
    }
    try {
      const body = await request.json();
      const studentId = body?.studentId;
      const sectionId = body?.sectionId;
      const student = getStudent(studentId);
      if (!student) {
        return corsJson({ error: 'الطالب غير موجود' }, 404);
      }
      const section = runtimeOfferedSections.find((s) => s.id === sectionId);
      if (!section) {
        return corsJson({ error: 'الشعبة غير موجودة' }, 404);
      }

      // Check already completed
      if (student.completedCourses.includes(section.courseCode)) {
        return corsJson({ success: false, message: 'المساق مجتاز ومستوفى سابقاً في سجلك الأكاديمي.' }, 400);
      }
      // Check already registered
      if (student.currentRegisteredSections.some((s) => s.courseCode === section.courseCode)) {
        return corsJson({ success: false, message: 'المساق مسجل بالفعل في جدولك الحالي.' }, 400);
      }
      // Check capacity
      if (section.enrolled >= section.capacity || section.status === 'ممتلئة') {
        return corsJson({ success: false, message: 'هذه الشعبة ممتلئة تماماً.' }, 400);
      }
      // Check prerequisites
      const eligibility = getRegistrationEligibility(section.courseCode, student, allPlanCourses);
      if (eligibility.state !== 'ELIGIBLE') {
        return corsJson({ success: false, message: eligibility.reason || 'المتطلبات السابقة غير مستوفاة' }, 400);
      }
      // Check conflict
      const conflict = student.currentRegisteredSections.find((s) => checkSectionConflict(section, s));
      if (conflict) {
        return corsJson(
          {
            success: false,
            message: `تعارض زمني مع مساق "${conflict.courseName}" (${conflict.days} ${conflict.startTime}-${conflict.endTime})`,
          },
          400,
        );
      }

      // Success: register
      section.enrolled += 1;
      if (section.enrolled >= section.capacity) section.status = 'ممتلئة';
      student.currentRegisteredSections.push(section);

      const fee = section.credits * 40;
      student.financialSummary.totalFees += fee;
      student.financialSummary.currentBalance += fee;
      student.transactions.unshift({
        id: `TXN-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        reference: `API-REG-${section.sectionNumber}`,
        statement: `تسجيل مساق ${section.courseName} (${section.credits} ساعات)`,
        debit: fee,
        credit: 0,
        balance: student.financialSummary.currentBalance,
      });

      return corsJson({
        success: true,
        message: `تم تسجيل مساق "${section.courseName}" بنجاح`,
        registeredSection: section,
        currentSchedule: student.currentRegisteredSections,
      });
    } catch (e: any) {
      return corsJson({ error: e.message || String(e) }, 400);
    }
  }

  // 13. Drop Course Section
  if (pathname === '/api/registration/drop') {
    if (request.method !== 'POST') {
      return corsJson({ error: 'طريقة الطلب يجب أن تكون POST' }, 405);
    }
    try {
      const body = await request.json();
      const studentId = body?.studentId;
      const sectionId = body?.sectionId;
      const student = getStudent(studentId);
      if (!student) return corsJson({ error: 'الطالب غير موجود' }, 404);

      const index = student.currentRegisteredSections.findIndex((s) => s.id === sectionId);
      if (index === -1) {
        return corsJson({ success: false, message: 'الشعبة غير مسجلة في جدول الطالب' }, 400);
      }
      const [dropped] = student.currentRegisteredSections.splice(index, 1);
      const sec = runtimeOfferedSections.find((s) => s.id === sectionId);
      if (sec) {
        sec.enrolled = Math.max(0, sec.enrolled - 1);
        if (sec.enrolled < sec.capacity && sec.status === 'ممتلئة') sec.status = 'متاحة';
      }

      const fee = dropped.credits * 40;
      student.financialSummary.totalFees = Math.max(0, student.financialSummary.totalFees - fee);
      student.financialSummary.currentBalance = Math.max(0, student.financialSummary.currentBalance - fee);

      return corsJson({
        success: true,
        message: `تم إسقاط مساق "${dropped.courseName}" بنجاح`,
        droppedSection: dropped,
        currentSchedule: student.currentRegisteredSections,
      });
    } catch (e: any) {
      return corsJson({ error: e.message || String(e) }, 400);
    }
  }

  // 14. OpenAPI 3.0 Specification
  if (pathname === '/api/openapi.json') {
    return corsJson(generateOpenApiSpec());
  }

  // 15. Interactive Documentation HTML
  if (pathname === '/api/docs') {
    return new Response(generateDocsHtml(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Fallback 404 for unknown /api/*
  return corsJson({ error: `المسار ${pathname} غير معروف. توجه إلى /api/info أو /api/docs للاطلاع على التوثيق.` }, 404);
}

function generateOpenApiSpec() {
  return {
    openapi: '3.0.0',
    info: {
      title: 'جامعة NextAura — University Academic & Student API',
      description: 'واجهة برمجة التطبيقات الرسمية لجامعة NextAura لربط المساعدات الذكية والأنظمة الخارجية.',
      version: '1.0.0',
    },
    servers: [{ url: '/api', description: 'NextAura API Gateway' }],
    paths: {
      '/info': {
        get: {
          summary: 'معلومات الجامعة والنظام',
          responses: { '200': { description: 'تفاصيل النظام' } },
        },
      },
      '/students': {
        get: {
          summary: 'قائمة الطلاب المتاحين',
          responses: { '200': { description: 'قائمة بجميع حسابات الطلاب' } },
        },
      },
      '/student': {
        get: {
          summary: 'الملف الأكاديمي الشامل لطالب محدد',
          parameters: [{ name: 'id', in: 'query', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'ملف الطالب' } },
        },
      },
      '/schedule': {
        get: {
          summary: 'الجدول الدراسي الأسبوعي للطالب',
          parameters: [{ name: 'studentId', in: 'query', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'الجدول الدراسي الأسبوعي وفحص التعارضات' } },
        },
      },
      '/plan': {
        get: {
          summary: 'الخطة الدراسية (132 ساعة) ومعدلات الإنجاز',
          parameters: [{ name: 'studentId', in: 'query', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'خطة الدرجة الكاملة' } },
        },
      },
      '/eligible-courses': {
        get: {
          summary: 'المساقات المؤهلة للتسجيل حالياً',
          parameters: [{ name: 'studentId', in: 'query', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'المساقات المستوفاة متطلباتها' } },
        },
      },
      '/offered-sections': {
        get: {
          summary: 'المواد والشعب المطروحة للفصل الحالي',
          parameters: [{ name: 'courseCode', in: 'query', required: false, schema: { type: 'string' } }],
          responses: { '200': { description: 'كتالوج الشعب المطروحة' } },
        },
      },
      '/exams': {
        get: {
          summary: 'جدول الامتحانات والقاعات والمقاعد',
          parameters: [{ name: 'studentId', in: 'query', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'مواعيد الامتحانات' } },
        },
      },
      '/absences': {
        get: {
          summary: 'سجل الغيابات ومؤشرات الحرمان',
          parameters: [{ name: 'studentId', in: 'query', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'سجل الحضور والغياب' } },
        },
      },
      '/financial': {
        get: {
          summary: 'المركز المالي وكشف الحساب',
          parameters: [{ name: 'studentId', in: 'query', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'الذمة المالية' } },
        },
      },
      '/assistant/chat': {
        post: {
          summary: 'المساعد الأكاديمي الذكي (NextAura AI Advisor)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    studentId: { type: 'string', example: '202310001' },
                    message: { type: 'string', example: 'كم معدلي وساعاتي المتبقية للتخرج؟' },
                  },
                  required: ['message'],
                },
              },
            },
          },
          responses: { '200': { description: 'إجابة المساعد الذكي' } },
        },
      },
      '/registration/add': {
        post: {
          summary: 'إضافة مساق إلى الجدول الدراسي',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    studentId: { type: 'string', example: '202310001' },
                    sectionId: { type: 'string', example: 'SEC-1505480-1' },
                  },
                  required: ['studentId', 'sectionId'],
                },
              },
            },
          },
          responses: { '200': { description: 'نتيجة التسجيل' } },
        },
      },
      '/registration/drop': {
        post: {
          summary: 'سحب مساق من الجدول الدراسي',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    studentId: { type: 'string', example: '202310001' },
                    sectionId: { type: 'string', example: 'SEC-1505480-1' },
                  },
                  required: ['studentId', 'sectionId'],
                },
              },
            },
          },
          responses: { '200': { description: 'نتيجة السحب' } },
        },
      },
    },
  };
}

function generateDocsHtml() {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NextAura University API Docs | توثيق واجهة برمجة جامعة NextAura</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&family=JetBrains+Mono:wght@400;600&display=swap">
  <style>
    :root {
      --bg: #0b1120;
      --card: #131d31;
      --border: #1e293b;
      --primary: #06b6d4;
      --primary-hover: #0891b2;
      --text: #f8fafc;
      --muted: #94a3b8;
      --accent: #3b82f6;
      --code-bg: #030712;
      --get-badge: #10b981;
      --post-badge: #6366f1;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Tajawal', sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 2rem 1rem;
    }
    .container { max-width: 1000px; margin: 0 auto; }
    header {
      border-bottom: 1px solid var(--border);
      padding-bottom: 2rem;
      margin-bottom: 2.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;
    }
    .brand { display: flex; align-items: center; gap: 1rem; }
    .logo-badge {
      background: linear-gradient(135deg, #06b6d4, #3b82f6);
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 20px;
    }
    h1 { font-size: 1.75rem; font-weight: 800; }
    .subtitle { color: var(--muted); font-size: 0.95rem; margin-top: 0.25rem; }
    .links-bar { display: flex; gap: 0.75rem; }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 600;
      transition: all 0.2s;
    }
    .btn:hover { border-color: var(--primary); color: var(--primary); }
    .btn-primary { background: var(--primary); color: #020617; border-color: var(--primary); }
    .btn-primary:hover { background: var(--primary-hover); }
    .intro-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }
    .endpoints-list { display: grid; gap: 1.25rem; }
    .endpoint {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      transition: border-color 0.2s;
    }
    .endpoint:hover { border-color: #334155; }
    .ep-header {
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      background: rgba(255,255,255,0.02);
      border-bottom: 1px solid var(--border);
      flex-wrap: wrap;
    }
    .ep-signature { display: flex; align-items: center; gap: 0.75rem; font-family: 'JetBrains Mono', monospace; font-size: 0.95rem; }
    .badge {
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.75rem;
      text-transform: uppercase;
    }
    .badge-get { background: rgba(16, 185, 129, 0.2); color: var(--get-badge); border: 1px solid rgba(16, 185, 129, 0.3); }
    .badge-post { background: rgba(99, 102, 241, 0.2); color: var(--post-badge); border: 1px solid rgba(99, 102, 241, 0.3); }
    .ep-desc { color: var(--muted); font-size: 0.9rem; }
    .ep-body { padding: 1.25rem; }
    pre {
      background: var(--code-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.9rem;
      overflow-x: auto;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      color: #38bdf8;
      direction: ltr;
      text-align: left;
    }
    .try-link {
      color: var(--primary);
      text-decoration: none;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      direction: ltr;
      display: inline-block;
      margin-top: 0.5rem;
    }
    .try-link:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <div class="logo-badge">NX</div>
        <div>
          <h1>NextAura University REST API</h1>
          <div class="subtitle">بوابة الربط والتكامل المباشر لمساعدات الذكاء الاصطناعي والتطبيقات الخارجية</div>
        </div>
      </div>
      <div class="links-bar">
        <a class="btn" href="/api/openapi.json" target="_blank">📄 OpenAPI Specification (JSON)</a>
        <a class="btn btn-primary" href="/api/info" target="_blank">🔍 API Root (JSON)</a>
      </div>
    </header>

    <div class="intro-card">
      <h2 style="margin-bottom: 0.5rem; font-size: 1.25rem;">🔗 كيفية ربط المساعد الذكي (AI Assistant / Agent)</h2>
      <p style="color: var(--muted); font-size: 0.95rem; line-height: 1.7;">
        تم تصميم جميع المسارات لتعمل بنسق <code>JSON</code> مع دعم كامل لـ <strong>CORS</strong>، مما يسمح لأي مساعد ذكي (Custom GPT, LangChain, Voiceflow, Botpress, Telegram Bot, إلخ) أو تطبيق جوال بالاتصال الفوري وقراءة واستعلام بيانات الطلاب والجدول والخطة والعلامات والأمور المالية، أو إرسال الأسئلة لمحرّك <strong>NextAura AI</strong> مباشرة.
      </p>
    </div>

    <div class="endpoints-list">
      <!-- 1 -->
      <div class="endpoint">
        <div class="ep-header">
          <div class="ep-signature">
            <span class="badge badge-get">GET</span>
            <span>/api/info</span>
          </div>
          <div class="ep-desc">معلومات الجامعة العامة ودليل المسارات</div>
        </div>
        <div class="ep-body">
          <a class="try-link" href="/api/info" target="_blank">تجربة: /api/info ↗</a>
        </div>
      </div>

      <!-- 2 -->
      <div class="endpoint">
        <div class="ep-header">
          <div class="ep-signature">
            <span class="badge badge-get">GET</span>
            <span>/api/students</span>
          </div>
          <div class="ep-desc">قائمة الطلاب المتاحين في النظام مع ملخص أكاديمي</div>
        </div>
        <div class="ep-body">
          <a class="try-link" href="/api/students" target="_blank">تجربة: /api/students ↗</a>
        </div>
      </div>

      <!-- 3 -->
      <div class="endpoint">
        <div class="ep-header">
          <div class="ep-signature">
            <span class="badge badge-get">GET</span>
            <span>/api/student?id=202310001</span>
          </div>
          <div class="ep-desc">الملف الأكاديمي والمالي الشامل لطالب محدد</div>
        </div>
        <div class="ep-body">
          <a class="try-link" href="/api/student?id=202310001" target="_blank">تجربة: /api/student?id=202310001 ↗</a>
        </div>
      </div>

      <!-- 4 -->
      <div class="endpoint">
        <div class="ep-header">
          <div class="ep-signature">
            <span class="badge badge-get">GET</span>
            <span>/api/schedule?studentId=202310001</span>
          </div>
          <div class="ep-desc">الجدول الدراسي الأسبوعي موزع حسب الأيام، مع فحص التعارضات</div>
        </div>
        <div class="ep-body">
          <a class="try-link" href="/api/schedule?studentId=202310001" target="_blank">تجربة: /api/schedule?studentId=202310001 ↗</a>
        </div>
      </div>

      <!-- 5 -->
      <div class="endpoint">
        <div class="ep-header">
          <div class="ep-signature">
            <span class="badge badge-get">GET</span>
            <span>/api/plan?studentId=202310001</span>
          </div>
          <div class="ep-desc">الخطة الدراسية كاملة (132 ساعة) ومعدل إنجاز المجموعات</div>
        </div>
        <div class="ep-body">
          <a class="try-link" href="/api/plan?studentId=202310001" target="_blank">تجربة: /api/plan?studentId=202310001 ↗</a>
        </div>
      </div>

      <!-- 6 -->
      <div class="endpoint">
        <div class="ep-header">
          <div class="ep-signature">
            <span class="badge badge-get">GET</span>
            <span>/api/eligible-courses?studentId=202310001</span>
          </div>
          <div class="ep-desc">المساقات التي استوفى الطالب متطلباتها السابقة ويحق له تسجيلها</div>
        </div>
        <div class="ep-body">
          <a class="try-link" href="/api/eligible-courses?studentId=202310001" target="_blank">تجربة: /api/eligible-courses?studentId=202310001 ↗</a>
        </div>
      </div>

      <!-- 7 -->
      <div class="endpoint">
        <div class="ep-header">
          <div class="ep-signature">
            <span class="badge badge-get">GET</span>
            <span>/api/offered-sections</span>
          </div>
          <div class="ep-desc">المواد والشعب المطروحة للفصل الحالي وسعة المقاعد</div>
        </div>
        <div class="ep-body">
          <a class="try-link" href="/api/offered-sections" target="_blank">تجربة: /api/offered-sections ↗</a>
        </div>
      </div>

      <!-- 8 -->
      <div class="endpoint">
        <div class="ep-header">
          <div class="ep-signature">
            <span class="badge badge-get">GET</span>
            <span>/api/exams?studentId=202310001</span>
          </div>
          <div class="ep-desc">جدول الامتحانات القادمة والقاعات وأرقام المقاعد</div>
        </div>
        <div class="ep-body">
          <a class="try-link" href="/api/exams?studentId=202310001" target="_blank">تجربة: /api/exams?studentId=202310001 ↗</a>
        </div>
      </div>

      <!-- 9 -->
      <div class="endpoint">
        <div class="ep-header">
          <div class="ep-signature">
            <span class="badge badge-get">GET</span>
            <span>/api/absences?studentId=202310001</span>
          </div>
          <div class="ep-desc">تقرير الغيابات ونسب الحرمان لكل مادة مسجلة</div>
        </div>
        <div class="ep-body">
          <a class="try-link" href="/api/absences?studentId=202310001" target="_blank">تجربة: /api/absences?studentId=202310001 ↗</a>
        </div>
      </div>

      <!-- 10 -->
      <div class="endpoint">
        <div class="ep-header">
          <div class="ep-signature">
            <span class="badge badge-get">GET</span>
            <span>/api/financial?studentId=202310001</span>
          </div>
          <div class="ep-desc">المركز المالي، الرسوم، والذمة المتبقية وكشف الحركات</div>
        </div>
        <div class="ep-body">
          <a class="try-link" href="/api/financial?studentId=202310001" target="_blank">تجربة: /api/financial?studentId=202310001 ↗</a>
        </div>
      </div>

      <!-- 11 -->
      <div class="endpoint">
        <div class="ep-header">
          <div class="ep-signature">
            <span class="badge badge-post">POST</span>
            <span>/api/assistant/chat</span>
          </div>
          <div class="ep-desc">محادثة المساعد الأكاديمي الذكي المباشرة (NLP Agent)</div>
        </div>
        <div class="ep-body">
          <p style="margin-bottom: 0.5rem; color: var(--muted); font-size: 0.85rem;">مثال على Body الطلب:</p>
          <pre>{
  "studentId": "202310001",
  "message": "كم معدلي التراكمي وكم ساعة متبقية للتخرج؟"
}</pre>
        </div>
      </div>

      <!-- 12 -->
      <div class="endpoint">
        <div class="ep-header">
          <div class="ep-signature">
            <span class="badge badge-post">POST</span>
            <span>/api/registration/add</span>
          </div>
          <div class="ep-desc">تسجيل شعبة لمساق (فحص التعارض والمتطلبات والسعة آلياً)</div>
        </div>
        <div class="ep-body">
          <pre>{
  "studentId": "202310001",
  "sectionId": "SEC-1505480-1"
}</pre>
        </div>
      </div>

      <!-- 13 -->
      <div class="endpoint">
        <div class="ep-header">
          <div class="ep-signature">
            <span class="badge badge-post">POST</span>
            <span>/api/registration/drop</span>
          </div>
          <div class="ep-desc">سحب شعبة من جدول الطالب وتعديل الرسوم</div>
        </div>
        <div class="ep-body">
          <pre>{
  "studentId": "202310001",
  "sectionId": "SEC-1505480-1"
}</pre>
        </div>
      </div>

    </div>
  </div>
</body>
</html>`;
}
