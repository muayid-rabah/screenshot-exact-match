import { describe, expect, it, beforeEach } from 'vitest';
import {
  getStoredActiveStudentId,
  setStoredActiveStudentId,
  loadStudentState,
  saveStudentState,
  allPlanCourses,
} from './student-store';
import { demoStudents } from '../data/demoStudents';

describe('Student Store Persistence and Logic', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides the standard 68 degree plan courses', () => {
    expect(allPlanCourses.length).toBeGreaterThanOrEqual(60);
    const csProg1 = allPlanCourses.find((c) => c.code === '1501110');
    expect(csProg1).toBeDefined();
    expect(csProg1?.name).toContain('برمجة');
    expect(csProg1?.credits).toBe(3);
  });

  it('stores and retrieves active student ID in localStorage', () => {
    setStoredActiveStudentId('202410002');
    expect(getStoredActiveStudentId()).toBe('202410002');
  });

  it('loads base student profile when no local changes are persisted', () => {
    const student = loadStudentState('202410002');
    expect(student.universityId).toBe('202410002');
    expect(student.name).toContain('ليان');
  });

  it('saves and restores modified student state faithfully', () => {
    const base = loadStudentState('202410002');
    const modified = {
      ...base,
      phone: '0799998888',
      financialSummary: {
        ...base.financialSummary,
        currentBalance: 50,
      },
    };
    saveStudentState(modified);

    const reloaded = loadStudentState('202410002');
    expect(reloaded.phone).toBe('0799998888');
    expect(reloaded.financialSummary.currentBalance).toBe(50);
  });

  it('contains multi-persona student profiles covering various academic standings', () => {
    expect(demoStudents.length).toBeGreaterThanOrEqual(5);

    const honor = demoStudents.find((s) => s.academicStatus.includes('مرتبة الشرف') || s.profileType === 'advanced');
    expect(honor).toBeDefined();

    const review = demoStudents.find((s) => s.academicStatus.includes('مراجعة مطلوبة') || s.profileType === 'review');
    expect(review).toBeDefined();

    const freshman = demoStudents.find((s) => s.academicStatus.includes('مستجد') || s.profileType === 'freshman');
    expect(freshman).toBeDefined();
  });
});
