import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  BookOpen,
  Search,
  Filter,
  Users,
  MapPin,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus,
  Layers,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { useStudentStore } from "@/lib/student-store";
import { getRegistrationEligibility } from "@/services/academicEngine";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/offered-courses")({
  head: () => ({
    meta: [
      { title: "المواد والشعب المطروحة | جامعة NextAura" },
      { name: "description", content: "دليل المساقات والشعب المطروحة والمقاعد المتاحة للفصل الدراسي في جامعة NextAura." },
    ],
  }),
  component: OfferedCoursesPage,
});

export function OfferedCoursesPage() {
  const { activeStudent, courses, offeredSections, basketSections, addToBasket } = useStudentStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInstructor, setSelectedInstructor] = useState("ALL");
  const [selectedDay, setSelectedDay] = useState("ALL");
  const [selectedGroup, setSelectedGroup] = useState("ALL");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  // Extract unique instructors & groups
  const instructors = useMemo(() => {
    return Array.from(new Set(offeredSections.map((s) => s.instructor))).sort();
  }, [offeredSections]);

  const groups = useMemo(() => {
    return Array.from(new Set(courses.map((c) => c.group)));
  }, [courses]);

  // Filter sections
  const filteredSections = useMemo(() => {
    return offeredSections.filter((sec) => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        sec.courseCode.toLowerCase().includes(q) ||
        sec.courseName.toLowerCase().includes(q) ||
        sec.room.toLowerCase().includes(q) ||
        sec.instructor.toLowerCase().includes(q);
      if (!matchSearch) return false;

      if (selectedInstructor !== "ALL" && sec.instructor !== selectedInstructor) {
        return false;
      }

      if (selectedDay !== "ALL" && !sec.days.includes(selectedDay)) {
        return false;
      }

      if (selectedGroup !== "ALL") {
        const c = courses.find((course) => course.code === sec.courseCode);
        if (!c || c.group !== selectedGroup) return false;
      }

      if (onlyAvailable && (sec.status === "ممتلئة" || sec.enrolled >= sec.capacity)) {
        return false;
      }

      return true;
    });
  }, [offeredSections, searchQuery, selectedInstructor, selectedDay, selectedGroup, onlyAvailable, courses]);

  return (
    <AppShell name={activeStudent.name} uid={activeStudent.universityId}>
      <div className="mx-auto max-w-7xl space-y-6 text-right animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-foreground">
              <BookOpen className="size-7 text-primary" />
              <span>المواد والشعب المطروحة للفصل الدراسي</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              جدول الشعب المعلنة للفصل الأول 2026/2027 مع تفاصيل الأوقات والقاعات والمقاعد الشاغرة
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-card px-3.5 py-2 rounded-2xl border shadow-xs">
            <span>إجمالي الشعب المطروحة:</span>
            <span className="font-mono text-primary font-bold text-sm">{offeredSections.length}</span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-card p-5 rounded-3xl border shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">بحث برقم أو اسم المادة</label>
              <div className="relative">
                <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="رقم، اسم، قاعة، أو مدرس..."
                  className="h-10 w-full rounded-xl border bg-background ps-9 pe-3 text-xs outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Filter by Group */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">فئة المساق في الخطة</label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="h-10 w-full rounded-xl border bg-background px-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="ALL">جميع فئات الخطة</option>
                {groups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Instructor */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">مدرس المساق</label>
              <select
                value={selectedInstructor}
                onChange={(e) => setSelectedInstructor(e.target.value)}
                className="h-10 w-full rounded-xl border bg-background px-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="ALL">جميع أعضاء هيئة التدريس</option>
                {instructors.map((ins) => (
                  <option key={ins} value={ins}>
                    {ins}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Days */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">أيام المحاضرات</label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="h-10 w-full rounded-xl border bg-background px-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="ALL">جميع الأيام</option>
                <option value="ح ث خ">أحد / ثلاثاء / خميس (ح ث خ)</option>
                <option value="ن ر">اثنين / أربعاء (ن ر)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-bold select-none">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span>إظهار الشعب ذات المقاعد الشاغرة فقط</span>
            </label>

            <span className="text-muted-foreground font-medium">
              النتائج المطابقة: <strong>{filteredSections.length}</strong> شعبة
            </span>
          </div>
        </div>

        {/* Sections Grid / Cards */}
        {filteredSections.length === 0 ? (
          <div className="rounded-3xl border bg-card p-16 text-center text-sm text-muted-foreground space-y-2">
            <BookOpen className="size-10 mx-auto opacity-40" />
            <p className="font-bold">لا توجد شعب مطابقة لمعايير البحث الحالية.</p>
            <p className="text-xs">جرب تغيير كلمات البحث أو إعادة تعيين الفلاتر.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSections.map((sec) => {
              const course = courses.find((c) => c.code === sec.courseCode);
              const eligibility = getRegistrationEligibility(sec.courseCode, activeStudent, courses);
              const isAlreadyRegistered = activeStudent.currentRegisteredSections.some(
                (s) => s.courseCode === sec.courseCode,
              );
              const isInBasket = basketSections.some((s) => s.id === sec.id);
              const isFull = sec.enrolled >= sec.capacity || sec.status === "ممتلئة";
              const availableSeats = Math.max(0, sec.capacity - sec.enrolled);

              return (
                <div
                  key={sec.id}
                  className={cn(
                    "rounded-3xl border bg-card p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4",
                    isInBasket && "border-primary bg-primary/5",
                  )}
                >
                  <div className="space-y-2.5">
                    {/* Header line */}
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-muted-foreground">
                        {sec.courseCode}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-mono text-[10px] font-bold">
                          شعبة {sec.sectionNumber}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {sec.credits} ساعات
                        </span>
                      </div>
                    </div>

                    {/* Course Title */}
                    <div>
                      <h3 className="font-bold text-sm text-foreground leading-snug">
                        {sec.courseName}
                      </h3>
                      {course && (
                        <span className="text-[10px] font-medium text-muted-foreground block mt-0.5 truncate">
                          {course.group}
                        </span>
                      )}
                    </div>

                    {/* Timings, Room & Instructor */}
                    <div className="space-y-1.5 pt-2 border-t text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="size-3.5 text-primary" />
                        <span className="font-semibold text-foreground">{sec.days}</span>
                        <span className="font-mono text-[11px] dir-ltr">
                          ({sec.startTime} - {sec.endTime})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="size-3.5 text-muted-foreground" />
                        <span>القاعة: {sec.room}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="size-3.5 text-muted-foreground" />
                        <span>المدرس: {sec.instructor}</span>
                      </div>

                      {course?.prerequisites && course.prerequisites.length > 0 && (
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-muted-foreground">المتطلب السابق:</span>
                          <span className="font-mono font-bold text-foreground">
                            {course.prerequisites.join("، ")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Capacity Indicator Bar */}
                    <div className="pt-2 border-t space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">المقاعد المتاحة:</span>
                        <span className="font-mono font-bold text-foreground">
                          {availableSeats} / {sec.capacity}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            isFull
                              ? "bg-destructive"
                              : availableSeats < 5
                                ? "bg-amber-500"
                                : "bg-emerald-500",
                          )}
                          style={{ width: `${Math.min(100, (sec.enrolled / sec.capacity) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="pt-2 flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2.5 py-1 rounded-full",
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

                    {isInBasket ? (
                      <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                        <CheckCircle2 className="size-3.5" />
                        في السلة
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          const res = addToBasket(sec);
                          if (res.success) toast.success(res.message);
                          else toast.error(res.message);
                        }}
                        disabled={isAlreadyRegistered || isFull || eligibility.state !== "ELIGIBLE"}
                        className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition disabled:opacity-40 flex items-center gap-1"
                      >
                        <Plus className="size-3.5" />
                        <span>تسجيل بالشعبة</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

