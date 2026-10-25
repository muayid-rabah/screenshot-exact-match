import { describe, expect, it } from 'vitest';
import { handleApiRequest } from './apiRouter';

describe('NextAura University REST API Engine', () => {
  it('handles CORS OPTIONS preflight request', async () => {
    const req = new Request('http://localhost:8080/api/info', { method: 'OPTIONS' });
    const res = await handleApiRequest(req);
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('serves university info and available endpoint directory', async () => {
    const req = new Request('http://localhost:8080/api/info', { method: 'GET' });
    const res = await handleApiRequest(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.university).toContain('جامعة NextAura');
    expect(Array.isArray(data.endpoints)).toBe(true);
    expect(data.endpoints.length).toBeGreaterThanOrEqual(10);
  });

  it('serves students list with summaries', async () => {
    const req = new Request('http://localhost:8080/api/students', { method: 'GET' });
    const res = await handleApiRequest(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.count).toBeGreaterThanOrEqual(5);
    expect(data.students[0].universityId).toBe('202310001');
  });

  it('serves single student comprehensive profile', async () => {
    const req = new Request('http://localhost:8080/api/student?id=202310001', { method: 'GET' });
    const res = await handleApiRequest(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.universityId).toBe('202310001');
    expect(data.name).toContain('أحمد');
    expect(data.progress.totalPlanHours).toBe(132);
    expect(data.progress.totalCompletedHours).toBe(96);
  });

  it('serves weekly schedule and conflict checks', async () => {
    const req = new Request('http://localhost:8080/api/schedule?studentId=202310001', { method: 'GET' });
    const res = await handleApiRequest(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.totalCredits).toBeGreaterThan(0);
    expect(data.weeklySchedule).toBeDefined();
    expect(Array.isArray(data.weeklySchedule['الأحد'])).toBe(true);
  });

  it('serves degree plan course categories', async () => {
    const req = new Request('http://localhost:8080/api/plan?studentId=202310001', { method: 'GET' });
    const res = await handleApiRequest(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.coursesCount).toBeGreaterThanOrEqual(60);
    expect(data.progress.totalPlanHours).toBe(132);
  });

  it('serves courses strictly eligible for registration', async () => {
    const req = new Request('http://localhost:8080/api/eligible-courses?studentId=202310001', { method: 'GET' });
    const res = await handleApiRequest(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.eligibleCourses)).toBe(true);
  });

  it('serves exams timetable and halls', async () => {
    const req = new Request('http://localhost:8080/api/exams?studentId=202310001', { method: 'GET' });
    const res = await handleApiRequest(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.exams)).toBe(true);
  });

  it('serves absences tracking and warning levels', async () => {
    const req = new Request('http://localhost:8080/api/absences?studentId=202310001', { method: 'GET' });
    const res = await handleApiRequest(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.absences)).toBe(true);
  });

  it('serves financial ledger and transactions', async () => {
    const req = new Request('http://localhost:8080/api/financial?studentId=202310001', { method: 'GET' });
    const res = await handleApiRequest(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.summary).toBeDefined();
    expect(Array.isArray(data.transactions)).toBe(true);
  });

  it('handles smart AI assistant queries via POST /api/assistant/chat', async () => {
    const req = new Request('http://localhost:8080/api/assistant/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: '202310001',
        message: 'كم معدلي التراكمي؟',
      }),
    });
    const res = await handleApiRequest(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.reply).toContain('المعدل التراكمي');
    expect(data.reply).toContain('NextAura');
  });

  it('serves OpenAPI 3.0 specification at /api/openapi.json', async () => {
    const req = new Request('http://localhost:8080/api/openapi.json', { method: 'GET' });
    const res = await handleApiRequest(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.openapi).toBe('3.0.0');
    expect(data.paths['/student']).toBeDefined();
    expect(data.paths['/assistant/chat']).toBeDefined();
  });
});
