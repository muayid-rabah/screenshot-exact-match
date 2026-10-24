import { describe, expect, it } from "vitest";
import { computeGPA, hoursSummary, nextUpcoming, sessionsForDay, lastTermGPA } from "./academic";

const rec = (credits: number, gp: number | null, status = "completed", term = "2024-1") => ({
  credits, grade_points: gp, status, term_code: term, category: "x",
});

describe("academic rules", () => {
  it("GPA is credit-weighted and ignores current courses", () => {
    expect(computeGPA([rec(3, 4), rec(1, 2), rec(3, null, "current")])).toBe(3.5);
  });
  it("last term GPA uses only the latest completed term", () => {
    expect(lastTermGPA([rec(3, 2, "completed", "2023-1"), rec(3, 4, "completed", "2024-1")])).toBe(4);
  });
  it("graduation progress = completed / required hours", () => {
    expect(hoursSummary([rec(3, 4), rec(3, 3), rec(3, null, "current")], 132)).toEqual({
      completed: 6, current: 3, remaining: 126, progress: 5,
    });
  });
  it("next exam never returns a past exam", () => {
    const now = new Date("2026-10-24T12:00:00Z");
    const items = [{ d: "2026-10-12T09:00:00Z" }, { d: "2026-11-10T09:00:00Z" }, { d: "2026-10-29T09:00:00Z" }];
    expect(nextUpcoming(items, (i) => i.d, now)?.d).toBe("2026-10-29T09:00:00Z");
    expect(nextUpcoming([{ d: "2026-10-01T00:00:00Z" }], (i) => i.d, now)).toBeNull();
  });
  it("today's lectures match the local weekday", () => {
    const sunday = new Date(2026, 9, 25);
    const s = [{ weekday: 0, start_time: "11:30" }, { weekday: 1, start_time: "08:00" }, { weekday: 0, start_time: "09:30" }];
    expect(sessionsForDay(s, sunday).map((x) => x.start_time)).toEqual(["09:30", "11:30"]);
  });
});
