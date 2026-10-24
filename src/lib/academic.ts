export type CourseRecord = {
  credits: number;
  status: "completed" | "current" | string;
  grade_points: number | null;
  term_code: string;
  category: string;
};

/** Credit-weighted GPA over completed records with grades (4.0 scale). */
export function computeGPA(records: CourseRecord[]): number {
  const graded = records.filter((r) => r.status === "completed" && r.grade_points != null);
  const hours = graded.reduce((s, r) => s + r.credits, 0);
  if (hours === 0) return 0;
  const points = graded.reduce((s, r) => s + r.credits * Number(r.grade_points), 0);
  return Math.round((points / hours) * 100) / 100;
}

/** GPA of the most recent completed term. */
export function lastTermGPA(records: CourseRecord[]): number {
  const terms = [...new Set(records.filter((r) => r.status === "completed").map((r) => r.term_code))].sort();
  const last = terms.at(-1);
  return last ? computeGPA(records.filter((r) => r.term_code === last)) : 0;
}

export function hoursSummary(records: CourseRecord[], required: number) {
  const completed = records.filter((r) => r.status === "completed").reduce((s, r) => s + r.credits, 0);
  const current = records.filter((r) => r.status === "current").reduce((s, r) => s + r.credits, 0);
  const remaining = Math.max(required - completed, 0);
  const progress = required > 0 ? Math.min(Math.round((completed / required) * 100), 100) : 0;
  return { completed, current, remaining, progress };
}

export function academicStanding(gpa: number): string {
  if (gpa >= 3.65) return "امتياز";
  if (gpa >= 3.0) return "جيد جداً";
  if (gpa >= 2.5) return "جيد";
  if (gpa >= 2.0) return "مقبول";
  return "إنذار أكاديمي";
}

/** Returns the soonest item whose date is strictly in the future. */
export function nextUpcoming<T>(items: T[], getDate: (t: T) => string | Date, now: Date = new Date()): T | null {
  const future = items
    .map((i) => ({ i, t: new Date(getDate(i)).getTime() }))
    .filter((x) => x.t > now.getTime())
    .sort((a, b) => a.t - b.t);
  return future[0]?.i ?? null;
}

/** Sessions held on the given date's weekday (0 = Sunday), sorted by start time. */
export function sessionsForDay<T extends { weekday: number; start_time: string }>(sessions: T[], date: Date = new Date()): T[] {
  return sessions.filter((s) => s.weekday === date.getDay()).sort((a, b) => a.start_time.localeCompare(b.start_time));
}

export function idToEmail(universityId: string): string {
  return `${universityId.trim().toLowerCase()}@students.morshidi.edu`;
}

export const UNIVERSITY_ID_PATTERN = /^\d{8,10}$/;
