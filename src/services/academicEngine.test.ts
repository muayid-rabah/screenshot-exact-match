import { describe, expect, it } from 'vitest';
import {
  checkSectionConflict,
  findScheduleConflicts,
  arePrerequisitesSatisfied,
  getRegistrationEligibility,
  calculateStudentProgress,
  getRecommendedRegistrationSections,
  timeToMinutes,
} from './academicEngine';
import type { CourseSection, PlanCourse, StudentProfile } from '../types/student';

const sampleCourseA: PlanCourse = {
  id: 'c1',
  code: '1501110',
  name: 'برمجة 1',
  credits: 3,
  group: 'متطلبات الكلية الإجبارية',
  year: 1,
  semester: 1,
  prerequisites: [],
};

const sampleCourseB: PlanCourse = {
  id: 'c2',
  code: '1501111',
  name: 'برمجة 2',
  credits: 3,
  group: 'متطلبات الكلية الإجبارية',
  year: 1,
  semester: 2,
  prerequisites: ['1501110'],
};

const sampleCourseSenior: PlanCourse = {
  id: 'c3',
  code: '1505467',
  name: 'مشروع التخرج 1',
  credits: 3,
  group: 'متطلبات التخصص الإجبارية',
  year: 4,
  semester: 1,
  prerequisites: ['1501111'],
};

const sampleStudent: StudentProfile = {
  id: '202410001',
  name: 'أحمد التميمي',
  major: 'الذكاء الاصطناعي',
  faculty: 'تكنولوجيا المعلومات',
  academicYear: 'السنة الثانية',
  semester: 'الفصل الثاني 2025/2026',
  gpa: 3.42,
  completedHours: 35,
  earnedCredits: 35,
  registeredHours: 15,
  academicStatus: 'منتظم',
  advisorName: 'د. سمير الخالد',
  completedCourses: ['1501110'],
  currentRegisteredSections: [],
  financialBalance: 250,
  unreadNotifications: 2,
  totalRequiredCredits: 132,
};

const secMW1: CourseSection = {
  id: 'sec-1',
  courseCode: '1501110',
  courseName: 'برمجة 1',
  sectionNumber: 1,
  credits: 3,
  instructor: 'د. محمد',
  room: 'IT-101',
  days: 'ح ث خ',
  daysArray: ['الأحد', 'الثلاثاء', 'الخميس'],
  startTime: '09:00',
  endTime: '10:00',
  capacity: 40,
  enrolled: 30,
  status: 'متاحة',
};

const secMW2_overlap: CourseSection = {
  id: 'sec-2',
  courseCode: '1501111',
  courseName: 'برمجة 2',
  sectionNumber: 1,
  credits: 3,
  instructor: 'د. سارة',
  room: 'IT-102',
  days: 'ح ث خ',
  daysArray: ['الأحد', 'الثلاثاء', 'الخميس'],
  startTime: '09:30',
  endTime: '10:30',
  capacity: 35,
  enrolled: 20,
  status: 'متاحة',
};

const secMW3_noOverlap: CourseSection = {
  id: 'sec-3',
  courseCode: '1501111',
  courseName: 'برمجة 2',
  sectionNumber: 2,
  credits: 3,
  instructor: 'د. خالد',
  room: 'IT-103',
  days: 'ح ث خ',
  daysArray: ['الأحد', 'الثلاثاء', 'الخميس'],
  startTime: '11:00',
  endTime: '12:00',
  capacity: 35,
  enrolled: 20,
  status: 'متاحة',
};

describe('academicEngine', () => {
  it('converts time to minutes correctly', () => {
    expect(timeToMinutes('09:30')).toBe(570);
    expect(timeToMinutes('14:15')).toBe(855);
  });

  it('detects schedule section conflicts accurately', () => {
    expect(checkSectionConflict(secMW1, secMW2_overlap)).toBe(true);
    expect(checkSectionConflict(secMW1, secMW3_noOverlap)).toBe(false);
  });

  it('finds schedule conflicts in lists of sections', () => {
    const conflicts = findScheduleConflicts([secMW1, secMW2_overlap, secMW3_noOverlap]);
    expect(conflicts.length).toBe(1);
    expect(conflicts[0].secA.id).toBe('sec-1');
    expect(conflicts[0].secB.id).toBe('sec-2');
  });

  it('checks prerequisites satisfaction', () => {
    expect(arePrerequisitesSatisfied([], ['1501110'])).toBe(true);
    expect(arePrerequisitesSatisfied(['1501110'], ['1501110'])).toBe(true);
    expect(arePrerequisitesSatisfied(['1501110'], [])).toBe(false);
  });

  it('evaluates student registration eligibility', () => {
    // c1 is already completed
    const el1 = getRegistrationEligibility('1501110', sampleStudent, [sampleCourseA, sampleCourseB]);
    expect(el1.state).toBe('NOT_ELIGIBLE');
    expect(el1.reason).toContain('مجتازة سابقًا');

    // c2 prereq (c1) is satisfied
    const el2 = getRegistrationEligibility('1501111', sampleStudent, [sampleCourseA, sampleCourseB]);
    expect(el2.state).toBe('ELIGIBLE');

    // Graduation project requires 90 credits
    const elProj = getRegistrationEligibility('1505467', sampleStudent, [sampleCourseSenior]);
    expect(elProj.state).toBe('NOT_ELIGIBLE');
    expect(elProj.reason).toContain('90 ساعة');
  });

  it('calculates student progress and percentage', () => {
    const progress = calculateStudentProgress(sampleStudent, [sampleCourseA, sampleCourseB]);
    expect(progress.totalPlanHours).toBe(132);
    expect(progress.totalCompletedHours).toBe(35);
    expect(progress.remainingHours).toBe(97);
    expect(progress.completionPercentage).toBe(26.5);
  });

  it('recommends compatible registration sections up to limit', () => {
    const courses = [sampleCourseB];
    const offered = [secMW3_noOverlap];
    const recs = getRecommendedRegistrationSections(sampleStudent, offered, courses, [], 18);
    expect(recs.length).toBe(1);
    expect(recs[0].courseCode).toBe('1501111');
  });
});
