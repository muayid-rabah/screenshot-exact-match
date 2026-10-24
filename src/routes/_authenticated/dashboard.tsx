import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  Clock, MapPin, CalendarClock, BookOpenCheck, CalendarDays, Calculator, Sparkles, Map, Receipt,
  AlertTriangle, CheckCircle2, TrendingUp, Layers, UserRound, GraduationCap,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardQuery } from "@/lib/student-queries";
import { academicStanding, computeGPA, hoursSummary, lastTermGPA, nextUpcoming, sessionsForDay, type CourseRecord } from "@/lib/academic";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "لوحة الطالب | جامعة مرشدي" },
      { name: "description", content: "نظرة شاملة على وضعك الأكاديمي في جامعة مرشدي." },
      { property: "og:title", content: "لوحة الطالب — جامعة مرشدي" },
      { property: "og:description", content: "الساعات، المعدلات، محاضرات اليوم، والامتحانات القادمة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(dashboardQuery),
  pendingComponent: DashboardSkeleton,
  component: Dashboard,
});

const fmtDate = (d: string | Date, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("ar-JO-u-nu-latn", opts).format(new Date(d));
const fmtTime = (t: string) => t.slice(0, 5);
const DAY_MS = 86_400_000;

function Dashboard() {
  const { data } = useSuspenseQuery(dashboardQuery);
  const { profile, records, terms, exams, deadlines, notifications } = data;
  const now = new Date();
  const currentTerm = terms.find((t) => t.is_current);

  const flat: (CourseRecord & { code: string; name: string; absences: number; sessions: any[] })[] = useMemo(
    () => records.map((r: any) => ({
      credits: r.course.credits, status: r.status, grade_points: r.grade_points, term_code: r.term_code,
      category: r.course.category, code: r.course.code, name: r.course.name, absences: r.absences, sessions: r.course.course_sessions,
    })),
    [records],
  );

  const gpa = computeGPA(flat);
  const termGpa = lastTermGPA(flat);
  const hours = hoursSummary(flat, profile.required_hours);
  const current = flat.filter((r) => r.status === "current");
  const absences = current.reduce((s, r) => s + r.absences, 0);
  const alerts = notifications.filter((n) => n.level === "warning" || n.level === "danger");
  const unread = notifications.filter((n) => !n.is_read).length;

  const currentCodes = new Set(current.map((c) => c.code));
  const todaySessions = sessionsForDay(current.flatMap((c) => c.sessions.map((s) => ({ ...s, code: c.code, name: c.name }))), now);
  const nextExam = nextUpcoming(exams.filter((e: any) => currentCodes.has(e.course.code)), (e) => e.starts_at, now);
  const upcomingDeadlines = deadlines.filter((d) => new Date(d.due_at) > now).slice(0, 4);

  const categoryProgress = useMemo(() => {
    const req: Record<string, number> = { "متطلبات جامعة": 27, "متطلبات كلية": 21, "متطلبات تخصص إجبارية": 66, "متطلبات تخصص اختيارية": 18 };
    return Object.entries(req).map(([cat, need]) => {
      const done = flat.filter((r) => r.category === cat && r.status === "completed").reduce((s, r) => s + r.credits, 0);
      return { cat, need, done, pct: Math.min(Math.round((done / need) * 100), 100) };
    });
  }, [flat]);

  const timeline = useMemo(() => {
    const done = terms.filter((t) => flat.some((r) => r.term_code === t.code && r.status === "completed"));
    let cumHours = 0;
    return done.map((t) => {
      const upto = flat.filter((r) => r.status === "completed" && r.term_code <= t.code);
      cumHours = upto.reduce((s, r) => s + r.credits, 0);
      return { term: t.name.replace("الفصل ", "").replace(/ (\d{4})\/(\d{4})/, " $1"), gpa: computeGPA(upto), termGpa: computeGPA(flat.filter((r) => r.term_code === t.code)), hours: cumHours };
    });
  }, [terms, flat]);

  const firstName = profile.full_name.split(" ")[0];

  return (
    <AppShell name={profile.full_name} uid={profile.university_id} unread={unread}>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl bg-hero-gradient p-6 text-primary-foreground shadow-elevated animate-rise sm:p-8">
          <div aria-hidden className="absolute -start-20 -top-24 size-72 rounded-full border border-gold/30" />
          <div aria-hidden className="absolute -start-6 -top-10 size-44 rounded-full border border-gold/20" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm text-primary-foreground/70">{currentTerm?.name}</p>
              <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">أهلاً بك، {firstName}</h1>
              <p className="mt-2 text-primary-foreground/80">{profile.major} · {profile.college}</p>
            </div>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-4">
              <HeroFact label="الحالة الأكاديمية" value={profile.academic_status} />
              <HeroFact label="المرشد الأكاديمي" value={profile.advisor_name} />
              <HeroFact label="رقم الخطة" value={profile.plan_no} ltr />
              <HeroFact label="آخر تحديث" value={fmtDate(data.fetchedAt, { hour: "2-digit", minute: "2-digit" })} />
            </dl>
          </div>
        </section>

        {/* Metrics */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="المؤشرات الأكاديمية">
          <Metric icon={TrendingUp} label="المعدل التراكمي" value={gpa.toFixed(2)} hint={academicStanding(gpa)} accent />
          <Metric icon={GraduationCap} label="المعدل الفصلي (آخر فصل)" value={termGpa.toFixed(2)} hint="من 4.00" />
          <Metric icon={Layers} label="الساعات المنجزة" value={`${hours.completed}`} hint={`متبقٍ ${hours.remaining} من ${profile.required_hours}`} />
          <Metric icon={BookOpenCheck} label="المسجلة حالياً" value={`${hours.current}`} hint={`${current.length} مواد`} />
          <Metric icon={CheckCircle2} label="الإنجاز نحو التخرج" value={`${hours.progress}%`} hint="من إجمالي الخطة" />
          <Metric icon={UserRound} label="الغيابات" value={`${absences}`} hint="هذا الفصل" tone={absences >= 3 ? "warning" : undefined} />
          <Metric icon={AlertTriangle} label="التنبيهات الأكاديمية" value={`${alerts.length}`} hint="تحتاج متابعة" tone={alerts.length ? "warning" : undefined} />
          <Metric icon={CalendarClock} label="أقرب امتحان" value={nextExam ? `${Math.ceil((new Date(nextExam.starts_at).getTime() - now.getTime()) / DAY_MS)} يوم` : "—"} hint={nextExam ? (nextExam as any).course.name : "لا امتحانات قادمة"} />
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Today */}
          <Card title="محاضرات اليوم" subtitle={fmtDate(now, { weekday: "long", day: "numeric", month: "long" })} className="lg:col-span-2">
            {todaySessions.length === 0 ? (
              <Empty icon={CalendarDays} text="لا توجد محاضرات اليوم. استغل الوقت للمراجعة." />
            ) : (
              <ol className="space-y-3">
                {todaySessions.map((s: any) => {
                  const [sh, sm] = s.start_time.split(":").map(Number);
                  const [eh, em] = s.end_time.split(":").map(Number);
                  const mins = now.getHours() * 60 + now.getMinutes();
                  const state = mins >= eh * 60 + em ? "done" : mins >= sh * 60 + sm ? "live" : "next";
                  return (
                    <li key={s.id} className={cn("flex items-center gap-4 rounded-xl border p-4", state === "live" && "border-primary bg-secondary", state === "done" && "opacity-55")}>
                      <div className="w-16 text-center tabular" dir="ltr"><div className="font-bold">{fmtTime(s.start_time)}</div><div className="text-xs text-muted-foreground">{fmtTime(s.end_time)}</div></div>
                      <div className="h-10 w-px bg-border" />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold">{s.name} <span className="text-xs text-muted-foreground" dir="ltr">{s.code}</span></div>
                        <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-muted-foreground"><span className="flex items-center gap-1"><MapPin className="size-3" />{s.room}</span><span>{s.instructor}</span></div>
                      </div>
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", state === "live" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                        {state === "live" ? "جارية الآن" : state === "done" ? "انتهت" : "قادمة"}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>

          {/* Next exam */}
          <Card title="أقرب امتحان">
            {nextExam ? (
              <div className="rounded-xl bg-ink-gradient p-5 text-ink-foreground">
                <div className="text-xs text-gold">{(nextExam as any).kind}</div>
                <div className="mt-1 text-xl font-bold">{(nextExam as any).course.name}</div>
                <div className="mt-4 space-y-2 text-sm text-ink-foreground/80">
                  <div className="flex items-center gap-2"><CalendarClock className="size-4 text-gold" />{fmtDate(nextExam.starts_at, { weekday: "long", day: "numeric", month: "long" })}</div>
                  <div className="flex items-center gap-2"><Clock className="size-4 text-gold" />{fmtDate(nextExam.starts_at, { hour: "2-digit", minute: "2-digit" })}</div>
                  <div className="flex items-center gap-2"><MapPin className="size-4 text-gold" />{(nextExam as any).room}</div>
                </div>
              </div>
            ) : <Empty icon={CalendarClock} text="لا توجد امتحانات قادمة." />}
          </Card>

          {/* Graduation progress */}
          <Card title="التقدم نحو التخرج" subtitle="حسب مجموعات المتطلبات">
            <div className="relative mx-auto h-44 w-44">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={[{ v: hours.completed }, { v: hours.remaining }]} dataKey="v" innerRadius="74%" outerRadius="100%" startAngle={90} endAngle={-270} stroke="none">
                    <Cell fill="var(--color-primary)" /><Cell fill="var(--color-muted)" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-3xl font-extrabold tabular">{hours.progress}%</span><span className="text-xs text-muted-foreground">{hours.completed}/{profile.required_hours} ساعة</span></div>
            </div>
            <ul className="mt-5 space-y-3">
              {categoryProgress.map((c) => (
                <li key={c.cat}>
                  <div className="mb-1 flex justify-between text-xs"><span>{c.cat}</span><span className="tabular text-muted-foreground">{c.done}/{c.need}</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gold" style={{ width: `${c.pct}%` }} /></div>
                </li>
              ))}
            </ul>
          </Card>

          {/* Timeline */}
          <Card title="الخط الزمني الأكاديمي" subtitle="تطور المعدل التراكمي منذ الالتحاق" className="lg:col-span-2">
            {timeline.length === 0 ? <Empty icon={TrendingUp} text="لا توجد فصول مكتملة بعد." /> : (
              <div className="h-64" dir="ltr">
                <ResponsiveContainer>
                  <LineChart data={timeline} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
                    <CartesianGrid stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="term" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} reversed />
                    <YAxis domain={[2, 4]} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} orientation="right" />
                    <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, direction: "rtl" }}
                      formatter={(v: number, k: string) => [v.toFixed(2), k === "gpa" ? "التراكمي" : "الفصلي"]} />
                    <Line type="monotone" dataKey="termGpa" stroke="var(--color-gold)" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="gpa" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Quick actions */}
          <Card title="إجراءات سريعة">
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: BookOpenCheck, label: "تسجيل المواد" }, { icon: CalendarDays, label: "عرض الجدول" },
                { icon: Calculator, label: "المعدل المتوقع" }, { icon: Sparkles, label: "مرشدي الذكي" },
                { icon: Map, label: "عرض الخطة" }, { icon: Receipt, label: "كشف الحساب" },
              ].map((a) => (
                <button key={a.label} onClick={() => toast.info(`${a.label}: هذه الخدمة قيد الإنشاء في المرحلة القادمة.`)}
                  className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <a.icon className="size-5 text-primary" />{a.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Deadlines */}
          <Card title="المواعيد القادمة" className="lg:col-span-2">
            {upcomingDeadlines.length === 0 ? <Empty icon={CalendarClock} text="لا مواعيد قادمة." /> : (
              <ul className="divide-y">
                {upcomingDeadlines.map((d) => {
                  const days = Math.ceil((new Date(d.due_at).getTime() - now.getTime()) / DAY_MS);
                  return (
                    <li key={d.id} className="flex items-center gap-4 py-3">
                      <div className="flex size-12 flex-col items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                        <span className="text-lg font-bold leading-none tabular">{fmtDate(d.due_at, { day: "numeric" })}</span>
                        <span className="text-[10px]">{fmtDate(d.due_at, { month: "short" })}</span>
                      </div>
                      <div className="flex-1 font-medium">{d.title}</div>
                      <span className={cn("rounded-full px-2.5 py-1 text-xs", days <= 14 ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground")}>بعد {days} يوم</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Alerts */}
          <Card title="التنبيهات">
            {notifications.length === 0 ? <Empty icon={CheckCircle2} text="لا توجد تنبيهات." /> : (
              <ul className="space-y-3">
                {notifications.map((n) => (
                  <li key={n.id} className={cn("rounded-lg border-s-4 bg-muted/50 p-3", n.level === "warning" ? "border-warning" : n.level === "success" ? "border-success" : "border-info")}>
                    <div className="text-sm font-semibold">{n.title}</div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function HeroFact({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return <div><dt className="text-xs text-primary-foreground/60">{label}</dt><dd className="mt-0.5 font-semibold" dir={ltr ? "ltr" : undefined}>{value}</dd></div>;
}

function Metric({ icon: Icon, label, value, hint, accent, tone }: { icon: typeof Clock; label: string; value: string; hint: string; accent?: boolean; tone?: "warning" }) {
  return (
    <div className={cn("rounded-xl border bg-card p-4 shadow-card animate-rise sm:p-5", accent && "border-gold/60")}>
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs font-medium">{label}</span>
        <Icon className={cn("size-4", accent ? "text-gold" : tone === "warning" ? "text-warning" : "text-primary")} />
      </div>
      <div className="mt-3 text-2xl font-extrabold tabular sm:text-3xl">{value}</div>
      <div className="mt-1 truncate text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

function Card({ title, subtitle, className, children }: { title: string; subtitle?: string; className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("rounded-2xl border bg-card p-5 shadow-card sm:p-6", className)}>
      <header className="mb-4"><h2 className="text-lg font-bold">{title}</h2>{subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}</header>
      {children}
    </section>
  );
}

function Empty({ icon: Icon, text }: { icon: typeof Clock; text: string }) {
  return <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground"><Icon className="size-8 opacity-40" />{text}</div>;
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-8">
      <Skeleton className="h-44 rounded-2xl" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      <div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-72 rounded-2xl lg:col-span-2" /><Skeleton className="h-72 rounded-2xl" /></div>
    </div>
  );
}
