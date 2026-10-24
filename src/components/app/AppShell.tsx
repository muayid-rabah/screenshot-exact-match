import { useState, type ReactNode } from "react";
import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  BookOpenCheck,
  CalendarDays,
  Map,
  GraduationCap,
  Wallet,
  Sparkles,
  Bell,
  IdCard,
  PanelRightClose,
  PanelRightOpen,
  LogOut,
  Search,
  Layers,
  FileCheck2,
  UserX,
  TrendingUp,
  FileText,
  CalendarRange,
  Shield,
  RotateCcw,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Logo, NextAuraMark } from "@/components/brand/NextAuraBrand";
import { Badge } from "@/components/ui/badge";
import { useStudentStore } from "@/lib/student-store";
import { toast } from "sonner";

export interface NavItemConfig {
  label: string;
  icon: any;
  to: string;
  badge?: string | number;
  adminOnly?: boolean;
}

export const MAIN_NAV: NavItemConfig[] = [
  { label: "لوحة الطالب", icon: LayoutDashboard, to: "/dashboard" },
  { label: "تسجيل المواد", icon: BookOpenCheck, to: "/registration" },
  { label: "السحب والإضافة", icon: CalendarRange, to: "/add-drop" },
  { label: "الشعب المطروحة", icon: Layers, to: "/offered-courses" },
  { label: "الجدول الدراسي", icon: CalendarDays, to: "/schedule" },
  { label: "الخطة الدراسية", icon: Map, to: "/plan" },
  { label: "كشف العلامات", icon: FileText, to: "/grades" },
  { label: "محاكاة المعدل", icon: TrendingUp, to: "/gpa" },
  { label: "الامتحانات", icon: FileCheck2, to: "/exams" },
  { label: "سجل الغيابات", icon: UserX, to: "/absences" },
  { label: "المركز المالي", icon: Wallet, to: "/financial" },
  { label: "الرسائل والإعلانات", icon: Bell, to: "/notifications" },
  { label: "مساعد NextAura الذكي", icon: Sparkles, to: "/assistant" },
  { label: "إدارة النظام الأكاديمي", icon: Shield, to: "/admin" },
];

export function AppShell({
  children,
  name,
  uid,
  unread,
}: {
  children: ReactNode;
  name?: string;
  uid?: string;
  unread?: number;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const location = useLocation();

  const {
    activeStudent,
    studentsDirectory,
    selectStudentById,
    basketSections,
    notifications,
    resetStudentState,
  } = useStudentStore();

  const currentName = name || activeStudent.name;
  const currentUid = uid || activeStudent.universityId;
  const unreadCount = typeof unread === "number" ? unread : notifications.filter((n) => n.unread).length;

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!searchVal.trim()) return;
    const term = searchVal.trim().toLowerCase();
    if (term.includes("تسجيل") || term.includes("مادة") || term.includes("سحب")) {
      navigate({ to: "/registration" });
    } else if (term.includes("جدول") || term.includes("وقت") || term.includes("دوام")) {
      navigate({ to: "/schedule" });
    } else if (term.includes("معدل") || term.includes("gpa")) {
      navigate({ to: "/gpa" });
    } else if (term.includes("علام") || term.includes("درج")) {
      navigate({ to: "/grades" });
    } else if (term.includes("مال") || term.includes("رسوم") || term.includes("دفع")) {
      navigate({ to: "/financial" });
    } else if (term.includes("امتحان") || term.includes("قاع")) {
      navigate({ to: "/exams" });
    } else if (term.includes("غياب") || term.includes("حضور")) {
      navigate({ to: "/absences" });
    } else if (term.includes("خطة")) {
      navigate({ to: "/plan" });
    } else {
      navigate({ to: "/offered-courses" });
    }
  }

  return (
    <div className="flex min-h-screen bg-background font-arabic text-foreground">
      {/* Sidebar */}
      <aside
        className={cn(
          "no-print sticky top-0 hidden h-screen shrink-0 flex-col border-s border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300 md:flex z-30",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-3 px-4 border-b border-sidebar-border/60">
          <NextAuraMark className="size-8 shrink-0 drop-shadow-sm" />
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-display font-extrabold text-base tracking-tight text-sidebar-foreground">
                جامعة NextAura
              </div>
              <div className="text-[9px] font-bold tracking-[0.25em] text-cyan-400">
                INTELLIGENT CAMPUS
              </div>
            </div>
          )}
        </div>

        {/* Navigation items */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3" aria-label="القائمة الرئيسية">
          {MAIN_NAV.map((n) => {
            const isActive = location.pathname === n.to;
            const badgeValue =
              n.to === "/registration" && basketSections.length > 0
                ? basketSections.length
                : n.to === "/notifications" && unreadCount > 0
                  ? unreadCount
                  : undefined;

            return (
              <Link
                key={n.label}
                to={n.to as any}
                title={n.label}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all group",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <n.icon className={cn("size-[18px] shrink-0", isActive ? "text-primary-foreground" : "text-cyan-400/80 group-hover:text-cyan-300")} />
                {!collapsed && <span className="flex-1 truncate">{n.label}</span>}
                {!collapsed && badgeValue && (
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full text-[10px] font-extrabold font-mono",
                      isActive
                        ? "bg-white text-primary"
                        : "bg-cyan-500 text-white animate-pulse",
                    )}
                  >
                    {badgeValue}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="border-t border-sidebar-border/80 p-3 space-y-1">
          <button
            onClick={() => resetStudentState()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition"
            title="إعادة ضبط البيئة التجريبية"
          >
            <RotateCcw className="size-[17px] shrink-0 text-amber-400" />
            {!collapsed && <span>إعادة ضبط الحساب</span>}
          </button>

          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition"
            aria-label="طي القائمة"
          >
            {collapsed ? (
              <PanelRightOpen className="size-[18px] shrink-0" />
            ) : (
              <>
                <PanelRightClose className="size-[18px] shrink-0" />
                <span>طي القائمة الجانبية</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header */}
        <header className="no-print sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur sm:px-8">
          {/* Global Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative hidden max-w-sm flex-1 sm:block">
            <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
            <input
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              aria-label="بحث سريع"
              placeholder="ابحث عن مادة، جدول، علامات، أو خدمة..."
              className="h-9 w-full rounded-xl border bg-card ps-9 pe-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition"
            />
          </form>

          {/* Persona / Demo Student Switcher */}
          <div className="ms-auto flex items-center gap-2.5">
            <div className="hidden lg:flex items-center gap-1.5 text-xs">
              <Users className="size-3.5 text-muted-foreground" />
              <select
                value={activeStudent.universityId}
                onChange={(e) => {
                  selectStudentById(e.target.value);
                  toast.info(`تم تبديل ملف الطالب إلى: ${e.target.value}`);
                }}
                className="h-8 rounded-lg border bg-card px-2 text-[11px] font-semibold text-foreground outline-none focus:ring-1 focus:ring-primary"
                title="التبديل بين حالات الطلاب التجريبية"
              >
                {studentsDirectory.map((s) => (
                  <option key={s.universityId} value={s.universityId}>
                    {s.name} ({s.academicStatus})
                  </option>
                ))}
              </select>
            </div>

            <Badge variant="outline" className="border-cyan-500/40 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold text-[10px]">
              NextAura Live
            </Badge>

            {/* Notifications Bell Button */}
            <Link
              to="/notifications"
              className="relative rounded-xl p-2 hover:bg-muted transition text-foreground"
              aria-label={`الإشعارات (${unreadCount})`}
              title="الإشعارات والرسائل"
            >
              <Bell className="size-5" />
              {unreadCount > 0 && (
                <span className="absolute end-1 top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-extrabold text-destructive-foreground animate-pulse font-mono">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* Active Student Info */}
            <Link to="/profile" className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-muted transition text-end">
              <div className="leading-tight">
                <div className="text-xs font-bold text-foreground">{currentName}</div>
                <div className="text-[10px] text-muted-foreground font-mono" dir="ltr">
                  {currentUid}
                </div>
              </div>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-cyan-600 font-extrabold text-white text-xs shadow-sm">
                {currentName.charAt(0)}
              </div>
            </Link>

            {/* Sign Out Button */}
            <button
              onClick={signOut}
              className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-destructive transition"
              aria-label="تسجيل الخروج"
              title="تسجيل الخروج"
            >
              <LogOut className="size-5" />
            </button>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
