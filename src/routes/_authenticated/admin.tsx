import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Shield,
  Users,
  Layers,
  Award,
  Megaphone,
  Search,
  Edit,
  Save,
  CheckCircle2,
  Plus,
  ArrowRightLeft,
  BookOpenCheck,
  Building2,
  Lock,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { useStudentStore, saveStudentState } from "@/lib/student-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { NoticeMessage } from "@/types/student";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "إدارة النظام الأكاديمي | جامعة NextAura" },
      { name: "description", content: "لوحة تحكم إدارة الطلاب والشعب والخطط والعلامات في جامعة NextAura." },
    ],
  }),
  component: AdminManagementPage,
});

type AdminTab = "students" | "sections" | "grades" | "announcements";

export function AdminManagementPage() {
  const {
    activeStudent,
    studentsDirectory,
    offeredSections,
    courses,
    selectStudentById,
    updateGrade,
    updateSectionCapacity,
    postAnnouncement,
  } = useStudentStore();

  const [activeTab, setActiveTab] = useState<AdminTab>("students");
  const [studentSearch, setStudentSearch] = useState("");
  const [sectionSearch, setSectionSearch] = useState("");

  // Grade Entry state
  const [selectedStudentForGrade, setSelectedStudentForGrade] = useState(
    activeStudent.universityId,
  );
  const [gradeCourseCode, setGradeCourseCode] = useState("0200104");
  const [numericGrade, setNumericGrade] = useState<number>(85);
  const [letterGrade, setLetterGrade] = useState("A-");

  // Announcement state
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");
  const [notifCat, setNotifCat] = useState<NoticeMessage["category"]>("التسجيل");
  const [notifTone, setNotifTone] = useState<NoticeMessage["tone"]>("important");

  // Section Capacity editing
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [newCapacity, setNewCapacity] = useState<number>(45);

  const filteredStudents = studentsDirectory.filter((s) => {
    const q = studentSearch.trim().toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || s.universityId.includes(q) || s.major.includes(q);
  });

  const filteredSections = offeredSections.filter((s) => {
    const q = sectionSearch.trim().toLowerCase();
    return (
      !q ||
      s.courseName.toLowerCase().includes(q) ||
      s.courseCode.toLowerCase().includes(q) ||
      s.instructor.toLowerCase().includes(q)
    );
  });

  async function handlePostGrade() {
    if (numericGrade < 0 || numericGrade > 100) {
      toast.error("العلامة يجب أن تكون بين 0 و 100.");
      return;
    }
    const ok = await updateGrade(selectedStudentForGrade, gradeCourseCode, numericGrade, letterGrade);
    if (ok) {
      toast.success(
        `تم رصد علامة ${numericGrade} (${letterGrade}) لمساق ${gradeCourseCode} بنجاح.`,
      );
    }
  }

  function handleSaveSection(secId: string) {
    updateSectionCapacity(secId, newCapacity, newCapacity > 0 ? "متاحة" : "ممتلئة");
    setEditingSectionId(null);
    toast.success("تم تحديث سعة الشعبة وحالتها بنجاح.");
  }

  function handleBroadcastNotice(e: React.FormEvent) {
    e.preventDefault();
    if (!notifTitle.trim() || !notifBody.trim()) {
      toast.error("يرجى إدخال عنوان ونص الإعلان.");
      return;
    }
    postAnnouncement({
      title: notifTitle.trim(),
      body: notifBody.trim(),
      category: notifCat,
      tone: notifTone,
    });
    setNotifTitle("");
    setNotifBody("");
    toast.success("تم نشر الإعلان الرسمي لجميع الطلبة بنجاح.");
  }

  return (
    <AppShell name={activeStudent.name} uid={activeStudent.universityId}>
      <div className="mx-auto max-w-7xl space-y-6 text-right animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs shrink-0">
              <Shield className="size-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  إدارة النظام والعمليات الأكاديمية
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black">
                  صلاحيات الإدارة والمسجل
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                إدارة سجلات الطلاب، الشعب والمقاعد، رصد وتعديل العلامات، ونشر التعميمات
              </p>
            </div>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-2 border-b pb-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("students")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition whitespace-nowrap",
              activeTab === "students"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <Users className="size-4" />
            <span>سجلات الطلاب ({studentsDirectory.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("sections")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition whitespace-nowrap",
              activeTab === "sections"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <Layers className="size-4" />
            <span>إدارة الشعب والمقاعد ({offeredSections.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("grades")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition whitespace-nowrap",
              activeTab === "grades"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <Award className="size-4" />
            <span>رصد وتعديل العلامات</span>
          </button>

          <button
            onClick={() => setActiveTab("announcements")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition whitespace-nowrap",
              activeTab === "announcements"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <Megaphone className="size-4" />
            <span>نشر الإعلانات والتعميمات</span>
          </button>
        </div>

        {/* TAB 1: Students Directory */}
        {activeTab === "students" && (
          <div className="space-y-4">
            <div className="p-4 rounded-3xl border bg-card shadow-sm flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
                <input
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="ابحث باسم الطالب، رقمه، أو تخصصه..."
                  className="h-10 w-full rounded-xl border bg-background ps-9 pe-3 text-xs outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="text-xs text-muted-foreground font-semibold">
                الطالب النشط حالياً: <strong className="text-foreground">{activeStudent.name}</strong> ({activeStudent.universityId})
              </div>
            </div>

            <div className="rounded-3xl border bg-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs">
                  <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
                    <tr>
                      <th className="py-3 px-4">الرقم الجامعي</th>
                      <th className="py-3 px-4">اسم الطالب</th>
                      <th className="py-3 px-4">الكلية والتخصص</th>
                      <th className="py-3 px-4">الخطة الدراسية</th>
                      <th className="py-3 px-4">المرشد الأكاديمي</th>
                      <th className="py-3 px-4 text-center">الحالة</th>
                      <th className="py-3 px-4 text-center">إجراء الإدارة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredStudents.map((s) => {
                      const isCurrent = s.universityId === activeStudent.universityId;
                      return (
                        <tr
                          key={s.universityId}
                          className={cn("hover:bg-muted/20 transition", isCurrent && "bg-primary/5")}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-foreground">
                            {s.universityId}
                          </td>
                          <td className="py-3 px-4 font-bold text-foreground">{s.name}</td>
                          <td className="py-3 px-4">
                            <span className="font-semibold block">{s.major}</span>
                            <span className="text-[10px] text-muted-foreground">{s.faculty}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-muted-foreground">{s.studyPlan}</td>
                          <td className="py-3 px-4 font-medium">{s.academicAdvisor}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2.5 py-0.5 rounded-full bg-muted text-[10px] font-bold">
                              {s.academicStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                selectStudentById(s.universityId);
                                toast.success(`تم تحويل الجلسة إلى ملف الطالب: ${s.name}`);
                              }}
                              className={cn(
                                "px-3 py-1 rounded-xl text-xs font-bold transition",
                                isCurrent
                                  ? "bg-primary text-primary-foreground pointer-events-none"
                                  : "border hover:bg-muted text-foreground",
                              )}
                            >
                              {isCurrent ? "الملف النشط حالياً" : "فتح ملف الطالب"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Sections & Capacity Management */}
        {activeTab === "sections" && (
          <div className="space-y-4">
            <div className="p-4 rounded-3xl border bg-card shadow-sm flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
                <input
                  value={sectionSearch}
                  onChange={(e) => setSectionSearch(e.target.value)}
                  placeholder="ابحث برقم المادة، اسمها، أو المدرس..."
                  className="h-10 w-full rounded-xl border bg-background ps-9 pe-3 text-xs outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <span className="text-xs text-muted-foreground font-semibold">
                إجمالي الشعب: <strong>{filteredSections.length}</strong>
              </span>
            </div>

            <div className="rounded-3xl border bg-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs">
                  <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
                    <tr>
                      <th className="py-3 px-4">رقم المساق</th>
                      <th className="py-3 px-4">اسم المساق والشعبة</th>
                      <th className="py-3 px-4">الأيام والوقت</th>
                      <th className="py-3 px-4">المدرس والقاعة</th>
                      <th className="py-3 px-4 text-center">المقاعد والمسجلين</th>
                      <th className="py-3 px-4 text-center">الحالة</th>
                      <th className="py-3 px-4 text-center">تعديل السعة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredSections.slice(0, 50).map((sec) => {
                      const isEditing = editingSectionId === sec.id;
                      return (
                        <tr key={sec.id} className="hover:bg-muted/20 transition">
                          <td className="py-3 px-4 font-mono font-bold">{sec.courseCode}</td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-foreground block">{sec.courseName}</span>
                            <span className="text-[10px] text-primary font-mono font-bold">شعبة {sec.sectionNumber}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px]">
                            {sec.days} ({sec.startTime} - {sec.endTime})
                          </td>
                          <td className="py-3 px-4">
                            <div>{sec.instructor}</div>
                            <div className="text-[10px] text-muted-foreground">قاعة {sec.room}</div>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold">
                            {isEditing ? (
                              <input
                                type="number"
                                min={sec.enrolled}
                                max={100}
                                value={newCapacity}
                                onChange={(e) => setNewCapacity(Number(e.target.value))}
                                className="h-8 w-20 rounded-lg border bg-background px-2 text-center text-xs font-bold"
                              />
                            ) : (
                              <span>
                                {sec.enrolled} / {sec.capacity}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-bold",
                                sec.enrolled >= sec.capacity
                                  ? "bg-destructive/15 text-destructive"
                                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
                              )}
                            >
                              {sec.enrolled >= sec.capacity ? "ممتلئة" : "متاحة"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleSaveSection(sec.id)}
                                  className="p-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                                  title="حفظ السعة الجديدة"
                                >
                                  <Save className="size-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingSectionId(null)}
                                  className="p-1 rounded-lg border hover:bg-muted"
                                  title="إلغاء"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingSectionId(sec.id);
                                  setNewCapacity(sec.capacity);
                                }}
                                className="px-2.5 py-1 rounded-lg border hover:bg-muted text-xs font-bold transition flex items-center gap-1 mx-auto"
                              >
                                <Edit className="size-3" />
                                <span>تعديل</span>
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
          </div>
        )}

        {/* TAB 3: Grade Entry */}
        {activeTab === "grades" && (
          <div className="rounded-3xl border bg-card p-6 shadow-sm space-y-5 max-w-2xl mx-auto">
            <div className="pb-3 border-b">
              <h2 className="text-base font-bold text-foreground">رصد وتعديل علامة طالب</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                أدخل العلامة الجديدة لمساق معتمد في السجل الدراسي لتحديث المعدل فوراً
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  اختر الطالب المستهدف:
                </label>
                <select
                  value={selectedStudentForGrade}
                  onChange={(e) => setSelectedStudentForGrade(e.target.value)}
                  className="h-10 w-full rounded-xl border bg-background px-3 font-semibold outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {studentsDirectory.map((s) => (
                    <option key={s.universityId} value={s.universityId}>
                      {s.name} ({s.universityId}) - {s.major}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  اختر المساق الدراسي:
                </label>
                <select
                  value={gradeCourseCode}
                  onChange={(e) => setGradeCourseCode(e.target.value)}
                  className="h-10 w-full rounded-xl border bg-background px-3 font-semibold outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {courses.slice(0, 30).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.name} ({c.credits} ساعات)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    العلامة المئوية (0 - 100):
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={numericGrade}
                    onChange={(e) => setNumericGrade(Number(e.target.value))}
                    className="h-10 w-full rounded-xl border bg-background px-3 font-mono font-bold text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    رمز التقدير الأكاديمي:
                  </label>
                  <select
                    value={letterGrade}
                    onChange={(e) => setLetterGrade(e.target.value)}
                    className="h-10 w-full rounded-xl border bg-background px-3 font-mono font-bold outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="A+">A+ (امتياز مرتفع)</option>
                    <option value="A">A (امتياز)</option>
                    <option value="A-">A- (امتياز أدنى)</option>
                    <option value="B+">B+ (جيد جداً مرتفع)</option>
                    <option value="B">B (جيد جداً)</option>
                    <option value="C+">C+ (جيد مرتفع)</option>
                    <option value="C">C (جيد)</option>
                    <option value="D">D (مقبول)</option>
                    <option value="F">F (راسب)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t">
                <button
                  onClick={handlePostGrade}
                  className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition shadow-sm flex items-center justify-center gap-2"
                >
                  <Save className="size-4" />
                  <span>تثبيت ورصد العلامة في السجل الأكاديمي</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Announcements & Notices Broadcast */}
        {activeTab === "announcements" && (
          <div className="rounded-3xl border bg-card p-6 shadow-sm space-y-5 max-w-2xl mx-auto">
            <div className="pb-3 border-b">
              <h2 className="text-base font-bold text-foreground">نشر تعميم أو إعلان رسمي جديد</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                سيظهر هذا الإعلان فوراً في بوابات الطلاب ومركز الإشعارات في جامعة NextAura
              </p>
            </div>

            <form onSubmit={handleBroadcastNotice} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  عنوان الإعلان:
                </label>
                <input
                  type="text"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder="مثال: بدء استقبال طلبات المنح وقروض الفصل الدراسي الثاني..."
                  className="h-10 w-full rounded-xl border bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    فئة الإعلان:
                  </label>
                  <select
                    value={notifCat}
                    onChange={(e) => setNotifCat(e.target.value as any)}
                    className="h-10 w-full rounded-xl border bg-background px-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="التسجيل">التسجيل</option>
                    <option value="الامتحانات">الامتحانات</option>
                    <option value="الشؤون الأكاديمية">الشؤون الأكاديمية</option>
                    <option value="خدمة الطلبة">خدمة الطلبة</option>
                    <option value="المالية">المالية</option>
                    <option value="إعلان عام">إعلان عام</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    مستوى الأهمية:
                  </label>
                  <select
                    value={notifTone}
                    onChange={(e) => setNotifTone(e.target.value as any)}
                    className="h-10 w-full rounded-xl border bg-background px-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="important">تنبيه هام ومستعجل</option>
                    <option value="academic">أكاديمي رسمي</option>
                    <option value="general">إعلان عام واعتيادي</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  نص وتفاصيل الإعلان:
                </label>
                <textarea
                  rows={4}
                  value={notifBody}
                  onChange={(e) => setNotifBody(e.target.value)}
                  placeholder="اكتب تفاصيل الإعلان والتعليمات الموجهة للطلبة هنا..."
                  className="w-full rounded-xl border bg-background p-3 text-xs outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition shadow-sm flex items-center justify-center gap-2"
                >
                  <Megaphone className="size-4" />
                  <span>بث ونشر الإعلان لجميع الطلبة</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppShell>
  );
}

