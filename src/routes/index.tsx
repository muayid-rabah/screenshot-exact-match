import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2, IdCard, Lock, User, ShieldCheck, Info, Sparkles, Building2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CompassArt, Logo } from "@/components/brand/CompassMark";
import { idToEmail, UNIVERSITY_ID_PATTERN } from "@/lib/academic";
import { setStoredActiveStudentId } from "@/lib/student-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | جامعة NextAura" },
      { name: "description", content: "ادخل إلى بوابة جامعة NextAura الرقمية بالرقم الجامعي وكلمة المرور." },
      { property: "og:title", content: "بوابة جامعة NextAura الذكية" },
      { property: "og:description", content: "بوابتك الأكاديمية الذكية المتكاملة — مسارك نحو المستقبل يبدأ من هنا." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

type Mode = "signin" | "signup";
type Errs = { uid?: string; password?: string; name?: string };

const DEMO_STUDENTS = [
  { id: "202310001", name: "أحمد محمود الخطيب", major: "الذكاء الاصطناعي", badge: "مستوى متقدم", badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" },
  { id: "202410002", name: "ليان أحمد الحسن", major: "الذكاء الاصطناعي", badge: "منتصف الدراسة", badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300" },
  { id: "202410003", name: "عمر خالد الزعبي", major: "الذكاء الاصطناعي", badge: "إنذار ومراجعة", badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300" },
  { id: "20230015", name: "نور المصري", major: "علم الحاسوب", badge: "امتياز وشرف", badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300" },
  { id: "202610005", name: "يوسف الرواشدة", major: "الذكاء الاصطناعي", badge: "مستجد (فصل 1)", badgeColor: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300" },
  { id: "20210001", name: "يوسف الخالدي", major: "هندسة البرمجيات", badge: "خريج", badgeColor: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
] as const;

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [uid, setUid] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errs>({});
  const [forgotOpen, setForgotOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  function validate() {
    const e: Errs = {};
    if (!UNIVERSITY_ID_PATTERN.test(uid.trim())) e.uid = "الرقم الجامعي يتكون من 8 إلى 10 أرقام.";
    if (password.length < 6) e.password = "كلمة المرور يجب ألا تقل عن 6 أحرف.";
    if (mode === "signup" && name.trim().split(/\s+/).length < 2) e.name = "أدخل الاسم الثنائي على الأقل.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const emailNextaura = `${uid.trim().toLowerCase()}@students.nextaura.edu`;
    const emailLegacy = `${uid.trim().toLowerCase()}@students.morshidi.edu`;

    try {
      if (mode === "signin") {
        // Try NextAura domain first, fallback to legacy if account exists there
        let { error } = await supabase.auth.signInWithPassword({ email: emailNextaura, password });
        if (error) {
          const fallback = await supabase.auth.signInWithPassword({ email: emailLegacy, password });
          if (!fallback.error) {
            error = null;
          }
        }
        if (error) {
          // If demo user password is used, offer quick auto-signup for demo users
          if (password === "NextAura@2026" || password === "Morshidi@2026") {
            const demoMatch = DEMO_STUDENTS.find((s) => s.id === uid.trim());
            const fallbackName = demoMatch?.name || "طالب جامعة NextAura";
            const up = await supabase.auth.signUp({
              email: emailNextaura,
              password,
              options: {
                data: { university_id: uid.trim(), full_name: fallbackName },
              },
            });
            if (up.error && !up.error.message.includes("registered")) {
              throw new Error("الرقم الجامعي أو كلمة المرور غير صحيحة.");
            }
          } else {
            throw new Error("الرقم الجامعي أو كلمة المرور غير صحيحة.");
          }
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: emailNextaura,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { university_id: uid.trim(), full_name: name.trim() },
          },
        });
        if (error && !error.message.includes("already registered")) {
          throw new Error(error.message);
        }
        toast.success("تم تفعيل حسابك الجامعي في جامعة NextAura بنجاح.");
      }

      setStoredActiveStudentId(uid.trim());
      navigate({ to: "/dashboard", replace: true });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function pickDemoStudent(s: (typeof DEMO_STUDENTS)[number]) {
    setMode("signin");
    setUid(s.id);
    setName(s.name);
    setPassword("NextAura@2026");
    setErrors({});
    toast.info(`تم اختيار حساب الطالب: ${s.name} (${s.badge})`);
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="flex flex-col justify-between px-6 py-8 sm:px-12 lg:px-16 overflow-y-auto">
        <Logo />
        <div className="mx-auto w-full max-w-md animate-rise py-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 text-xs font-bold border border-cyan-200 dark:border-cyan-800">
              <Sparkles className="size-3.5" />
              البوابة الإلكترونية الموحدة
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {mode === "signin" ? "تسجيل الدخول إلى البوابة" : "تفعيل حساب طالب جديد"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {mode === "signin"
              ? "أدخل الرقم الجامعي وكلمة المرور للوصول إلى خدمات التسجيل، الخطة، العلامات، والجدول الدراسي."
              : "أنشئ حسابك الأكاديمي في نظام جامعة NextAura للاطلاع على خدمات الطالب الإلكترونية."}
          </p>

          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
            {mode === "signup" && (
              <Field id="name" label="الاسم الكامل" icon={User} error={errors.name}>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className="h-11 ps-10"
                  placeholder="مثال: أحمد محمود الخطيب"
                />
              </Field>
            )}

            <Field id="uid" label="الرقم الجامعي" icon={IdCard} error={errors.uid}>
              <Input
                id="uid"
                inputMode="numeric"
                value={uid}
                onChange={(e) => setUid(e.target.value.replace(/\D/g, ""))}
                autoComplete="username"
                className="h-11 ps-10 tabular tracking-widest font-mono"
                placeholder="202310001"
                maxLength={10}
              />
            </Field>

            <Field
              id="password"
              label="كلمة المرور"
              icon={Lock}
              error={errors.password}
              action={
                mode === "signin" ? (
                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    نسيت كلمة المرور؟
                  </button>
                ) : undefined
              }
            >
              <Input
                id="password"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                className="h-11 ps-10 pe-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                className="absolute inset-y-0 end-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </Field>

            <Button type="submit" size="lg" className="h-11 w-full text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all" disabled={loading}>
              {loading && <Loader2 className="animate-spin ms-2" />}
              {mode === "signin" ? "تسجيل الدخول" : "تفعيل الحساب الجامعي"}
            </Button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span className="font-semibold flex items-center gap-1.5">
                <Building2 className="size-3.5 text-primary" />
                حسابات تجريبية سريعة بنقرة واحدة:
              </span>
              <button
                type="button"
                className="font-bold text-primary underline underline-offset-2"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setErrors({});
                }}
              >
                {mode === "signin" ? "تفعيل حساب جديد" : "العودة لتسجيل الدخول"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 rounded-xl border bg-card/60">
              {DEMO_STUDENTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => pickDemoStudent(s)}
                  className="flex items-center gap-2 rounded-lg border p-2.5 text-start text-xs transition-all hover:bg-accent/60 hover:border-primary/50 group bg-background"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary font-mono" dir="ltr">
                    {s.id.slice(-3)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold block truncate group-hover:text-primary transition-colors">
                      {s.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate block">{s.major}</span>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${s.badgeColor}`}>
                    {s.badge}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground text-center">
              كلمة المرور الافتراضية للحسابات: <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground font-bold" dir="ltr">NextAura@2026</code>
            </p>
          </div>
        </div>

        <p className="flex items-center gap-2 text-xs text-muted-foreground pt-4 border-t">
          <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
          اتصال مشفّر وآمن بموجب معايير الأمان الأكاديمية · © 2026 جامعة NextAura
        </p>
      </section>

      {/* Visual Side Banner */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#070b19] via-[#0f172a] to-[#1e1b4b] text-white lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div className="flex items-center justify-between text-xs font-mono tracking-[0.25em] text-cyan-400">
          <span>NEXTAURA INTELLIGENT DIGITAL CAMPUS</span>
          <span className="px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-[10px] text-cyan-300">
            v2.6 LIVE
          </span>
        </div>
        <CompassArt className="mx-auto max-w-sm" />
        <div className="space-y-3">
          <div className="inline-block px-3 py-1 rounded-lg bg-white/10 backdrop-blur text-xs font-bold text-cyan-300 border border-white/10">
            بوابة الطالب الإلكترونية الذكية
          </div>
          <h2 className="text-4xl font-extrabold leading-tight text-white">
            مستقبلك الأكاديمي يبدأ من هنا.
          </h2>
          <p className="max-w-md text-sm text-slate-300 leading-relaxed">
            منظومة جامعية ذكية متكاملة تجمع التسجيل الإلكتروني، الخطة التفاعلية، الجدول الأسبوعي، ومتابعة التحصيل الأكاديمي في تجربة موحدة.
          </p>
        </div>
      </aside>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>استعادة وتعيين كلمة المرور</DialogTitle>
            <DialogDescription className="leading-relaxed pt-2">
              لأسباب الأمان الأكاديمي وحماية بيانات السجل، تتم إعادة تعيين كلمة المرور رسمياً عبر دائرة القبول والتسجيل أو عبر مرشدك الأكاديمي في كلية تكنولوجيا المعلومات.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Field({
  id,
  label,
  icon: Icon,
  error,
  action,
  children,
}: {
  id: string;
  label: string;
  icon: typeof User;
  error?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-xs font-bold">
          {label}
        </Label>
        {action}
      </div>
      <div className="relative">
        <Icon className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
        {children}
      </div>
      {error && <p role="alert" className="text-xs text-destructive font-medium">{error}</p>}
    </div>
  );
}
