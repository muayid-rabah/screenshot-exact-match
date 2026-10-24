import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  FileCheck2,
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  AlertCircle,
  Printer,
  Sparkles,
  ShieldAlert,
  Search,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { useStudentStore } from "@/lib/student-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/exams")({
  head: () => ({
    meta: [
      { title: "جدول الامتحانات | جامعة NextAura" },
      { name: "description", content: "مواعيد وجدول الامتحانات والقاعات والمقاعد في جامعة NextAura." },
    ],
  }),
  component: ExamsPage,
});

export function ExamsPage() {
  const { activeStudent } = useStudentStore();
  const exams = activeStudent.exams;

  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Sorted exams by date
  const sortedExams = [...exams].sort((a, b) => a.date.localeCompare(b.date));
  const nextExam = sortedExams[0];

  const filteredExams = sortedExams.filter((e) => {
    if (selectedType !== "ALL" && e.examType !== selectedType) return false;
    if (searchQuery) {
      const q = searchQuery.trim().toLowerCase();
      return (
        e.courseName.toLowerCase().includes(q) ||
        e.courseCode.toLowerCase().includes(q) ||
        e.room.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <AppShell name={activeStudent.name} uid={activeStudent.universityId}>
      <div className="mx-auto max-w-7xl space-y-6 text-right animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-foreground">
              <FileCheck2 className="size-7 text-primary" />
              <span>مواعيد وجدول الامتحانات الرسمية</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              جدول الامتحانات المحوسبة والورقية ومواقع القاعات والمقاعد للطالب {activeStudent.name}
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-10 px-3.5 bg-card border rounded-xl text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/40 shadow-xs"
            >
              <option value="ALL">جميع الامتحانات</option>
              <option value="الامتحان الأول">الامتحان الأول</option>
              <option value="الامتحان الثاني">الامتحان الثاني</option>
              <option value="امتحان منتصف الفصل">امتحان منتصف الفصل</option>
              <option value="الامتحان النهائي">الامتحان النهائي</option>
            </select>

            <button
              onClick={() => window.print()}
              className="p-2.5 rounded-xl border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition shadow-xs"
              title="طباعة جدول الامتحانات"
            >
              <Printer className="size-4" />
            </button>
          </div>
        </div>

        {/* Top Highlight Card: Next Exam */}
        {nextExam && (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/15 via-card to-card border border-amber-500/30 text-card-foreground p-6 sm:p-7 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-black flex items-center gap-1.5 shadow-xs">
                  <Sparkles className="size-3.5" />
                  <span>أقرب امتحان قادم</span>
                </span>
                <span className="text-xs font-bold text-muted-foreground">
                  {nextExam.examType}
                </span>
              </div>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                الفصل الأول 2026/2027
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-foreground">
                  {nextExam.courseName}{' '}
                  <span className="text-sm font-mono text-muted-foreground font-normal">
                    ({nextExam.courseCode})
                  </span>
                </h2>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground pt-2">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="size-4 text-primary" />
                    <span className="font-bold text-foreground">
                      {nextExam.dayName}، {nextExam.date}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <Clock className="size-4 text-primary" />
                    <span>{nextExam.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="size-4 text-primary" />
                    <span>القاعة: <strong className="text-foreground">{nextExam.room}</strong></span>
                  </div>
                  {nextExam.seatNumber && (
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="size-4 text-primary" />
                      <span>رقم المقعد: <strong className="font-mono text-foreground font-bold">{nextExam.seatNumber}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Exams Table */}
        <div className="rounded-3xl border bg-card overflow-hidden shadow-sm space-y-4">
          <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-foreground">جدول الامتحانات المجدولة</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                تأكد من مطابقة أوقات الامتحانات ومراجعة القاعة المخصصة قبل الموعد بنصف ساعة
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بمادة أو قاعة..."
                className="h-9 w-full rounded-xl border bg-background ps-9 pe-3 text-xs outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          {filteredExams.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground space-y-2">
              <FileCheck2 className="size-8 mx-auto opacity-40" />
              <p>لا توجد امتحانات معلنة مطابقة للبحث حالياً.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-3 px-4">رقم المساق</th>
                    <th className="py-3 px-4">اسم المساق</th>
                    <th className="py-3 px-4 text-center">نوع الامتحان</th>
                    <th className="py-3 px-4">اليوم والتاريخ</th>
                    <th className="py-3 px-4">الوقت</th>
                    <th className="py-3 px-4">القاعة المخصصة</th>
                    <th className="py-3 px-4 text-center">رقم المقعد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredExams.map((e) => (
                    <tr key={`${e.courseCode}-${e.examType}`} className="hover:bg-muted/20 transition">
                      <td className="py-3.5 px-4 font-mono font-bold">{e.courseCode}</td>
                      <td className="py-3.5 px-4 font-bold text-foreground">{e.courseName}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                          {e.examType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {e.dayName}، {e.date}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-600 dark:text-cyan-400">
                        {e.time}
                      </td>
                      <td className="py-3.5 px-4 font-medium">{e.room}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-foreground">
                        {e.seatNumber || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Exam Guidelines Notice */}
        <div className="p-4 rounded-2xl bg-muted/40 border text-xs text-muted-foreground space-y-1.5 leading-relaxed">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <ShieldAlert className="size-4 text-amber-500" />
            <span>تعليمات وضوابط دخول قاعات الامتحانات بجامعة NextAura:</span>
          </div>
          <p>
            1. يجب إبراز البطاقة الجامعية الرقمية أو الرسمية للمراقب عند دخول قاعة الامتحان.
          </p>
          <p>
            2. يمنع منعاً باتاً إدخال أجهزة الهاتف المحمول أو الساعات الذكية إلى قاعات الامتحانات المحوسبة.
          </p>
          <p>
            3. لن يسمح بدخول أي طالب بعد مضي 15 دقيقة من بدء وقت الامتحان الرسمي.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

