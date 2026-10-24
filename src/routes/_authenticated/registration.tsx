import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  BookOpenCheck,
  Search,
  Plus,
  Trash2,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Filter,
  ShoppingCart,
  CalendarDays,
  CalendarClock,
  Sparkles,
  Info,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { useStudentStore } from "@/lib/student-store";
import {
  calculateStudentProgress,
  getRegistrationEligibility,
  checkSectionConflict,
} from "@/services/academicEngine";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/registration")({
  head: () => ({
    meta: [
      { title: "التسجيل الإلكتروني | جامعة NextAura" },
      { name: "description", content: "بوابة تسجيل المواد الإلكترونية وسحب وإضافة الشعب في جامعة NextAura." },
    ],
  }),
  component: RegistrationPage,
});

type TabType = "offered" | "registered" | "dates";

export function RegistrationPage() {
  const {
    activeStudent,
    courses,
    offeredSections,
    academicDates,
    basketSections,
    addToBasket,
    removeFromBasket,
    confirmRegistration,
    withdrawSection,
  } = useStudentStore();

  const [activeTab, setActiveTab] = useState<TabType>("registered");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGroup, setFilterGroup] = useState<string>("ALL");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progress = calculateStudentProgress(activeStudent, courses);
  const registeredHours = activeStudent.currentRegisteredSections.reduce(
    (sum, s) => sum + s.credits,
    0,
  );
  const basketHours = basketSections.reduce((sum, s) => sum + s.credits, 0);
  const totalPlannedHours = registeredHours + basketHours;
  const MAX_ALLOWED_CREDITS = 21;

  // Filter offered sections
  const filteredSections = useMemo(() => {
    return offeredSections.filter((sec) => {
      // Search
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        sec.courseCode.toLowerCase().includes(q) ||
        sec.courseName.toLowerCase().includes(q) ||
        sec.instructor.toLowerCase().includes(q) ||
        sec.room.toLowerCase().includes(q);
      if (!matchSearch) return false;

      // Group filter
      if (filterGroup !== "ALL") {
        const course = courses.find((c) => c.code === sec.courseCode);
        if (!course || course.group !== filterGroup) return false;
      }

      // Only available seats
      if (onlyAvailable && (sec.status === "ممتلئة" || sec.enrolled >= sec.capacity)) {
        return false;
      }

      return true;
    });
  }, [offeredSections, searchQuery, filterGroup, onlyAvailable, courses]);

  // Unique groups for filter
  const groups = useMemo(() => {
    return Array.from(new Set(courses.map((c) => c.group)));
  }, [courses]);

  async function handleConfirm() {
    setIsSubmitting(true);
    try {
      const res = await confirmRegistration();
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleWithdraw(secId: string, name: string) {
    if (confirm(`هل أنت متأكد من رغبتك في سحب مساق "${name}" من جدولك الدراسي؟`)) {
      const res = await withdrawSection(secId);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    }
  }

  return (
    <AppShell name={activeStudent.name} uid={activeStudent.universityId}>
      <div className="mx-auto max-w-7xl space-y-6 text-right animate-fade-in">
        {/* Header Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0b132b] via-[#1c2541] to-[#1e1b4b] p-6 text-white shadow-xl sm:p-8 border border-white/10">
          <div aria-hidden className="absolute -start-16 -top-20 size-64 rounded-full border border-cyan-500/20 pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30 mb-2">
                <CalendarClock className="size-3.5" />
                <span>الفصل الأول 2026/2027 · فترة التسجيل نشطة</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight flex items-center gap-3">
                <BookOpenCheck className="size-8 text-cyan-400" />
                بوابة التسجيل الإلكتروني
              </h1>
              <p className="mt-2 text-sm text-slate-300 max-w-xl">
                اختر شعب المواد المطروحة وثبّت جدولك الدراسي للفصل الحالي مع التحقق التلقائي من المتطلبات والتعارضات.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 text-center">
              <div className="rounded-2xl bg-white/10 p-3 backdrop-blur border border-white/10">
                <div className="text-2xl font-black font-mono text-cyan-300">{registeredHours}</div>
                <div className="text-[11px] text-slate-300 font-semibold">ساعات مسجلة</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 backdrop-blur border border-white/10">
                <div className="text-2xl font-black font-mono text-amber-300">{basketHours}</div>
                <div className="text-[11px] text-slate-300 font-semibold">في المسودة</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 backdrop-blur border border-white/10">
                <div className={cn("text-2xl font-black font-mono", totalPlannedHours > MAX_ALLOWED_CREDITS ? "text-destructive" : "text-emerald-300")}>
                  {totalPlannedHours}
                </div>
                <div className="text-[11px] text-slate-300 font-semibold">من {MAX_ALLOWED_CREDITS} س</div>
              </div>
            </div>
          </div>
        </section>

        {/* Academic Hours Progress Bar */}
        <div className="p-4 rounded-2xl border bg-card shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
          <div className="flex items-center gap-6 flex-wrap">
            <span>
              الساعات المنجزة: <strong className="font-mono text-emerald-600 text-sm">{progress.totalCompletedHours}</strong>
            </span>
            <span>
              الساعات المتبقية: <strong className="font-mono text-purple-600 text-sm">{progress.remainingHours}</strong>
            </span>
            <span>
              ساعات الخطة: <strong className="font-mono text-foreground text-sm">{progress.totalPlanHours}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">حالة فترة التسجيل:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              مفتوح إلكترونياً
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b pb-1">
          <button
            onClick={() => setActiveTab("registered")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition",
              activeTab === "registered"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <BookOpenCheck className="size-4" />
            <span>جدولي والمسودة الحالية ({activeStudent.currentRegisteredSections.length + basketSections.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("offered")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition",
              activeTab === "offered"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <Layers className="size-4" />
            <span>الشعب والمواد المطروحة ({filteredSections.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("dates")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition",
              activeTab === "dates"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <CalendarClock className="size-4" />
            <span>مواعيد التسجيل والتقويم</span>
          </button>
        </div>

        {/* TAB 1: Registered & Basket Table */}
        {activeTab === "registered" && (
          <section className="space-y-6">
            {/* Draft Basket Alert */}
            {basketSections.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
                    <ShoppingCart className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">
                      لديك ({basketSections.length}) مواد في سلة التسجيل بانتظار التأكيد ({basketHours} ساعة)
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      لن يتم تثبيت حجز المقاعد رسمياً حتى تضغط على زر "تأكيد تسجيل المسودة".
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="size-4" />
                  <span>تأكيد تسجيل المسودة الآن</span>
                </button>
              </div>
            )}

            {/* Registered and Draft Table */}
            <div className="rounded-3xl border bg-card overflow-hidden shadow-sm">
              <div className="p-5 border-b flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-foreground">المساقات المسجلة والمسودة للفصل الحالي</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    إجمالي الساعات المثبتة والمسودة: {totalPlannedHours} ساعة معتمدة
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("offered")}
                  className="px-3.5 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition font-bold text-xs flex items-center gap-1.5"
                >
                  <Plus className="size-4" />
                  <span>إضافة مادة جديدة</span>
                </button>
              </div>

              {activeStudent.currentRegisteredSections.length === 0 && basketSections.length === 0 ? (
                <div className="py-16 text-center text-sm text-muted-foreground space-y-3">
                  <BookOpenCheck className="size-10 mx-auto text-muted-foreground/40" />
                  <p>لا توجد مساقات مسجلة في جدولك حالياً.</p>
                  <button
                    onClick={() => setActiveTab("offered")}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
                  >
                    تصفح الشعب المطروحة والتسجيل
                  </button>
                </div>
              ) : (
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
                        <th className="py-3 px-4 text-center">الحالة</th>
                        <th className="py-3 px-4 text-center">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {/* Active confirmed registered sections */}
                      {activeStudent.currentRegisteredSections.map((sec) => (
                        <tr key={sec.id} className="hover:bg-muted/20 transition">
                          <td className="py-3 px-4 font-mono font-bold">{sec.courseCode}</td>
                          <td className="py-3 px-4 font-bold text-foreground">{sec.courseName}</td>
                          <td className="py-3 px-4 text-center font-mono">{sec.sectionNumber}</td>
                          <td className="py-3 px-4">
                            <span className="font-semibold">{sec.days}</span>
                            <span className="block font-mono text-[11px] text-muted-foreground dir-ltr text-end sm:text-start">
                              {sec.startTime} - {sec.endTime}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-muted-foreground">{sec.room}</td>
                          <td className="py-3 px-4 font-medium">{sec.instructor}</td>
                          <td className="py-3 px-4 text-center font-mono font-bold">{sec.credits}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                              مسجلة ومثبتة
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleWithdraw(sec.id, sec.courseName)}
                              className="px-2.5 py-1 rounded-lg text-destructive hover:bg-destructive/10 text-xs font-bold transition flex items-center gap-1 mx-auto"
                            >
                              <Trash2 className="size-3.5" />
                              <span>إسقاط</span>
                            </button>
                          </td>
                        </tr>
                      ))}

                      {/* Draft basket sections */}
                      {basketSections.map((sec) => (
                        <tr key={sec.id} className="bg-amber-500/5 hover:bg-amber-500/10 transition">
                          <td className="py-3 px-4 font-mono font-bold text-amber-700 dark:text-amber-300">
                            {sec.courseCode}
                          </td>
                          <td className="py-3 px-4 font-bold text-foreground">
                            {sec.courseName}{' '}
                            <span className="text-[10px] text-amber-600 font-semibold">(مسودة)</span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono">{sec.sectionNumber}</td>
                          <td className="py-3 px-4">
                            <span className="font-semibold">{sec.days}</span>
                            <span className="block font-mono text-[11px] text-muted-foreground dir-ltr text-end sm:text-start">
                              {sec.startTime} - {sec.endTime}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-muted-foreground">{sec.room}</td>
                          <td className="py-3 px-4 font-medium">{sec.instructor}</td>
                          <td className="py-3 px-4 text-center font-mono font-bold">{sec.credits}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold">
                              في السلة
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                removeFromBasket(sec.id);
                                toast.info(`تم حذف مساق "${sec.courseName}" من المسودة.`);
                              }}
                              className="px-2.5 py-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs font-bold transition"
                            >
                              إزالة
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {/* TAB 2: Offered Courses & Sections */}
        {activeTab === "offered" && (
          <section className="space-y-4">
            {/* Search & Filters */}
            <div className="p-4 rounded-3xl border bg-card shadow-sm space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-6 relative">
                  <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث برقم المادة أو اسمها أو اسم المدرس أو القاعة..."
                    className="h-10 w-full rounded-xl border bg-background ps-9 pe-3 text-xs outline-none focus:ring-2 focus:ring-primary/40 transition"
                  />
                </div>

                <div className="sm:col-span-4">
                  <select
                    value={filterGroup}
                    onChange={(e) => setFilterGroup(e.target.value)}
                    className="h-10 w-full rounded-xl border bg-background px-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="ALL">جميع فئات الخطة الدراسية</option>
                    {groups.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={onlyAvailable}
                      onChange={(e) => setOnlyAvailable(e.target.checked)}
                      className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span>الشعب الشاغرة فقط</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Offered Sections List */}
            <div className="rounded-3xl border bg-card overflow-hidden shadow-sm">
              <div className="p-4 border-b flex items-center justify-between text-xs text-muted-foreground">
                <span>الشعب المعروضة: <strong>{filteredSections.length}</strong> شعبة</span>
                <span>فترة الفصل الأول 2026/2027</span>
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
                      <th className="py-3 px-4 text-center">المقاعد المتاحة</th>
                      <th className="py-3 px-4 text-center">أهلية التسجيل</th>
                      <th className="py-3 px-4 text-center">التسجيل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredSections.map((sec) => {
                      const eligibility = getRegistrationEligibility(sec.courseCode, activeStudent, courses);
                      const isAlreadyRegistered = activeStudent.currentRegisteredSections.some(
                        (s) => s.courseCode === sec.courseCode,
                      );
                      const isInBasket = basketSections.some((s) => s.id === sec.id);
                      const isFull = sec.enrolled >= sec.capacity || sec.status === "ممتلئة";
                      const availableSeats = Math.max(0, sec.capacity - sec.enrolled);

                      return (
                        <tr key={sec.id} className={cn("hover:bg-muted/20 transition", isInBasket && "bg-amber-500/5")}>
                          <td className="py-3 px-4 font-mono font-bold">{sec.courseCode}</td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-foreground block">{sec.courseName}</span>
                            <span className="text-[10px] text-muted-foreground">{sec.credits} ساعات</span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold">{sec.sectionNumber}</td>
                          <td className="py-3 px-4">
                            <span className="font-semibold block">{sec.days}</span>
                            <span className="font-mono text-[11px] text-muted-foreground dir-ltr text-end sm:text-start">
                              {sec.startTime} - {sec.endTime}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-muted-foreground">{sec.room}</td>
                          <td className="py-3 px-4 font-medium">{sec.instructor}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="font-mono font-bold text-xs">
                              {availableSeats} / {sec.capacity}
                            </div>
                            <div className="w-16 h-1.5 rounded-full bg-muted mx-auto mt-1 overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  isFull
                                    ? "bg-destructive"
                                    : availableSeats < 5
                                      ? "bg-amber-500"
                                      : "bg-emerald-500",
                                )}
                                style={{ width: `${Math.min(100, (sec.enrolled / sec.capacity) * 100)}%` }}
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={cn(
                                "px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block",
                                isAlreadyRegistered
                                  ? "bg-primary/10 text-primary"
                                  : eligibility.state === "ELIGIBLE"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                    : eligibility.state === "REVIEW_REQUIRED"
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                      : "bg-muted text-muted-foreground",
                              )}
                              title={eligibility.reason}
                            >
                              {isAlreadyRegistered ? "مسجل بجدولك" : eligibility.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isInBasket ? (
                              <button
                                onClick={() => removeFromBasket(sec.id)}
                                className="px-3 py-1 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white font-bold text-xs transition"
                              >
                                إلغاء
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  const res = addToBasket(sec);
                                  if (res.success) toast.success(res.message);
                                  else toast.error(res.message);
                                }}
                                disabled={
                                  isAlreadyRegistered ||
                                  isFull ||
                                  eligibility.state !== "ELIGIBLE"
                                }
                                className="px-3 py-1 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 mx-auto"
                              >
                                <Plus className="size-3.5" />
                                <span>إضافة</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* TAB 3: Academic Dates */}
        {activeTab === "dates" && (
          <section className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {academicDates.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-3xl bg-card border shadow-sm hover:shadow-md transition space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <CalendarDays className="size-4" />
                      </div>
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
          </section>
        )}
      </div>
    </AppShell>
  );
}
