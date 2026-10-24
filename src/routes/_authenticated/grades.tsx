import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  FileText,
  GraduationCap,
  TrendingUp,
  Award,
  ChevronDown,
  ChevronUp,
  Filter,
  BookOpen,
  Printer,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { AppShell } from "@/components/app/AppShell";
import { useStudentStore } from "@/lib/student-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/grades")({
  head: () => ({
    meta: [
      { title: "العلامات والسجل الأكاديمي | جامعة NextAura" },
      { name: "description", content: "كشف العلامات الفصلي والتراكمي وسجل المواد في جامعة NextAura." },
    ],
  }),
  component: GradesPage,
});

export function GradesPage() {
  const { activeStudent } = useStudentStore();
  const [selectedSemester, setSelectedSemester] = useState<string>("ALL");
  const [expandedSemester, setExpandedSemester] = useState<string | null>(null);

  const history = activeStudent.semesterHistory;
  const latestSem = history[history.length - 1];

  const totalRegistered = history.reduce((sum, sem) => sum + sem.registeredHours, 0);
  const totalPassed = history.reduce((sum, sem) => sum + sem.passedHours, 0);

  // Filtered semesters
  const displayedSemesters = useMemo(() => {
    if (selectedSemester === "ALL") return history;
    return history.filter((s) => s.semesterId === selectedSemester);
  }, [history, selectedSemester]);

  // Chart data
  const chartData = useMemo(() => {
    return history.map((s) => ({
      name: s.semesterName.replace("الفصل ", "").slice(0, 16),
      semGpa: s.semesterGpa,
      cumGpa: s.cumulativeGpa,
      hours: s.passedHours,
    }));
  }, [history]);

  return (
    <AppShell name={activeStudent.name} uid={activeStudent.universityId}>
      <div className="mx-auto max-w-7xl space-y-6 text-right animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-foreground">
              <FileText className="size-7 text-primary" />
              <span>كشف العلامات والسجل الأكاديمي الرسمي</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              السجل الفصلي المعتمد للدرجات والتقديرات الصادر عن عمادة القبول والتسجيل — جامعة NextAura
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              to="/gpa"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5"
            >
              <TrendingUp className="size-4" />
              <span>محاكاة المعدل</span>
            </Link>

            <button
              onClick={() => window.print()}
              className="p-2 rounded-xl border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition shadow-xs"
              title="طباعة كشف العلامات"
            >
              <Printer className="size-4" />
            </button>
          </div>
        </div>

        {/* 4 Performance Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground block mb-1">
              المعدل التراكمي العام
            </span>
            <div className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
              {latestSem?.cumulativeGpa ? `${latestSem.cumulativeGpa.toFixed(1)}%` : "—"}
            </div>
            <span className="text-[11px] text-purple-600 font-semibold">
              {activeStudent.academicStatus}
            </span>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground block mb-1">
              المعدل الفصلي الأخير
            </span>
            <div className="text-2xl font-black font-mono text-cyan-600 dark:text-cyan-400">
              {latestSem?.semesterGpa ? `${latestSem.semesterGpa.toFixed(1)}%` : "—"}
            </div>
            <span className="text-[11px] text-muted-foreground">
              {latestSem?.semesterName || "الفصل السابق"}
            </span>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground block mb-1">
              إجمالي الساعات المجتازة
            </span>
            <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {totalPassed}{' '}
              <span className="text-xs font-normal text-muted-foreground">ساعة</span>
            </div>
            <span className="text-[11px] text-muted-foreground">بنجاح تام</span>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground block mb-1">
              الساعات المسجلة إجمالاً
            </span>
            <div className="text-2xl font-black font-mono text-foreground">
              {totalRegistered}{' '}
              <span className="text-xs font-normal text-muted-foreground">ساعة</span>
            </div>
            <span className="text-[11px] text-muted-foreground">عبر كافة الفصول</span>
          </div>
        </div>

        {/* Filter and Semester Selector */}
        <div className="p-4 rounded-3xl border bg-card shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label htmlFor="filter-sem" className="text-xs font-bold text-foreground">
              عرض فصل محدد:
            </label>
            <select
              id="filter-sem"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="h-10 rounded-xl border bg-background px-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="ALL">كافة الفصول الدراسية (السجل الشامل)</option>
              {history.map((s) => (
                <option key={s.semesterId} value={s.semesterId}>
                  {s.semesterName} (معدل: {s.semesterGpa.toFixed(1)}%)
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-muted-foreground font-semibold">
            عدد الفصول المعروضة: <strong>{displayedSemesters.length}</strong> فصول
          </span>
        </div>

        {/* Semesters Detailed Tables */}
        <div className="space-y-6">
          {displayedSemesters.map((sem) => (
            <div key={sem.semesterId} className="rounded-3xl border bg-card overflow-hidden shadow-sm">
              {/* Semester Header */}
              <div className="p-5 bg-muted/30 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold font-mono">
                    {sem.semesterId.slice(-1)}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">{sem.semesterName}</h2>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-0.5">
                      <span>الساعات المسجلة: <strong className="font-mono text-foreground">{sem.registeredHours}</strong></span>
                      <span>الساعات المجتازة: <strong className="font-mono text-emerald-600">{sem.passedHours}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold bg-card px-4 py-2 rounded-2xl border shadow-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">المعدل الفصلي</span>
                    <span className="text-cyan-600 dark:text-cyan-400 font-mono text-sm font-extrabold">
                      {sem.semesterGpa.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-px h-6 bg-border" />
                  <div>
                    <span className="text-muted-foreground block text-[10px]">المعدل التراكمي</span>
                    <span className="text-purple-600 dark:text-purple-400 font-mono text-sm font-extrabold">
                      {sem.cumulativeGpa.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Grades Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs">
                  <thead className="bg-muted/10 border-b text-muted-foreground font-semibold">
                    <tr>
                      <th className="py-3 px-4">رقم المساق</th>
                      <th className="py-3 px-4">اسم المساق</th>
                      <th className="py-3 px-4 text-center">الساعات</th>
                      <th className="py-3 px-4 text-center">العلامة المئوية</th>
                      <th className="py-3 px-4 text-center">الرمز</th>
                      <th className="py-3 px-4 text-center">النتيجة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sem.courses.map((c) => (
                      <tr key={c.courseCode} className="hover:bg-muted/20 transition">
                        <td className="py-3 px-4 font-mono font-bold">{c.courseCode}</td>
                        <td className="py-3 px-4 font-bold text-foreground">{c.courseName}</td>
                        <td className="py-3 px-4 text-center font-mono">{c.credits}</td>
                        <td className="py-3 px-4 text-center font-mono font-black text-sm">
                          {c.grade}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-sm">
                          {c.letterGrade}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block",
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
          ))}
        </div>

        {/* GPA Progression Chart */}
        <div className="rounded-3xl border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <h2 className="text-base font-bold text-foreground">الرسم البياني لتطور المعدل الفصلي والتراكمي</h2>
              <p className="text-xs text-muted-foreground mt-0.5">مقارنة بصرية للأداء الأكاديمي عبر الفصول</p>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${Number(val).toFixed(1)}%`, ""]}
                  contentStyle={{ borderRadius: 12, direction: "rtl", fontSize: 12 }}
                />
                <Bar dataKey="cumGpa" fill="#8b5cf6" name="المعدل التراكمي" radius={[6, 6, 0, 0]} />
                <Bar dataKey="semGpa" fill="#06b6d4" name="المعدل الفصلي" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
