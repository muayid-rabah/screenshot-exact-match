import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  TrendingUp,
  Award,
  CheckCircle2,
  Hourglass,
  Calculator,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  Info,
  Target,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { useStudentStore } from "@/lib/student-store";
import { calculateStudentProgress } from "@/services/academicEngine";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/gpa")({
  head: () => ({
    meta: [
      { title: "محاكاة المعدل التراكمي | جامعة NextAura" },
      { name: "description", content: "حاسبة ومحاكي المعدل التراكمي المستقبلي وتوقعات التخرج في جامعة NextAura." },
    ],
  }),
  component: GpaSimulatorPage,
});

export function GpaSimulatorPage() {
  const { activeStudent, courses } = useStudentStore();
  const progress = calculateStudentProgress(activeStudent, courses);
  const history = activeStudent.semesterHistory;

  const latestSemester = history[history.length - 1];
  const semesterGpa = latestSemester ? latestSemester.semesterGpa : 0;
  const cumulativeGpa = latestSemester ? latestSemester.cumulativeGpa : 0;

  // Simulator state
  const [simHours, setSimHours] = useState<number>(15);
  const [simGrade, setSimGrade] = useState<number>(85);
  const [targetCumGpa, setTargetCumGpa] = useState<number>(85);

  // Projected cumulative GPA formula (100% scale):
  const currentTotalPoints = history.reduce((acc, sem) => acc + sem.passedHours * sem.semesterGpa, 0);
  const simulatedTotalHours = progress.totalCompletedHours + simHours;
  const simulatedCumulativeGpa =
    simulatedTotalHours > 0
      ? (currentTotalPoints + simHours * simGrade) / simulatedTotalHours
      : simGrade;

  const gpaDiff = simulatedCumulativeGpa - cumulativeGpa;

  // Target solver: required semester grade = (Target * (Done + Sim) - CurrentPoints) / Sim
  const requiredSemesterGrade =
    simHours > 0
      ? (targetCumGpa * (progress.totalCompletedHours + simHours) - currentTotalPoints) / simHours
      : 0;

  const getGpaRating = (val: number) => {
    if (val >= 84) return "امتياز (مرتبة الشرف)";
    if (val >= 76) return "جيد جداً";
    if (val >= 68) return "جيد";
    if (val >= 60) return "مقبول";
    if (val > 0) return "إنذار أكاديمي";
    return "قيد الاحتساب";
  };

  return (
    <AppShell name={activeStudent.name} uid={activeStudent.universityId}>
      <div className="mx-auto max-w-7xl space-y-6 text-right animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-foreground">
              <Calculator className="size-7 text-primary" />
              <span>المعدل التراكمي ومحاكي الأداء الأكاديمي</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              أداة ذكية لمحاكاة المعدل التراكمي المتوقع بناءً على الساعات المسجلة والدرجات المستهدفة
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-200">
              النظام المئوي: من 100%
            </span>
          </div>
        </div>

        {/* 4 Academic KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground block mb-1">
              المعدل التراكمي الحالي
            </span>
            <div className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
              {cumulativeGpa > 0 ? `${cumulativeGpa.toFixed(1)}%` : "—"}
            </div>
            <span className="text-[11px] text-purple-600 font-semibold">
              {getGpaRating(cumulativeGpa)}
            </span>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground block mb-1">
              المعدل الفصلي الأخير
            </span>
            <div className="text-2xl font-black font-mono text-cyan-600 dark:text-cyan-400">
              {semesterGpa > 0 ? `${semesterGpa.toFixed(1)}%` : "—"}
            </div>
            <span className="text-[11px] text-muted-foreground">آخر فصل معتمد</span>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground block mb-1">
              الساعات المجتازة
            </span>
            <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {progress.totalCompletedHours}{' '}
              <span className="text-xs font-normal text-muted-foreground">ساعة</span>
            </div>
            <span className="text-[11px] text-muted-foreground">من أصل {progress.totalPlanHours} س</span>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground block mb-1">
              الساعات المتبقية
            </span>
            <div className="text-2xl font-black font-mono text-foreground">
              {progress.remainingHours}{' '}
              <span className="text-xs font-normal text-muted-foreground">ساعة</span>
            </div>
            <span className="text-[11px] text-muted-foreground">للتخرج</span>
          </div>
        </div>

        {/* Simulator Grid */}
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Controls & Inputs (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-3xl border bg-card shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Sparkles className="size-5 text-amber-500" />
                <h2 className="text-base font-bold text-foreground">
                  محاكاة نتائج الفصل القادم (What-If Analysis)
                </h2>
              </div>

              <div className="space-y-4">
                {/* Hours Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>عدد الساعات المتوقع تسجيلها:</span>
                    <span className="font-mono text-primary text-base font-black">
                      {simHours} ساعة معتمدة
                    </span>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={21}
                    step={3}
                    value={simHours}
                    onChange={(e) => setSimHours(Number(e.target.value))}
                    className="w-full h-2 rounded-lg bg-muted appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                    <span>3 ساعات</span>
                    <span>9 ساعات</span>
                    <span>15 ساعة (عبء اعتيادي)</span>
                    <span>21 ساعة (حد أقصى)</span>
                  </div>
                </div>

                {/* Grade Slider */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>المعدل الفصلي المفترض تحصيله:</span>
                    <span className="font-mono text-cyan-600 dark:text-cyan-400 text-base font-black">
                      {simGrade}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={100}
                    step={1}
                    value={simGrade}
                    onChange={(e) => setSimGrade(Number(e.target.value))}
                    className="w-full h-2 rounded-lg bg-muted appearance-none cursor-pointer accent-cyan-600"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                    <span>50% (حافة النجاح)</span>
                    <span>68% (جيد)</span>
                    <span>76% (جيد جداً)</span>
                    <span>84%+ (امتياز)</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              {/* Target GPA Solver Box */}
              <div className="p-4 rounded-2xl bg-muted/40 border space-y-3 pt-4">
                <div className="flex items-center gap-2">
                  <Target className="size-4 text-purple-600" />
                  <h3 className="text-xs font-bold text-foreground">
                    حاسبة المعدل المطلوب لتحقيق هدفك (Target GPA Solver):
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    المعدل التراكمي المستهدف:
                  </span>
                  <input
                    type="number"
                    min={60}
                    max={100}
                    step={0.5}
                    value={targetCumGpa}
                    onChange={(e) => setTargetCumGpa(Number(e.target.value))}
                    className="h-9 w-24 rounded-xl border bg-background px-3 text-xs font-bold font-mono outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-xs font-bold font-mono">%</span>
                </div>

                <div className="p-3 rounded-xl bg-card border text-xs leading-relaxed">
                  {requiredSemesterGrade > 100 ? (
                    <span className="text-destructive font-semibold">
                      ⚠️ يتطلب تحقيق هذا الهدف فصلاً بمعدل ({requiredSemesterGrade.toFixed(1)}%) وهو أعلى من الحد الأقصى (100%). ستحتاج لتوزيع الهدف على أكثر من فصل.
                    </span>
                  ) : requiredSemesterGrade <= 50 ? (
                    <span className="text-emerald-600 font-semibold">
                      🎉 ممتاز! معدلك التراكمي الحالي أعلى بالفعل من الهدف أو يتطلب معدلاً فصلياً يسيراً ({requiredSemesterGrade.toFixed(1)}%).
                    </span>
                  ) : (
                    <span>
                      🎯 لتحقيق معدل تراكمي <strong>{targetCumGpa}%</strong> في نهاية الفصل بعبء ({simHours} ساعة)، يجب ألا يقل معدلك الفصلي عن{' '}
                      <strong className="text-purple-600 font-mono text-sm">{requiredSemesterGrade.toFixed(1)}%</strong> ({getGpaRating(requiredSemesterGrade)}).
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Results Projection Card (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="p-6 rounded-3xl border bg-gradient-to-b from-card to-muted/20 shadow-sm space-y-5">
              <h2 className="text-base font-bold text-foreground pb-2 border-b">
                النتيجة التقديرية المتوقعة
              </h2>

              <div className="text-center p-6 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-2">
                <span className="text-xs font-semibold text-muted-foreground block">
                  المعدل التراكمي الجديد بعد المحاكاة
                </span>
                <div className="text-4xl sm:text-5xl font-black font-mono text-purple-600 dark:text-purple-400">
                  {simulatedCumulativeGpa.toFixed(2)}%
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border text-xs font-bold">
                  <span>التقدير الأكاديمي:</span>
                  <span className="text-purple-600 font-black">
                    {getGpaRating(simulatedCumulativeGpa)}
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground">الفارق عن المعدل التراكمي الحالي:</span>
                  <span
                    className={cn(
                      "font-mono font-bold text-sm",
                      gpaDiff >= 0 ? "text-emerald-600" : "text-destructive",
                    )}
                  >
                    {gpaDiff >= 0 ? `+${gpaDiff.toFixed(2)}% 📈` : `${gpaDiff.toFixed(2)}% 📉`}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground">مجموع الساعات المجتازة الجديد:</span>
                  <span className="font-mono font-bold text-foreground">
                    {simulatedTotalHours} ساعة
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground">الساعات المتبقية بعد الفصل:</span>
                  <span className="font-mono font-bold text-foreground">
                    {Math.max(0, progress.totalPlanHours - simulatedTotalHours)} ساعة
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/grades"
                  className="w-full py-2.5 rounded-xl border bg-background hover:bg-muted text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <span>عرض كشف العلامات الكامل</span>
                  <ArrowUpRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

