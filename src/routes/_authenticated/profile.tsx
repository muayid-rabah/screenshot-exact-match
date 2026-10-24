import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  IdCard,
  User,
  GraduationCap,
  Building2,
  Calendar,
  Award,
  QrCode,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  Contact,
  HeartPulse,
  Printer,
  Edit3,
  Save,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { useStudentStore, saveStudentState } from "@/lib/student-store";
import { NextAuraMark } from "@/components/brand/NextAuraBrand";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "معلومات الطالب والملف الأكاديمي | جامعة NextAura" },
      { name: "description", content: "البيانات الأكاديمية والبطاقة الجامعية الرسمية في جامعة NextAura." },
    ],
  }),
  component: ProfilePage,
});

export function ProfilePage() {
  const { activeStudent } = useStudentStore();
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(activeStudent.phone || "+962 7 9123 4567");
  const [email, setEmail] = useState(
    activeStudent.email || `${activeStudent.universityId}@students.nextaura.edu`,
  );

  const officialFields = [
    { label: "الاسم الكامل", value: activeStudent.name, icon: User },
    { label: "الرقم الجامعي", value: activeStudent.universityId, icon: IdCard, mono: true },
    { label: "الكلية", value: activeStudent.faculty, icon: Building2 },
    { label: "التخصص الأكاديمي", value: activeStudent.major, icon: BookOpen },
    { label: "الدرجة العلمية", value: activeStudent.degree, icon: GraduationCap },
    { label: "نوع الدراسة", value: activeStudent.studyType, icon: Calendar },
    { label: "سنة القبول", value: String(activeStudent.admissionYear), icon: Calendar, mono: true },
    { label: "الخطة الدراسية", value: `${activeStudent.studyPlan} — 132 ساعة معتمدة`, icon: Award },
    { label: "الحالة الأكاديمية", value: activeStudent.academicStatus, icon: HeartPulse },
    { label: "المرشد الأكاديمي", value: activeStudent.academicAdvisor, icon: Contact },
    { label: "البريد الجامعي الرسمي", value: `${activeStudent.universityId}@students.nextaura.edu`, icon: Mail, mono: true },
    { label: "هاتف التواصل المعتمد", value: phone, icon: Phone, mono: true },
  ];

  function handleSaveContact() {
    activeStudent.phone = phone;
    activeStudent.email = email;
    saveStudentState(activeStudent);
    setIsEditing(false);
    toast.success("تم تحديث بيانات الاتصال بنجاح في ملفك الجامعي.");
  }

  return (
    <AppShell name={activeStudent.name} uid={activeStudent.universityId}>
      <div className="mx-auto max-w-7xl space-y-6 text-right animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-foreground">
              <IdCard className="size-7 text-primary" />
              <span>معلومات الطالب والملف الأكاديمي</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              البيانات الرسمية المعتمدة المقيدة في عمادة القبول والتسجيل بجامعة NextAura
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => window.print()}
              className="p-2.5 rounded-xl border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition shadow-xs"
              title="طباعة البطاقة والملف الأكاديمي"
            >
              <Printer className="size-4" />
            </button>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold border border-emerald-200">
              <ShieldCheck className="size-4 text-emerald-600" />
              <span>ملف جامعي معتمد وموثق</span>
            </div>
          </div>
        </div>

        {/* Top Grid: Student Digital ID Card vs Official Record Table */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Official Student Digital Card (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative overflow-hidden rounded-3xl bg-card border-2 border-primary/30 text-card-foreground shadow-xl">
              {/* University Header Crest Bar */}
              <div className="bg-gradient-to-r from-[#0b132b] via-[#1c2541] to-[#1e1b4b] text-white p-5 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <NextAuraMark className="size-10 shrink-0 drop-shadow" />
                  <div>
                    <h3 className="text-sm font-extrabold tracking-tight">جامعة NextAura</h3>
                    <p className="text-[10px] text-cyan-400 tracking-wider font-bold">
                      NEXTAURA UNIVERSITY
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/20">
                  بطاقة طالب رقمية
                </span>
              </div>

              {/* Student Identity Body */}
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="size-20 rounded-2xl bg-gradient-to-br from-primary to-cyan-600 text-white flex items-center justify-center text-3xl font-black shadow-md shrink-0">
                    {activeStudent.name.charAt(0)}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h4 className="text-base font-extrabold text-foreground truncate">
                      {activeStudent.name}
                    </h4>
                    <div className="text-xs font-mono font-bold text-primary tracking-wider" dir="ltr">
                      {activeStudent.universityId}
                    </div>
                    <p className="text-xs text-muted-foreground font-semibold truncate">
                      {activeStudent.major}
                    </p>
                    <p className="text-[11px] text-muted-foreground/80 truncate">
                      {activeStudent.faculty}
                    </p>
                  </div>
                </div>

                {/* Key Status badges */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-muted/40 border">
                    <span className="text-[10px] text-muted-foreground block">الدرجة</span>
                    <span className="font-bold text-foreground">{activeStudent.degree}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/40 border">
                    <span className="text-[10px] text-muted-foreground block">سنة القبول</span>
                    <span className="font-bold text-foreground font-mono">{activeStudent.admissionYear}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/40 border">
                    <span className="text-[10px] text-muted-foreground block">نوع الدراسة</span>
                    <span className="font-bold text-foreground">{activeStudent.studyType}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/40 border">
                    <span className="text-[10px] text-muted-foreground block">الحالة الأكاديمية</span>
                    <span className="font-bold text-emerald-600 truncate block">
                      {activeStudent.academicStatus}
                    </span>
                  </div>
                </div>

                {/* Card Hologram Footer */}
                <div className="pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                  <div className="space-y-0.5">
                    <span className="block text-[10px] uppercase font-mono">العام الجامعي 2026/2027</span>
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="size-3" />
                      مفعل ومسدد للفصل الأول
                    </span>
                  </div>

                  <div className="size-12 rounded-xl border bg-white p-1.5 flex items-center justify-center text-slate-800 shadow-2xs">
                    <QrCode className="size-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Editable Contact Info Card */}
            <div className="p-5 rounded-3xl border bg-card shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Phone className="size-4 text-primary" />
                  <span>معلومات الاتصال المحدثة</span>
                </h3>
                <button
                  onClick={() => (isEditing ? handleSaveContact() : setIsEditing(true))}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  {isEditing ? (
                    <>
                      <Save className="size-3.5" />
                      <span>حفظ التعديلات</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="size-3.5" />
                      <span>تعديل</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">
                    رقم الهاتف المحمول:
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-9 w-full rounded-xl border bg-background px-3 text-xs font-mono outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  ) : (
                    <div className="font-mono font-bold text-foreground">{phone}</div>
                  )}
                </div>

                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">
                    البريد الإلكتروني المعتمد:
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-9 w-full rounded-xl border bg-background px-3 text-xs font-mono outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  ) : (
                    <div className="font-mono font-bold text-foreground truncate">{email}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Official Registry Fields Table (7 cols) */}
          <div className="lg:col-span-7 rounded-3xl border bg-card p-6 shadow-sm space-y-4">
            <div className="pb-3 border-b flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground">بيانات القيد والتسجيل الرسمية</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  السجل الرسمي الموثق في قاعدة بيانات جامعة NextAura
                </p>
              </div>
            </div>

            <div className="divide-y divide-border">
              {officialFields.map((field) => {
                const Icon = field.icon;
                return (
                  <div key={field.label} className="py-3 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-muted-foreground font-semibold">
                      <Icon className="size-4 text-primary shrink-0" />
                      <span>{field.label}</span>
                    </span>
                    <span
                      className={cn(
                        "font-bold text-foreground text-start sm:text-end truncate max-w-[240px]",
                        field.mono && "font-mono",
                      )}
                      dir={field.mono ? "ltr" : undefined}
                    >
                      {field.value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
