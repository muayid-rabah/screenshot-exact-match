import type {
  PlanCourse,
  RequirementGroup,
  CourseStatus,
  EligibilityState,
  StudentProfile,
  CourseSection,
} from '../types/student';

export const AI_PLAN12_KEY = 'ZU:IT:AI:P12';
export const GOVERNED_DEGREE_PLAN_CREDITS = 132;
const AI_PLAN12_PROJECT_CODES = new Set(['1505467', '1505468']);

export const GOVERNED_GROUP_REQUIREMENTS: Record<RequirementGroup, number> = {
  'متطلبات الجامعة الإجبارية': 18,
  'متطلبات الجامعة الاختيارية': 9,
  'متطلبات الكلية الإجبارية': 21,
  'المتطلبات المساندة': 12,
  'متطلبات التخصص الإجبارية': 63,
  'متطلبات التخصص الاختيارية': 9,
};

export function isAiPlan12(student: StudentProfile): boolean {
  if (student.planKey) return student.planKey === AI_PLAN12_KEY;
  const aiMajor =
    student.major === 'الذكاء الاصطناعي' ||
    student.major === 'Artificial Intelligence' ||
    student.major === 'علم الحاسوب' ||
    student.major === 'هندسة البرمجيات';
  return aiMajor;
}

export function getStudentTotalRequiredCredits(student: StudentProfile): number {
  if (typeof student.totalRequiredCredits === 'number' && student.totalRequiredCredits >= 0) {
    return student.totalRequiredCredits;
  }
  return GOVERNED_DEGREE_PLAN_CREDITS;
}

export function getRequirementHours(
  _courses: PlanCourse[],
  student?: StudentProfile,
): Record<string, number> {
  if (student?.requirementGroupCredits && Object.keys(student.requirementGroupCredits).length > 0) {
    return { ...student.requirementGroupCredits };
  }
  return { ...GOVERNED_GROUP_REQUIREMENTS };
}

export function arePrerequisitesSatisfied(prereqs: string[], completedCourses: string[]): boolean {
  return !prereqs?.length || prereqs.every((code) => completedCourses.includes(code));
}

export function getCourseStatusForStudent(course: PlanCourse, student: StudentProfile): CourseStatus {
  if (student.completedCourses.includes(course.code)) return 'منجزة';
  if (student.currentRegisteredSections.some((section) => section.courseCode === course.code)) {
    return 'مسجلة حاليًا';
  }
  if (course.reviewRequired || student.reviewCourses?.includes(course.code)) {
    return 'تحتاج مراجعة';
  }
  return arePrerequisitesSatisfied(course.prerequisites, student.completedCourses)
    ? 'متاحة للتسجيل'
    : 'غير متاحة';
}

export function getRegistrationEligibility(
  courseCode: string,
  student: StudentProfile,
  courses: PlanCourse[],
): { state: EligibilityState; label: string; reason?: string } {
  const course = courses.find((item) => item.code === courseCode);
  if (!course) {
    return { state: 'NOT_ELIGIBLE', label: 'غير مؤهل', reason: 'المادة غير موجودة في الخطة' };
  }
  if (student.completedCourses.includes(courseCode)) {
    return { state: 'NOT_ELIGIBLE', label: 'مجتازة', reason: 'المادة مجتازة سابقًا' };
  }
  if (student.currentRegisteredSections.some((section) => section.courseCode === courseCode)) {
    return { state: 'NOT_ELIGIBLE', label: 'مسجلة', reason: 'المادة مسجلة حاليًا في جدولك' };
  }
  if (course.reviewRequired || student.reviewCourses?.includes(courseCode)) {
    return {
      state: 'REVIEW_REQUIRED',
      label: 'تحتاج مراجعة',
      reason: course.reviewReason || 'تحتاج موافقة المرشد الأكاديمي',
    };
  }
  const isAiProject = isAiPlan12(student) && AI_PLAN12_PROJECT_CODES.has(course.code);
  const progress = calculateStudentProgress(student, courses);
  if (isAiProject && progress.totalCompletedHours < 90) {
    return { state: 'NOT_ELIGIBLE', label: 'غير مؤهل', reason: 'مشروع التخرج يتطلب إنجاز 90 ساعة معتمدة أولاً' };
  }
  if (!arePrerequisitesSatisfied(course.prerequisites, student.completedCourses)) {
    return {
      state: 'NOT_ELIGIBLE',
      label: 'غير مستوفٍ',
      reason: `المتطلبات السابقة غير مستوفاة: (${course.prerequisites.join('، ')})`,
    };
  }
  return { state: 'ELIGIBLE', label: 'مؤهل للتسجيل' };
}

export function calculateStudentProgress(student: StudentProfile, courses: PlanCourse[]) {
  const groupRequirements = getRequirementHours(courses, student);
  const groupCompletedHours = Object.fromEntries(
    Object.keys(groupRequirements).map((group) => [group, 0]),
  ) as Record<RequirementGroup, number>;

  let fallbackCompletedHours = 0;

  for (const code of student.completedCourses) {
    const course = courses.find((item) => item.code === code);
    if (!course) continue;

    const groupHours = groupCompletedHours[course.group] || 0;
    const limit = groupRequirements[course.group] || 0;
    const creditedHours = Math.min(course.credits, Math.max(0, limit - groupHours));

    groupCompletedHours[course.group] = groupHours + creditedHours;
    fallbackCompletedHours += creditedHours;
  }

  const reportedEarnedCredits =
    typeof student.earnedCredits === 'number'
      ? student.earnedCredits
      : typeof student.earned_credits === 'number'
        ? student.earned_credits
        : fallbackCompletedHours;

  const totalPlanHours = getStudentTotalRequiredCredits(student);
  const totalCompletedHours = Math.max(0, reportedEarnedCredits);

  const currentRegisteredHours = student.currentRegisteredSections.reduce(
    (sum, section) => sum + section.credits,
    0,
  );

  const remainingHours = Math.max(0, totalPlanHours - totalCompletedHours);

  const completionPercentage = totalPlanHours
    ? Math.min(100, Math.round((totalCompletedHours / totalPlanHours) * 1000) / 10)
    : 0;

  return {
    totalPlanHours,
    totalCompletedHours,
    remainingHours,
    currentRegisteredHours,
    groupCompletedHours,
    groupRequirements,
    completionPercentage,
  };
}

export function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

export function checkSectionConflict(sectionA: CourseSection, sectionB: CourseSection): boolean {
  if (sectionA.id === sectionB.id) return false;
  const blocks = (section: CourseSection) =>
    section.meetings?.length
      ? section.meetings
      : section.daysArray.map((day) => ({
          day,
          startTime: section.startTime,
          endTime: section.endTime,
        }));

  return blocks(sectionA).some((left) =>
    blocks(sectionB).some(
      (right) =>
        left.day === right.day &&
        Math.max(timeToMinutes(left.startTime), timeToMinutes(right.startTime)) <
          Math.min(timeToMinutes(left.endTime), timeToMinutes(right.endTime)),
    ),
  );
}

export function findScheduleConflicts(sections: CourseSection[]) {
  const conflicts: { secA: CourseSection; secB: CourseSection; reason: string }[] = [];
  for (let left = 0; left < sections.length; left += 1) {
    for (let right = left + 1; right < sections.length; right += 1) {
      if (checkSectionConflict(sections[left], sections[right])) {
        conflicts.push({
          secA: sections[left],
          secB: sections[right],
          reason: `تعارض زمني بين مساق "${sections[left].courseName}" ومساق "${sections[right].courseName}" (${sections[left].days} ${sections[left].startTime}-${sections[left].endTime} مع ${sections[right].days} ${sections[right].startTime}-${sections[right].endTime})`,
        });
      }
    }
  }
  return conflicts;
}

export function getRecommendedRegistrationSections(
  student: StudentProfile,
  offeredSections: CourseSection[],
  courses: PlanCourse[],
  basketSections: CourseSection[] = [],
  maxHours = 18,
): CourseSection[] {
  const selected = [...student.currentRegisteredSections, ...basketSections];
  let usedHours = selected.reduce((sum, section) => sum + section.credits, 0);
  const recommendation: CourseSection[] = [];

  for (const course of courses) {
    if (usedHours >= maxHours) break;
    const eligibility = getRegistrationEligibility(course.code, student, courses);
    const alreadySelected = [...selected, ...recommendation].some(
      (section) => section.courseCode === course.code,
    );
    if (eligibility.state !== 'ELIGIBLE' || alreadySelected || usedHours + course.credits > maxHours) {
      continue;
    }
    const compatible = offeredSections
      .filter(
        (section) =>
          section.courseCode === course.code &&
          section.status === 'متاحة' &&
          section.enrolled < section.capacity,
      )
      .sort((left, right) => left.sectionNumber - right.sectionNumber)
      .find((section) => !selected.some((existing) => checkSectionConflict(section, existing)));

    if (compatible) {
      recommendation.push(compatible);
      usedHours += compatible.credits;
    }
  }
  return recommendation;
}

