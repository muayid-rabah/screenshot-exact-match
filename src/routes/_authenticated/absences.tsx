import { createFileRoute } from "@tanstack/react-router";
import {
  UserX,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  Percent,
  Calendar,
  Clock,
  Printer,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { useStudentStore } from "@/lib/student-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/absences")({
  head: () => ({
    meta: [
      { title: "سجل الغيابات والحضور | جامعة NextAura" },
      { name: "description", content: "متابعة نسب الغياب والحضور والإنذارات الأكاديمية في جامعة NextAura." },
    ],
  }),
  component: AbsencesPage,
});

export function AbsencesPage() {
  const { activeStudent } = useStudentStore();
  const absences = activeStudent.absences;

  const totalLectures = absences.reduce((acc, a) => acc + a.totalLectures, 0);
  const totalAbsences = absences.reduce((acc, a) => acc + a.absencesCount, 0);
  const warningCount = absences.filter((a) => a.status === "تنبيه" || a.status === "مرتفع").length;

  const overallAttendanceRate =
    totalLectures > 0
      ? Math.round(((totalLectures - totalAbsences) / totalLectures) * 100)
      : 100;

  return (
    <AppShell name={activeStudent.name} uid={activeStudent.universityId}>
      <div className="mx-auto max-w-7xl space-y-6 text-right animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-foreground">
              <UserX className="size-7 text-primary" />
              <span>سجل الغيابات والحضور الأكاديمي</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              متابعة دقيقة لنسب الغياب والإنذارات في المساقات المسجلة حالياً للفصل الأول 2026/2027
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => window.print()}
              className="p-2.5 rounded-xl border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition shadow-xs"
              title="طباعة سجل الغياب"
            >
              <Printer className="size-4" />
            </button>
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-card border text-muted-foreground shadow-xs">
              الفصل الأول 2026/2027
            </span>
          </div>
        </div>

        {/* Warning Alert if threshold reached */}
        {warningCount > 0 && (
          <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5 shadow-sm">
            <AlertTriangle className="size-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground">
                تنبيه أكاديمي بشأن الاقتراب من حد الغياب المسموح به
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                لديك ({warningCount}) مواد تجاوزت أو تقترب من نسبة الغياب المسموحة (15% من مجموع المحاضرات). يُرجى الالتزام وتقديم الأعذار الطبية أو الرسمية المعتمدة لعمادة الكلية لتجنب صدور قرار الحرمان النهائي.
              </p>
            </div>
          </div>
        )}

        {/* 4 Summary Highlight Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground block mb-1">
              إجمالي الغيابات المسجلة
            </span>
            <div className="text-2xl font-black font-mono text-foreground">
              {totalAbsences}{' '}
              <span className="text-xs font-normal text-muted-foreground">محاضرة</span>
            </div>
            <span className="text-[11px] text-muted-foreground">في كافة المساقات</span>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground block mb-1">
              نسبة الحضور الإجمالية
            </span>
            <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {overallAttendanceRate}%
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold">حضور منتظم</span>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground block mb-1">
              المساقات تحت المراقبة
            </span>
            <div
              className={cn(
                "text-2xl font-black font-mono",
                warningCount > 0 ? "text-destructive" : "text-foreground",
              )}
            >
              {warningCount}{' '}
              <span className="text-xs font-normal text-muted-foreground">مواد</span>
            </div>
            <span className="text-[11px] text-muted-foreground">تتطلب الالتزام</span>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground block mb-1">
              الحد الأقصى المسموح
            </span>
            <div className="text-2xl font-black font-mono text-foreground">
              15%
            </div>
            <span className="text-[11px] text-muted-foreground">بموجب تعليمات الجامعة</span>
          </div>
        </div>

        {/* Detailed Absences Table */}
        <div className="rounded-3xl border bg-card overflow-hidden shadow-sm space-y-4">
          <div className="p-4 border-b">
            <h2 className="text-base font-bold text-foreground">تفاصيل الحضور والغياب لكل مساق</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              متابعة دقيقة لكل مساق مسجل مع رصد عدد الغيابات والنسبة والحد الأقصى
            </p>
          </div>

          {absences.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground space-y-2">
              <CheckCircle2 className="size-8 mx-auto text-emerald-500" />
              <p>سجل حضورك منتظم بالكامل ولا توجد أي غيابات مسجلة بحقك للفصل الحالي.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-3 px-4">رقم المساق</th>
                    <th className="py-3 px-4">اسم المساق والمدرس</th>
                    <th className="py-3 px-4 text-center">المحاضرات المنعقدة</th>
                    <th className="py-3 px-4 text-center">عدد الغيابات</th>
                    <th className="py-3 px-4 text-center">نسبة الغياب</th>
                    <th className="py-3 px-4 text-center">الحد المسموح (15%)</th>
                    <th className="py-3 px-4 text-center">الحالة الأكاديمية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {absences.map((rec) => {
                    const maxAllowed = Math.ceil(rec.totalLectures * 0.15) || 6;
                    const remainingAllowed = Math.max(0, maxAllowed - rec.absencesCount);

                    return (
                      <tr key={rec.courseCode} className="hover:bg-muted/20 transition">
                        <td className="py-3.5 px-4 font-mono font-bold">{rec.courseCode}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-foreground block">{rec.courseName}</span>
                          <span className="text-[10px] text-muted-foreground">المدرس: {rec.instructor}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-foreground">
                          {rec.totalLectures}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-extrabold text-sm">
                          <span
                            className={cn(
                              rec.absencesCount > 3 ? "text-destructive" : "text-foreground",
                            )}
                          >
                            {rec.absencesCount}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="font-mono font-bold text-xs">{rec.absencePercentage}%</div>
                          <div className="w-16 h-1.5 rounded-full bg-muted mx-auto mt-1 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                rec.absencePercentage >= 15
                                  ? "bg-destructive"
                                  : rec.absencePercentage >= 10
                                    ? "bg-amber-500"
                                    : "bg-emerald-500",
                              )}
                              style={{ width: `${Math.min(100, (rec.absencePercentage / 15) * 100)}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center text-muted-foreground">
                          <span className="font-mono font-bold">{maxAllowed}</span> محاضرات (متبقي {remainingAllowed})
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block",
                              rec.status === "طبيعي"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : rec.status === "تنبيه"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                  : "bg-destructive/15 text-destructive",
                            )}
                          >
                            {rec.status === "طبيعي" ? "حضور منتظم" : rec.status === "تنبيه" ? "إنذار أول" : "حرج / مهدد بالحرمان"}
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

        {/* Regulations Info Box */}
        <div className="p-4 rounded-2xl bg-muted/40 border text-xs text-muted-foreground space-y-1 leading-relaxed">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <ShieldAlert className="size-4 text-primary" />
            <span>تعليمات الغياب والحرمان في جامعة NextAura:</span>
          </div>
          <p>
            • تنص المادة (14) من تعليمات منح درجة البكالوريوس على أن غياب الطالب بما يزيد عن 15% من الساعات المقررة للمساق دون عذر مقبول يفضي إلى حرمان الطالب من التقدم للامتحان النهائي ويُرصد له تقدير (محروم - راسب).
          </p>
          <p>
            • يجب تقديم الأعذار المرضية المعتمدة خلال أسبوع واحد كحد أقصى من تاريخ العودة للدوام إلى عمادة شؤون الطلبة.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

