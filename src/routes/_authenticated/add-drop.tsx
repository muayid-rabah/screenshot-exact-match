import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  CalendarRange,
  Calendar,
  AlertCircle,
  Clock,
  Trash2,
  Plus,
  RefreshCw,
  CheckCircle2,
  X,
  MapPin,
  User,
  Layers,
  ArrowRightLeft,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { useStudentStore } from "@/lib/student-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { CourseSection } from "@/types/student";

export const Route = createFileRoute("/_authenticated/add-drop")({
  head: () => ({
    meta: [
      { title: "السحب والإضافة | جامعة NextAura" },
      { name: "description", content: "إدارة السحب والإضافة وتغيير الشعب للفصل الحالي في جامعة NextAura." },
    ],
  }),
  component: AddDropPage,
});

export function AddDropPage() {
  const {
    activeStudent,
    academicDates,
    offeredSections,
    withdrawSection,
    swapSection,
  } = useStudentStore();

  const [dropTarget, setDropTarget] = useState<CourseSection | null>(null);
  const [swapTarget, setSwapTarget] = useState<CourseSection | null>(null);
  const [selectedSwapSection, setSelectedSwapSection] = useState<CourseSection | null>(null);
  const [loading, setLoading] = useState(false);

  // Other sections of the course being swapped
  const alternativeSections = swapTarget
    ? offeredSections.filter(
        (s) => s.courseCode === swapTarget.courseCode && s.id !== swapTarget.id,
      )
    : [];

  async function handleConfirmDrop() {
    if (!dropTarget) return;
    setLoading(true);
    try {
      const res = await withdrawSection(dropTarget.id);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } finally {
      setLoading(false);
      setDropTarget(null);
    }
  }

  async function handleConfirmSwap() {
    if (!swapTarget || !selectedSwapSection) return;
    setLoading(true);
    try {
      const res = await swapSection(swapTarget.id, selectedSwapSection);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } finally {
      setLoading(false);
      setSwapTarget(null);
      setSelectedSwapSection(null);
    }
  }

  return (
    <AppShell name={activeStudent.name} uid={activeStudent.universityId}>
      <div className="mx-auto max-w-7xl space-y-6 text-right animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-foreground">
              <CalendarRange className="size-7 text-primary" />
              <span>السحب والإضافة وتغيير الشعب</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              التقويم المعتمد وإدارة المساقات المسجلة للفصل الأول 2026/2027 في جامعة NextAura
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold border border-emerald-200">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              فترة السحب والإضافة الإلكترونية نشطة
            </span>
          </div>
        </div>

        {/* Academic Date Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {academicDates.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-3xl bg-card border shadow-sm hover:shadow-md transition space-y-2.5 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-muted text-primary">
                    <Calendar className="size-4" />
                  </span>
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-bold",
                      item.status === "مفتوح الآن"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {item.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-foreground leading-snug">{item.title}</h3>
              </div>

              <div className="pt-2 border-t">
                <div className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 dir-ltr text-end sm:text-start">
                  {item.date}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 leading-normal">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Registered Courses Management */}
        <div className="rounded-3xl border bg-card p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
            <div>
              <h2 className="text-base font-bold text-foreground">
                المساقات المسجلة للفصل الحالي (إدارة السحب، الإسقاط، وتغيير الشعبة):
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                يمكنك إسقاط أي مادة مسجلة أو استبدال شعبتها بشعبة أخرى خالية من التعارضات.
              </p>
            </div>

            <Link
              to="/registration"
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="size-4" />
              <span>إضافة مساق جديد</span>
            </Link>
          </div>

          {activeStudent.currentRegisteredSections.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground space-y-2">
              <CalendarRange className="size-8 mx-auto opacity-40" />
              <p>لا توجد مواد مسجلة في جدولك حالياً لتعديلها أو إسقاطها.</p>
            </div>
          ) : (
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {activeStudent.currentRegisteredSections.map((sec) => (
                <div
                  key={sec.id}
                  className="rounded-2xl border bg-muted/20 p-4 hover:border-primary/40 transition space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-muted-foreground">
                        {sec.courseCode}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-mono text-[10px] font-bold">
                        شعبة {sec.sectionNumber}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-foreground">{sec.courseName}</h3>
                    <div className="text-xs text-muted-foreground space-y-0.5 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-3.5 text-muted-foreground" />
                        <span>{sec.days} ({sec.startTime} - {sec.endTime})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-muted-foreground" />
                        <span>القاعة: {sec.room}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="size-3.5 text-muted-foreground" />
                        <span>المدرس: {sec.instructor}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSwapTarget(sec);
                        setSelectedSwapSection(null);
                      }}
                      className="flex-1 py-1.5 rounded-xl border bg-background hover:bg-muted text-foreground text-xs font-bold transition flex items-center justify-center gap-1"
                    >
                      <ArrowRightLeft className="size-3.5 text-primary" />
                      <span>تغيير الشعبة</span>
                    </button>

                    <button
                      onClick={() => setDropTarget(sec)}
                      className="py-1.5 px-3 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive hover:text-white text-xs font-bold transition flex items-center gap-1"
                      title="إسقاط المساق"
                    >
                      <Trash2 className="size-3.5" />
                      <span>إسقاط</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drop Confirmation Modal */}
        {dropTarget && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-3xl bg-card border p-6 shadow-2xl space-y-4 animate-rise text-right">
              <div className="size-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
                <Trash2 className="size-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-foreground">
                  تأكيد إسقاط مساق: {dropTarget.courseName}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  هل أنت متأكد من رغبتك في سحب وإسقاط المساق ({dropTarget.courseCode} - شعبة {dropTarget.sectionNumber}) من جدولك للفصل الحالي؟ سيتم استرداد رسوم الساعات ({dropTarget.credits * 40} د.أ) إلى حسابك المالي فوراً.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-muted text-xs space-y-1">
                <div>عدد الساعات: <strong>{dropTarget.credits} ساعات</strong></div>
                <div>المدرس: <strong>{dropTarget.instructor}</strong></div>
                <div>الموعد: <strong>{dropTarget.days} {dropTarget.startTime}-{dropTarget.endTime}</strong></div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleConfirmDrop}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-destructive hover:bg-destructive/90 text-white font-bold text-xs transition"
                >
                  {loading ? "جاري الإسقاط..." : "نعم، أسقط المساق"}
                </button>
                <button
                  onClick={() => setDropTarget(null)}
                  className="flex-1 py-2.5 rounded-xl border hover:bg-muted font-bold text-xs transition"
                >
                  إلغاء التراجع
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Swap Section Modal */}
        {swapTarget && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-xl rounded-3xl bg-card border p-6 shadow-2xl space-y-4 animate-rise text-right">
              <div className="flex items-center justify-between pb-2 border-b">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="size-5 text-primary" />
                  <h3 className="text-base font-bold text-foreground">
                    تغيير شعبة: {swapTarget.courseName}
                  </h3>
                </div>
                <button onClick={() => setSwapTarget(null)} className="p-1 rounded-lg hover:bg-muted">
                  <X className="size-4" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                أنت مسجل حالياً في <strong>شعبة {swapTarget.sectionNumber}</strong> ({swapTarget.days} {swapTarget.startTime}-{swapTarget.endTime}). اختر الشعبة البديلة التي ترغب بالانتقال إليها:
              </p>

              {alternativeSections.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  لا تتوفر شعب بديلة مطروحة لهذا المساق في الفصل الحالي.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {alternativeSections.map((alt) => {
                    const isSelected = selectedSwapSection?.id === alt.id;
                    const isFull = alt.enrolled >= alt.capacity;
                    return (
                      <div
                        key={alt.id}
                        onClick={() => !isFull && setSelectedSwapSection(alt)}
                        className={cn(
                          "p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between",
                          isSelected
                            ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                            : isFull
                              ? "opacity-50 cursor-not-allowed bg-muted/20"
                              : "hover:border-primary/50 bg-background",
                        )}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-foreground">
                              شعبة {alt.sectionNumber}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              المدرس: {alt.instructor}
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono">
                            {alt.days} ({alt.startTime} - {alt.endTime}) · قاعة {alt.room}
                          </div>
                        </div>

                        <div className="text-end">
                          <span
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full",
                              isFull
                                ? "bg-destructive/15 text-destructive"
                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
                            )}
                          >
                            {isFull ? "ممتلئة" : `${alt.capacity - alt.enrolled} مقاعد متاحة`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t">
                <button
                  onClick={handleConfirmSwap}
                  disabled={loading || !selectedSwapSection}
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition disabled:opacity-40"
                >
                  {loading ? "جاري التغيير..." : "تأكيد تغيير الشعبة"}
                </button>
                <button
                  onClick={() => setSwapTarget(null)}
                  className="py-2.5 px-5 rounded-xl border hover:bg-muted font-bold text-xs transition"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

