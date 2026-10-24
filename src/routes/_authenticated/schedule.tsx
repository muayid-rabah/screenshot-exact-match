import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  CalendarDays,
  Printer,
  Archive,
  Clock,
  MapPin,
  User,
  LayoutGrid,
  List,
  BookOpenCheck,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { useStudentStore } from "@/lib/student-store";
import { timeToMinutes } from "@/services/academicEngine";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/schedule")({
  head: () => ({
    meta: [
      { title: "الجدول الدراسي | جامعة NextAura" },
      { name: "description", content: "الجدول الدراسي الأسبوعي وأرشيف الجداول السابقة في جامعة NextAura." },
    ],
  }),
  component: SchedulePage,
});

const CURRENT_SEMESTER_KEY = "current-2026-1";

const DAYS_ORDER: ("الأحد" | "الاثنين" | "الثلاثاء" | "الأربعاء" | "الخميس")[] = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
];

const TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
];

const COURSE_COLORS = [
  "border-sky-500 bg-sky-500/10 text-sky-800 dark:text-sky-300",
  "border-purple-500 bg-purple-500/10 text-purple-800 dark:text-purple-300",
  "border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  "border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  "border-rose-500 bg-rose-500/10 text-rose-800 dark:text-rose-300",
  "border-indigo-500 bg-indigo-500/10 text-indigo-800 dark:text-indigo-300",
];

export function SchedulePage() {
  const { activeStudent } = useStudentStore();
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedSemester, setSelectedSemester] = useState(CURRENT_SEMESTER_KEY);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Extract years from semester history
  const historicYears = useMemo(() => {
    return Array.from(
      new Set(activeStudent.semesterHistory.map((s) => s.semesterId.split("-")[0])),
    ).sort((a, b) => b.localeCompare(a));
  }, [activeStudent.semesterHistory]);

  const years = useMemo(() => {
    return Array.from(new Set(["2026", ...historicYears]));
  }, [historicYears]);

  const historicTermsForYear = useMemo(() => {
    return activeStudent.semesterHistory.filter((s) => s.semesterId.startsWith(selectedYear));
  }, [activeStudent.semesterHistory, selectedYear]);

  const isCurrentTerm = selectedSemester === CURRENT_SEMESTER_KEY;
  const historicRecord = activeStudent.semesterHistory.find(
    (s) => s.semesterId === selectedSemester,
  );

  const activeSections = activeStudent.currentRegisteredSections;
  const totalCredits = activeSections.reduce((sum, s) => sum + s.credits, 0);

  // Map each course code to a color
  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    activeSections.forEach((s, idx) => {
      map[s.courseCode] = COURSE_COLORS[idx % COURSE_COLORS.length];
    });
    return map;
  }, [activeSections]);

  return (
    <AppShell name={activeStudent.name} uid={activeStudent.universityId}>
      <div className="mx-auto max-w-7xl space-y-6 text-right animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-foreground">
              <CalendarDays className="size-7 text-primary" />
              <span>الجدول الدراسي الفصلي والأسبوعي</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              استعرض جدول المحاضرات الأسبوعي للفصل الحالي أو أرشيف المساقات في السنوات السابقة
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isCurrentTerm && (
              <div className="flex items-center rounded-xl border bg-card p-1 shadow-xs">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5",
                    viewMode === "grid"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  <LayoutGrid className="size-3.5" />
                  <span>المخطط الأسبوعي</span>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5",
                    viewMode === "list"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  <List className="size-3.5" />
                  <span>جدول تفصيلي</span>
                </button>
              </div>
            )}

            <button
              onClick={() => window.print()}
              className="p-2.5 rounded-xl border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition shadow-xs"
              title="طباعة الجدول الدراسي"
            >
              <Printer className="size-4" />
            </button>
          </div>
        </div>

        {/* Year and Semester Query Filters */}
        <div className="p-4 rounded-3xl border bg-card shadow-sm grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-5 space-y-1">
            <label htmlFor="sched-year" className="text-xs font-bold text-foreground">
              العام الجامعي
            </label>
            <select
              id="sched-year"
              value={selectedYear}
              onChange={(e) => {
                const yr = e.target.value;
                setSelectedYear(yr);
                setSelectedSemester(yr === "2026" ? CURRENT_SEMESTER_KEY : "");
              }}
              className="h-10 w-full rounded-xl border bg-background px-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/40"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  العام الجامعي {y}/{Number(y) + 1}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-5 space-y-1">
            <label htmlFor="sched-term" className="text-xs font-bold text-foreground">
              الفصل الدراسي
            </label>
            <select
              id="sched-term"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="h-10 w-full rounded-xl border bg-background px-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/40"
            >
              {selectedYear === "2026" && (
                <option value={CURRENT_SEMESTER_KEY}>الفصل الأول 2026/2027 (الفصل الحالي)</option>
              )}
              {historicTermsForYear.map((t) => (
                <option key={t.semesterId} value={t.semesterId}>
                  {t.semesterName}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <div className="text-xs font-semibold text-muted-foreground p-2.5 rounded-xl bg-muted/40 text-center">
              {isCurrentTerm ? `${totalCredits} ساعة مسجلة` : "أرشيف فصلي"}
            </div>
          </div>
        </div>

        {/* 1. CURRENT SEMESTER: VISUAL WEEKLY GRID */}
        {isCurrentTerm && viewMode === "grid" && (
          <div className="rounded-3xl border bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-cyan-500" />
                <h2 className="text-sm font-bold text-foreground">
                  المخطط الزمني التفاعلي للأسبوع الدراسي (الأحد - الخميس)
                </h2>
              </div>
              <span className="text-xs text-muted-foreground">
                إجمالي الشعب: <strong>{activeSections.length}</strong> مساقات
              </span>
            </div>

            {activeSections.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground space-y-2">
                <CalendarDays className="size-8 mx-auto opacity-40" />
                <p>لا توجد مساقات مسجلة حالياً لعرضها في الجدول الأسبوعي.</p>
                <Link to="/registration" className="text-primary font-bold hover:underline text-xs">
                  الانتقال إلى صفحة التسجيل
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[700px] border rounded-2xl overflow-hidden divide-y">
                  {/* Days header */}
                  <div className="grid grid-cols-6 bg-muted/50 text-center text-xs font-bold py-2.5 text-muted-foreground">
                    <div className="border-e">الوقت</div>
                    {DAYS_ORDER.map((day) => (
                      <div key={day} className="border-e last:border-e-0">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Hourly Rows */}
                  {TIME_SLOTS.map((slot) => {
                    const slotMin = timeToMinutes(slot);
                    const nextSlotMin = slotMin + 60;

                    return (
                      <div key={slot} className="grid grid-cols-6 min-h-[72px] divide-x divide-x-reverse">
                        {/* Time column */}
                        <div className="bg-muted/20 p-2 text-center text-xs font-mono font-bold text-muted-foreground flex items-center justify-center border-e">
                          {slot}
                        </div>

                        {/* 5 Day Cells */}
                        {DAYS_ORDER.map((day) => {
                          const lecturesInSlot = activeSections.filter((sec) => {
                            const hasDay =
                              sec.days.includes(day) ||
                              (sec.daysArray && sec.daysArray.includes(day as any));
                            if (!hasDay) return false;
                            const secStart = timeToMinutes(sec.startTime);
                            const secEnd = timeToMinutes(sec.endTime);
                            return secStart < nextSlotMin && secEnd > slotMin;
                          });

                          return (
                            <div key={day} className="p-1.5 space-y-1 relative bg-background/50 hover:bg-muted/10 transition">
                              {lecturesInSlot.map((sec) => (
                                <div
                                  key={sec.id}
                                  className={cn(
                                    "p-2 rounded-xl border text-xs font-bold shadow-2xs leading-snug space-y-0.5",
                                    colorMap[sec.courseCode] || "bg-muted border-border",
                                  )}
                                >
                                  <div className="truncate font-extrabold">{sec.courseName}</div>
                                  <div className="text-[10px] opacity-90 font-mono dir-ltr text-end sm:text-start truncate">
                                    {sec.startTime} - {sec.endTime}
                                  </div>
                                  <div className="text-[10px] opacity-80 truncate">
                                    قاعة {sec.room}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. CURRENT SEMESTER: DETAILED LIST VIEW */}
        {isCurrentTerm && viewMode === "list" && (
          <div className="rounded-3xl border bg-card overflow-hidden shadow-sm">
            <div className="p-4 border-b flex items-center justify-between text-xs text-muted-foreground">
              <span>الفصل الأول 2026/2027</span>
              <span>الساعات المسجلة: <strong>{totalCredits}</strong> ساعة</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-3 px-4">رقم المساق</th>
                    <th className="py-3 px-4">اسم المساق</th>
                    <th className="py-3 px-4 text-center">الشعبة</th>
                    <th className="py-3 px-4">الأيام والوقت</th>
                    <th className="py-3 px-4">القاعة</th>
                    <th className="py-3 px-4">المدرس</th>
                    <th className="py-3 px-4 text-center">الساعات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {activeSections.map((sec) => (
                    <tr key={sec.id} className="hover:bg-muted/20 transition">
                      <td className="py-3 px-4 font-mono font-bold">{sec.courseCode}</td>
                      <td className="py-3 px-4 font-bold text-foreground">{sec.courseName}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold">{sec.sectionNumber}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold block">{sec.days}</span>
                        <span className="font-mono text-[11px] text-muted-foreground dir-ltr text-end sm:text-start">
                          {sec.startTime} - {sec.endTime}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-muted-foreground">{sec.room}</td>
                      <td className="py-3 px-4 font-medium">{sec.instructor}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold">{sec.credits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. HISTORIC SEMESTER RECORD */}
        {!isCurrentTerm && historicRecord && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-muted/40 border flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-2">
                <Archive className="size-4 text-primary" />
                <span>أرشيف المساقات المسجلة في {historicRecord.semesterName}</span>
              </div>
              <div className="flex items-center gap-4">
                <span>المسجلة: <strong>{historicRecord.registeredHours}</strong> ساعة</span>
                <span>المجتازة: <strong>{historicRecord.passedHours}</strong> ساعة</span>
                <span>المعدل الفصلي: <strong className="text-primary font-mono">{historicRecord.semesterGpa.toFixed(1)}%</strong></span>
              </div>
            </div>

            <div className="rounded-3xl border bg-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs">
                  <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
                    <tr>
                      <th className="py-3 px-4">رقم المساق</th>
                      <th className="py-3 px-4">اسم المساق</th>
                      <th className="py-3 px-4 text-center">الساعات</th>
                      <th className="py-3 px-4 text-center">العلامة</th>
                      <th className="py-3 px-4 text-center">الرمز</th>
                      <th className="py-3 px-4 text-center">النتيجة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {historicRecord.courses.map((c) => (
                      <tr key={c.courseCode} className="hover:bg-muted/20 transition">
                        <td className="py-3 px-4 font-mono font-bold">{c.courseCode}</td>
                        <td className="py-3 px-4 font-bold text-foreground">{c.courseName}</td>
                        <td className="py-3 px-4 text-center font-mono">{c.credits}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold">{c.grade}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold">{c.letterGrade}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-bold",
                              c.status === "ناجح"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-destructive/15 text-destructive",
                            )}
                          >
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!isCurrentTerm && !historicRecord && (
          <div className="py-16 text-center text-sm text-muted-foreground rounded-3xl border bg-card">
            لا توجد سجلات مسجلة للفصل المحدد في أرشيف الطالب.
          </div>
        )}
      </div>
    </AppShell>
  );
}
