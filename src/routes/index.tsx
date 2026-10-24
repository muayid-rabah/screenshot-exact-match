import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2, IdCard, Lock, User, ShieldCheck, Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CompassArt, Logo } from "@/components/brand/CompassMark";
import { idToEmail, UNIVERSITY_ID_PATTERN } from "@/lib/academic";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | جامعة مرشدي" },
      { name: "description", content: "ادخل إلى بوابة جامعة مرشدي الرقمية بالرقم الجامعي وكلمة المرور." },
      { property: "og:title", content: "بوابة جامعة مرشدي" },
      { property: "og:description", content: "مسارك يبدأ من هنا — منصة جامعية رقمية متكاملة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

type Mode = "signin" | "signup";
type Errs = { uid?: string | undefined; password?: string | undefined; name?: string | undefined };

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
    if (password.length < 8) e.password = "كلمة المرور يجب ألا تقل عن 8 أحرف.";
    if (mode === "signup" && name.trim().split(/\s+/).length < 2) e.name = "أدخل الاسم الثنائي على الأقل.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const email = idToEmail(uid);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error("الرقم الجامعي أو كلمة المرور غير صحيحة.");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin, data: { university_id: uid.trim(), full_name: name.trim() } },
        });
        if (error) throw new Error(error.message.includes("registered") ? "هذا الرقم الجامعي مفعّل مسبقاً." : error.message);
        if (!data.session) throw new Error("تعذر تفعيل الحساب، حاول مرة أخرى.");
        toast.success("تم تفعيل حسابك التجريبي");
      }
      navigate({ to: "/dashboard", replace: true });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <section className="flex flex-col justify-between px-6 py-8 sm:px-12 lg:px-16">
        <Logo />
        <div className="mx-auto w-full max-w-sm animate-rise py-10">
          <h1 className="text-3xl font-extrabold">{mode === "signin" ? "أهلاً بعودتك" : "تفعيل حساب طالب"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin" ? "سجّل دخولك إلى بوابتك الجامعية لمتابعة مسارك الأكاديمي." : "أنشئ حساباً في البيئة التجريبية للاطلاع على تجربة الطالب."}
          </p>

          <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
            {mode === "signup" && (
              <Field id="name" label="الاسم الكامل" icon={User} error={errors.name}>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="h-11 ps-10" placeholder="مثال: أحمد خالد" />
              </Field>
            )}
            <Field id="uid" label="الرقم الجامعي" icon={IdCard} error={errors.uid}>
              <Input id="uid" inputMode="numeric" value={uid} onChange={(e) => setUid(e.target.value.replace(/\D/g, ""))}
                autoComplete="username" className="h-11 ps-10 tabular tracking-widest" placeholder="20231234" maxLength={10} />
            </Field>
            <Field id="password" label="كلمة المرور" icon={Lock} error={errors.password}
              action={mode === "signin" ? <button type="button" onClick={() => setForgotOpen(true)} className="text-xs font-medium text-primary hover:underline">نسيت كلمة المرور؟</button> : undefined}>
              <Input id="password" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signin" ? "current-password" : "new-password"} className="h-11 ps-10 pe-10" />
              <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                className="absolute inset-y-0 end-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground">
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </Field>
            <Button type="submit" size="lg" className="h-11 w-full text-base" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              {mode === "signin" ? "تسجيل الدخول" : "تفعيل الحساب"}
            </Button>
          </form>

          <div className="mt-6 flex items-start gap-2 rounded-lg border border-gold/40 bg-accent/60 p-3 text-xs text-accent-foreground">
            <Info className="mt-0.5 size-4 shrink-0" />
            <p>
              بيئة تجريبية: الحسابات الجديدة تُزوَّد ببيانات أكاديمية نموذجية.{" "}
              <button type="button" className="font-semibold underline underline-offset-2" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErrors({}); }}>
                {mode === "signin" ? "فعّل حساباً تجريبياً" : "لديّ حساب، تسجيل الدخول"}
              </button>
            </p>
          </div>
        </div>
        <p className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-primary" /> اتصال آمن ومشفّر · © 2026 جامعة مرشدي</p>
      </section>

      <aside className="relative hidden overflow-hidden bg-ink-gradient text-ink-foreground lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div className="text-xs tracking-[0.3em] text-gold">INTELLIGENT DIGITAL CAMPUS</div>
        <CompassArt className="mx-auto max-w-md" />
        <div>
          <h2 className="text-4xl font-extrabold leading-tight">مسارك يبدأ من هنا.</h2>
          <p className="mt-3 max-w-md text-sm text-ink-foreground/70">التسجيل، الجدول، الخطة الدراسية، والمعدلات — في تجربة جامعية واحدة موحّدة.</p>
        </div>
      </aside>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>استعادة كلمة المرور</DialogTitle>
            <DialogDescription>
              لأسباب أمنية تتم إعادة تعيين كلمة المرور عبر دائرة القبول والتسجيل بعد التحقق من هويتك. راجع مكتب التسجيل مع البطاقة الجامعية أو تواصل مع مرشدك الأكاديمي.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Field({ id, label, icon: Icon, error, action, children }: {
  id: string; label: string; icon: typeof User; error?: string | undefined; action?: React.ReactNode | undefined; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {action}
      </div>
      <div className="relative">
        <Icon className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
        {children}
      </div>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
