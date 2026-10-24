import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Clock,
  MapPin,
  CalendarClock,
  BookOpenCheck,
  CalendarDays,
  Sparkles,
  Map,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Layers,
  UserRound,
  GraduationCap,
  Wallet,
  UserX,
  FileCheck2,
  ChevronLeft,
  ArrowUpRight,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { AppShell } from "@/components/app/AppShell";
import { useStudentStore } from "@/lib/student-store";
import { calculateStudentProgress } from "@/services/academicEngine";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "لوحة الطالب | جامعة NextAura" },
      { name: "description", content: "نظرة شاملة على وضعك الأكاديمي وجدولك في جامعة NextAura." },
      { property: "og:title", content: "لوحة الطالب — جامعة NextAura" },
      { property: "og:description", content: "الساعات، المعدلات، محاضرات اليوم، والامتحانات القادمة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

export function Dashboard() {
  const { activeStudent, courses, academicDates, notifications } = useStudentStore();
  const progress = calculateStudentProgress(activeStudent, courses);

  const history = activeStudent.semesterHistory;
  const latestSem = history[history.length - 1];
  const activeSections = activeStudent.currentRegisteredSections;

  // Next exam
  const sortedExams = [...activeStudent.exams].sort((a, b) => a.date.localeCompare(b.date));
  const nextExam = sortedExams[0];

  // Absences
  const totalAbsences = activeStudent.absences.reduce((acc, a) => acc + a.absencesCount, 0);
  const warningAbsences = activeStudent.absences.filter(
    (a) => a.status === 'تنبيه' || a.status === 'مرتفع',
  );

  // Today's lectures (Sunday = 0, etc.)
  const now = new Date();
  const dayNamesArabic: Record<number, string> = {
    0: 'الأحد',
    1: 'الاثنين',
    2: 'الثلاثاء',
    3: 'الأربعاء',
    4: 'الخميس',
    5: 'الجمعة',
    6: 'السبت',
  };
  const currentDayName = dayNamesArabic[now.getDay()] || 'الأحد';
  const todayLectures = useMemo(() => {
    return activeSections.filter(
      (sec) =>
        sec.days.includes(currentDayName) ||
        (sec.daysArray && sec.daysArray.includes(currentDayName as any)),
    );
  }, [activeSections, currentDayName]);

  // GPA chart timeline
  const gpaTimeline = useMemo(() => {
    return history.map((sem) => ({
      name: sem.semesterName.replace('الفصل ', '').slice(0, 15),
      termGpa: sem.semesterGpa,
      cumGpa: sem.cumulativeGpa,
      hours: sem.passedHours,
    }));
  }, [history]);

  // Requirement categories
  const categoryChartData = useMemo(() => {
    const groups = progress.groupRequirements;
    const completed = progress.groupCompletedHours;
    return Object.entries(groups).map(([name, need]) => ({
      name,
      done: completed[name as keyof typeof completed] || 0,
      need,
      pct: Math.min(100, Math.round(((completed[name as keyof typeof completed] || 0) / need) * 100)),
    }));
  }, [progress]);

  const firstName = activeStudent.name.split(' ')[0];
  const unreadNotifs = notifications.filter((n) => n.unread).length;

  return (
    <AppShell name={activeStudent.name} uid={activeStudent.universityId} unread={unreadNotifs}>
      <div className="mx-auto max-w-7xl space-y-6 animate-fade-in text-right">
        {/* Welcome Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0b132b] via-[#1c2541] to-[#1e1b4b] p-6 text-white shadow-xl sm:p-8 border border-white/10">
          <div aria-hidden className="absolute -start-16 -top-20 size-64 rounded-full border border-cyan-500/20 pointer-events-none" />
          <div aria-hidden className="absolute -end-20 -bottom-24 size-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30 mb-2">
                <Sparkles className="size-3.5" />
                <span>الفصل الأول 2026/2027 · جامعة NextAura</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                أهلاً بك، {firstName} 👋
              </h1>
              <p className="mt-2 text-sm text-slate-300 max-w-xl leading-relaxed">
                {activeStudent.major} · {activeStudent.faculty} · الخطة الدراسية ({activeStudent.studyPlan})
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs sm:grid-cols-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur">
              <HeroFact label="الحالة الأكاديمية" value={activeStudent.academicStatus} highlight />
              <HeroFact label="المرشد الأكاديمي" value={activeStudent.academicAdvisor} />
              <HeroFact label="سنة القبول" value={String(activeStudent.admissionYear)} />
              <HeroFact label="الرقم الجامعي" value={activeStudent.universityId} ltr />
            </dl>
          </div>
        </section>

        {/* Quick KPI Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* المعدل التراكمي */}
          <div className="rounded-2xl border bg-card p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-bold">المعدل التراكمي</span>
              <TrendingUp className="size-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
              {latestSem?.cumulativeGpa ? `${latestSem.cumulativeGpa.toFixed(1)}%` : '—'}
            </div>
            <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">
              الفصلي: {latestSem?.semesterGpa ? `${latestSem.semesterGpa.toFixed(1)}%` : '—'}
            </div>
          </div>

          {/* الساعات المنجزة */}
          <div className="rounded-2xl border bg-card p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-bold">الساعات المنجزة</span>
              <GraduationCap className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {progress.totalCompletedHours}
              <span className="text-xs font-normal text-muted-foreground ms-1">ساعة</span>
            </div>
            <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">
              المتبقي: {progress.remainingHours} ساعة
            </div>
          </div>

          {/* ساعات الفصل الحالي */}
          <div className="rounded-2xl border bg-card p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-bold">ساعات هذا الفصل</span>
              <BookOpenCheck className="size-4 text-primary" />
            </div>
            <div className="text-2xl font-black font-mono text-primary">
              {activeSections.reduce((sum, s) => sum + s.credits, 0)}
              <span className="text-xs font-normal text-muted-foreground ms-1">ساعة</span>
            </div>
            <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">
              {activeSections.length} مساقات مسجلة
            </div>
          </div>

          {/* نسبة الإنجاز */}
          <div className="rounded-2xl border bg-card p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-bold">نسبة الخطة</span>
              <Map className="size-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="text-2xl font-black font-mono text-cyan-600 dark:text-cyan-400">
              {progress.completionPercentage}%
            </div>
            <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">
              من {progress.totalPlanHours} ساعة
            </div>
          </div>

          {/* إجمالي الغيابات */}
          <div className="rounded-2xl border bg-card p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-bold">سجل الغيابات</span>
              <UserX className={cn("size-4", totalAbsences > 5 ? "text-destructive" : "text-amber-500")} />
            </div>
            <div className={cn("text-2xl font-black font-mono", totalAbsences > 5 ? "text-destructive" : "text-amber-600")}>
              {totalAbsences}
              <span className="text-xs font-normal text-muted-foreground ms-1">محاضرة</span>
            </div>
            <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">
              {warningAbsences.length > 0 ? `⚠️ ${warningAbsences.length} مواد إنذار` : 'وضع الحضور منتظم'}
            </div>
          </div>

          {/* الرصيد المالي المستحق */}
          <div className="rounded-2xl border bg-card p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-bold">الرصيد المالي</span>
              <Wallet className="size-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black font-mono text-foreground">
              {activeStudent.financialSummary.currentBalance.toFixed(0)}
              <span className="text-xs font-normal text-muted-foreground ms-1">د.أ</span>
            </div>
            <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">
              {activeStudent.financialSummary.currentBalance > 0 ? 'مستحق الدفع' : 'مسدد بالكامل'}
            </div>
          </div>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/registration"
            className="flex items-center gap-3 p-3.5 rounded-2xl border bg-card hover:border-primary/50 hover:shadow-sm transition-all group"
          >
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition">
              <BookOpenCheck className="size-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground">التسجيل الإلكتروني</div>
              <div className="text-[10px] text-muted-foreground">إضافة وحذف وتغيير الشعب</div>
            </div>
          </Link>

          <Link
            to="/schedule"
            className="flex items-center gap-3 p-3.5 rounded-2xl border bg-card hover:border-primary/50 hover:shadow-sm transition-all group"
          >
            <div className="size-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white transition">
              <CalendarDays className="size-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground">الجدول الأسبوعي</div>
              <div className="text-[10px] text-muted-foreground">جدول المحاضرات والقاعات</div>
            </div>
          </Link>

          <Link
            to="/gpa"
            className="flex items-center gap-3 p-3.5 rounded-2xl border bg-card hover:border-primary/50 hover:shadow-sm transition-all group"
          >
            <div className="size-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground">محاكاة المعدل</div>
              <div className="text-[10px] text-muted-foreground">حساب المعدل التراكمي المتوقع</div>
            </div>
          </Link>

          <Link
            to="/assistant"
            className="flex items-center gap-3 p-3.5 rounded-2xl border bg-card hover:border-primary/50 hover:shadow-sm transition-all group"
          >
            <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground">المرشد الذكي AI</div>
              <div className="text-[10px] text-muted-foreground">استفسارات أكاديمية فورية</div>
            </div>
          </Link>
        </div>

        {/* Main Grid: Schedule & Nearest Exam vs Charts & Academic standing */}
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Left Column (7 cols): Today's Classes & Nearest Exam */}
          <div className="lg:col-span-7 space-y-6">
            {/* Nearest Exam Card */}
            {nextExam && (
              <div className="p-5 rounded-3xl border bg-gradient-to-r from-amber-500/10 via-card to-card shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold flex items-center gap-1">
                      <Sparkles className="size-3" />
                      أقرب امتحان قادم
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">
                      {nextExam.examType}
                    </span>
                  </div>
                  <Link to="/exams" className="text-xs font-bold text-primary flex items-center gap-0.5 hover:underline">
                    <span>جدول الامتحانات</span>
                    <ChevronLeft className="size-3.5" />
                  </Link>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-foreground">{nextExam.courseName}</h3>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{nextExam.courseCode}</p>
                  </div>
                  <div className="text-start sm:text-end text-xs space-y-0.5">
                    <div className="font-bold text-foreground font-mono flex items-center gap-1.5 justify-end">
                      <CalendarDays className="size-3.5 text-muted-foreground" />
                      {nextExam.dayName}، {nextExam.date}
                    </div>
                    <div className="text-muted-foreground font-mono flex items-center gap-1.5 justify-end">
                      <Clock className="size-3.5 text-muted-foreground" />
                      {nextExam.time} · قاعة {nextExam.room}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Today's Lectures */}
            <div className="rounded-3xl border bg-card p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b">
                <div className="flex items-center gap-2">
                  <Clock className="size-5 text-primary" />
                  <h2 className="text-base font-bold text-foreground">
                    محاضرات اليوم ({currentDayName})
                  </h2>
                </div>
                <Link to="/schedule" className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
                  <span>عرض الجدول الكامل</span>
                  <ChevronLeft className="size-3.5" />
                </Link>
              </div>

              {todayLectures.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <p>لا توجد محاضرات مقررة لليوم ({currentDayName}). استمتع بيومك الأكاديمي أو راجع خطتك الدراسية!</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {todayLectures.map((sec) => (
                    <div
                      key={sec.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl border bg-muted/30 hover:bg-muted/60 transition"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">{sec.courseName}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-mono font-bold">
                            شعبة {sec.sectionNumber}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">
                          المدرس: {sec.instructor} · القاعة: {sec.room}
                        </p>
                      </div>

                      <div className="text-start sm:text-end">
                        <div className="text-xs font-mono font-bold text-foreground dir-ltr">
                          {sec.startTime} - {sec.endTime}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {sec.credits} ساعات معتمدة
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* GPA Performance Chart */}
            <div className="rounded-3xl border bg-card p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b">
                <div>
                  <h2 className="text-base font-bold text-foreground">تطور المعدل الفصلي والتراكمي</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">مسار الأداء الأكاديمي عبر الفصول الدراسية</p>
                </div>
                <Link to="/grades" className="text-xs font-bold text-primary hover:underline">
                  كشف العلامات
                </Link>
              </div>

              <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={gpaTimeline}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[50, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val: any) => [`${Number(val).toFixed(1)}%`, '']}
                      contentStyle={{ borderRadius: 12, direction: 'rtl', fontSize: 12 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cumGpa"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      name="المعدل التراكمي"
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="termGpa"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      name="المعدل الفصلي"
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Plan Breakdown & Academic Deadlines */}
          <div className="lg:col-span-5 space-y-6">
            {/* Degree Plan Progress Categories */}
            <div className="rounded-3xl border bg-card p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b">
                <div>
                  <h2 className="text-base font-bold text-foreground">إنجاز الخطة الدراسية</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">توزيع الساعات المنجزة حسب فئات الخطة</p>
                </div>
                <Link to="/plan" className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
                  <span>الخطة كاملة</span>
                  <ChevronLeft className="size-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {categoryChartData.map((cat) => (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground truncate max-w-[200px]">{cat.name}</span>
                      <span className="text-muted-foreground font-mono">
                        {cat.done} / {cat.need} ساعة ({cat.pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-l from-primary to-cyan-500 transition-all duration-500"
                        style={{ width: `${cat.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Academic Calendar Dates */}
            <div className="rounded-3xl border bg-card p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b">
                <div className="flex items-center gap-2">
                  <CalendarClock className="size-5 text-primary" />
                  <h2 className="text-base font-bold text-foreground">مواعيد التقويم الأكاديمي</h2>
                </div>
                <Link to="/add-drop" className="text-xs font-bold text-primary hover:underline">
                  المزيد
                </Link>
              </div>

              <div className="space-y-2.5">
                {academicDates.slice(0, 4).map((d) => (
                  <div key={d.id} className="p-3 rounded-2xl border bg-muted/20 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-foreground">{d.title}</span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold",
                          d.status === 'مفتوح الآن'
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                        )}
                      >
                        {d.status}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-bold dir-ltr text-end">
                      {d.date}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-normal">{d.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function HeroFact({
  label,
  value,
  ltr,
  highlight,
}: {
  label: string;
  value: string;
  ltr?: boolean;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] text-slate-300 font-medium">{label}</dt>
      <dd
        className={cn(
          "font-bold truncate mt-0.5",
          highlight ? "text-cyan-300 font-extrabold" : "text-white",
          ltr && "font-mono",
        )}
        dir={ltr ? "ltr" : undefined}
      >
        {value}
      </dd>
    </div>
  );
}
