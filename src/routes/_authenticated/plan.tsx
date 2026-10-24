import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Map,
  GraduationCap,
  FileText,
  CheckCircle2,
  Clock,
  BookOpen,
  Filter,
  Search,
  ChevronDown,
  Layers,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { useStudentStore } from "@/lib/student-store";
import {
  calculateStudentProgress,
  getCourseStatusForStudent,
  getRequirementHours,
} from "@/services/academicEngine";
import { cn } from "@/lib/utils";
import type { RequirementGroup, CourseStatus } from "@/types/student";

export const Route = createFileRoute("/_authenticated/plan")({
  head: () => ({
    meta: [
      { title: "الخطة الدراسية | جامعة NextAura" },
      { name: "description", content: "الخطة الدراسية المعتمدة ومسار المواد وحالات الإنجاز في جامعة NextAura." },
    ],
  }),
  component: StudyPlanPage,
});

const REQUIREMENT_GROUPS: RequirementGroup[] = [
  "متطلبات الجامعة الإجبارية",
  "متطلبات الجامعة الاختيارية",
  "متطلبات الكلية الإجبارية",
  "المتطلبات المساندة",
  "متطلبات التخصص الإجبارية",
  "متطلبات التخصص الاختيارية",
];

export function StudyPlanPage() {
  const { activeStudent, courses } = useStudentStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedGroupTab, setSelectedGroupTab] = useState<string>("ALL");

  const progress = calculateStudentProgress(activeStudent, courses);
  const requirementHours = getRequirementHours(courses, activeStudent);

  // Filter courses
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
      if (!matchSearch) return false;

      if (selectedGroupTab !== "ALL" && c.group !== selectedGroupTab) {
        return false;
      }

      if (statusFilter !== "ALL") {
        const st = getCourseStatusForStudent(c, activeStudent);
        if (st !== statusFilter) return false;
      }

      return true;
    });
  }, [courses, searchQuery, selectedGroupTab, statusFilter, activeStudent]);

  return (
    <AppShell name={activeStudent.name} uid={activeStudent.universityId}>
      <div className="mx-auto max-w-7xl space-y-6 text-right animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-foreground">
              <Map className="size-7 text-primary" />
              <span>الخطة الدراسية المعتمدة ({activeStudent.studyPlan})</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              خطة درجة البكالوريوس لتخصص {activeStudent.major} — {progress.totalPlanHours} ساعة معتمدة
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              to="/registration"
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition shadow-sm"
            >
              تسجيل المواد المؤهلة
            </Link>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground block mb-1">
              الساعات المنجزة
            </span>
            <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {progress.totalCompletedHours}{' '}
              <span className="text-xs font-normal text-muted-foreground">ساعة</span>
            </div>
            <span className="text-[11px] text-muted-foreground">مجتازة بنجاح</span>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground block mb-1">
              الساعات المسجلة حالياً
            </span>
            <div className="text-2xl font-black font-mono text-cyan-600 dark:text-cyan-400">
              {progress.currentRegisteredHours}{' '}
              <span className="text-xs font-normal text-muted-foreground">ساعة</span>
            </div>
            <span className="text-[11px] text-muted-foreground">في جدول الفصل الحالي</span>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground block mb-1">
              الساعات المتبقية
            </span>
            <div className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
              {progress.remainingHours}{' '}
              <span className="text-xs font-normal text-muted-foreground">ساعة</span>
            </div>
            <span className="text-[11px] text-muted-foreground">حتى التخرج</span>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground block mb-1">
              نسبة إنجاز الخطة
            </span>
            <div className="text-2xl font-black font-mono text-primary">
              {progress.completionPercentage}%
            </div>
            <div className="w-full h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-l from-primary to-cyan-500 transition-all duration-500"
                style={{ width: `${progress.completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 rounded-3xl border bg-card shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-6 relative">
              <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث برقم المساق أو اسمه..."
                className="h-10 w-full rounded-xl border bg-background ps-9 pe-3 text-xs outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={selectedGroupTab}
                onChange={(e) => setSelectedGroupTab(e.target.value)}
                className="h-10 w-full rounded-xl border bg-background px-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="ALL">جميع مجموعات الخطة</option>
                {REQUIREMENT_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g} ({requirementHours[g] || 0} س)
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 w-full rounded-xl border bg-background px-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="ALL">جميع الحالات الأكاديمية</option>
                <option value="منجزة">منجزة بنجاح</option>
                <option value="مسجلة حاليًا">مسجلة حالياً</option>
                <option value="متاحة للتسجيل">متاحة للتسجيل</option>
                <option value="غير متاحة">غير متاحة (متطلب سابق ناقص)</option>
                <option value="تحتاج مراجعة">تحتاج مراجعة المرشد</option>
              </select>
            </div>
          </div>
        </div>

        {/* Course Groups Breakdown */}
        {REQUIREMENT_GROUPS.filter(
          (grp) => selectedGroupTab === "ALL" || selectedGroupTab === grp,
        ).map((group) => {
          const groupCourses = filteredCourses.filter((c) => c.group === group);
          const reqHours = requirementHours[group] || 0;
          const completedHours = progress.groupCompletedHours[group] || 0;
          const currentRegistered = activeStudent.currentRegisteredSections
            .filter((s) => groupCourses.some((c) => c.code === s.courseCode))
            .reduce((sum, s) => sum + s.credits, 0);

          if (selectedGroupTab === "ALL" && groupCourses.length === 0 && searchQuery) {
            return null;
          }

          return (
            <div key={group} className="rounded-3xl border bg-card overflow-hidden shadow-sm space-y-3 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
                <div className="space-y-0.5">
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Layers className="size-4 text-primary" />
                    <span>{group}</span>
                    <span className="text-xs text-muted-foreground font-mono font-normal">
                      ({reqHours} ساعة معتمدة)
                    </span>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    المنجز: <strong className="text-emerald-600 font-mono">{completedHours}</strong> س · المسجل حالياً: <strong className="text-cyan-600 font-mono">{currentRegistered}</strong> س
                  </p>
                </div>

                <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.min(100, (completedHours / reqHours) * 100)}%` }}
                  />
                </div>
              </div>

              {groupCourses.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  لا توجد مساقات مطابقة للبحث في هذه المجموعة.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-start text-xs">
                    <thead className="bg-muted/40 border-b text-muted-foreground font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">رقم المساق</th>
                        <th className="py-2.5 px-3">اسم المساق</th>
                        <th className="py-2.5 px-3 text-center">الساعات</th>
                        <th className="py-2.5 px-3">المتطلب السابق</th>
                        <th className="py-2.5 px-3 text-center">النوع</th>
                        <th className="py-2.5 px-3 text-center">حالة المساق</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {groupCourses.map((c) => {
                        const status = getCourseStatusForStudent(c, activeStudent);
                        return (
                          <tr key={c.code} className="hover:bg-muted/20 transition">
                            <td className="py-2.5 px-3 font-mono font-bold">{c.code}</td>
                            <td className="py-2.5 px-3 font-bold text-foreground">{c.name}</td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold">{c.credits}</td>
                            <td className="py-2.5 px-3 font-mono text-muted-foreground">
                              {c.prerequisites.length > 0 ? c.prerequisites.join("، ") : "—"}
                            </td>
                            <td className="py-2.5 px-3 text-center text-muted-foreground">
                              {c.learningType}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={cn(
                                  "px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block",
                                  status === "منجزة"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                    : status === "مسجلة حاليًا"
                                      ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300"
                                      : status === "متاحة للتسجيل"
                                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                        : status === "تحتاج مراجعة"
                                          ? "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300"
                                          : "bg-muted text-muted-foreground",
                                )}
                              >
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
