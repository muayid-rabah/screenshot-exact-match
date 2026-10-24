import { describe, expect, it } from 'vitest';
import { generateAssistantResponse } from './smartAssistant';
import { demoStudents } from '../data/demoStudents';
import { allPlanCourses } from '../lib/student-store';

describe('Smart AI Academic Advisor (smartAssistant)', () => {
  const student = demoStudents[0]; // Ahmed Al-Tamimi

  it('answers GPA queries with current academic standing and statistics', () => {
    const response = generateAssistantResponse('كم معدلي التراكمي؟', student, allPlanCourses);
    expect(response).toContain('المعدل التراكمي');
    expect(response).toContain('جامعة NextAura');
    expect(response).toContain('الحالة الأكاديمية');
  });

  it('answers credit hours and graduation questions', () => {
    const response = generateAssistantResponse('كم ساعة باقية للتخرج؟', student, allPlanCourses);
    expect(response).toContain('الساعات المنجزة');
    expect(response).toContain('الساعات المتبقية');
    expect(response).toContain('132');
  });

  it('answers schedule and enrolled courses questions', () => {
    const response = generateAssistantResponse('ما هو جدولي الدراسي اليوم؟', student, allPlanCourses);
    expect(response).toContain('جدولك الدراسي للفصل الحالي');
  });

  it('suggests eligible courses based on satisfied prerequisites', () => {
    const response = generateAssistantResponse('ما هي المواد التي أستطيع تسجيلها؟', student, allPlanCourses);
    expect(response).toContain('المساقات المقترحة');
    expect(response).toContain('ساعات');
  });

  it('provides attendance and absence warning details', () => {
    const response = generateAssistantResponse('هل لدي إنذار غياب أو حرمان؟', student, allPlanCourses);
    expect(response).toContain('سجل الغياب');
  });

  it('answers financial balance and tuition queries', () => {
    const response = generateAssistantResponse('كم الرسوم والذمة المالية المتبقية؟', student, allPlanCourses);
    expect(response).toContain('الملف المالي لجامعة NextAura');
    expect(response).toContain('د.أ');
  });

  it('reports scheduled exams and locations', () => {
    const response = generateAssistantResponse('متى موعد امتحاناتي القادمة؟', student, allPlanCourses);
    expect(response).toContain('جدول أقرب الامتحانات المعلنة');
  });

  it('checks for schedule conflicts upon user prompt', () => {
    const response = generateAssistantResponse('هل يوجد تعارض في موادي؟', student, allPlanCourses);
    expect(response).toMatch(/تعارض|سليم/);
  });

  it('returns welcome overview for generic queries', () => {
    const response = generateAssistantResponse('مرحبا مين انت؟', student, allPlanCourses);
    expect(response).toContain('جامعة NextAura');
    expect(response).toContain('مساعدك الأكاديمي الذكي');
  });
});

