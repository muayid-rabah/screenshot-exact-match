import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, BookOpenCheck, CalendarDays, Map, GraduationCap, Wallet, Sparkles, Bell, IdCard,
  PanelRightClose, PanelRightOpen, LogOut, Search,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { CompassMark } from "@/components/brand/CompassMark";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { label: "لوحة الطالب", icon: LayoutDashboard, to: "/dashboard" as const },
  { label: "تسجيل المواد", icon: BookOpenCheck },
  { label: "الجدول الدراسي", icon: CalendarDays },
  { label: "الخطة الدراسية", icon: Map },
  { label: "العلامات والمعدل", icon: GraduationCap },
  { label: "المركز المالي", icon: Wallet },
  { label: "مرشدي الذكي", icon: Sparkles },
  { label: "البطاقة الجامعية", icon: IdCard },
];

export function AppShell({ children, name, uid, unread }: { children: ReactNode; name: string; uid: string; unread: number }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="flex min-h-screen">
      <aside className={cn("no-print sticky top-0 hidden h-screen shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-300 md:flex", collapsed ? "w-[72px]" : "w-64")}>
        <div className="flex h-16 items-center gap-3 px-4 text-sidebar-accent-foreground">
          <CompassMark className="size-8 shrink-0" />
          {!collapsed && <div className="leading-tight"><div className="font-display font-bold">جامعة مرشدي</div><div className="text-[9px] tracking-[0.25em] text-sidebar-primary">MORSHIDI</div></div>}
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4" aria-label="القائمة الرئيسية">
          {NAV.map((n) => {
            const inner = (
              <>
                <n.icon className="size-[18px] shrink-0" />
                {!collapsed && <span className="flex-1">{n.label}</span>}
                {!collapsed && !n.to && <span className="text-[10px] text-sidebar-foreground/40">قريباً</span>}
              </>
            );
            const cls = "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors";
            return n.to ? (
              <Link key={n.label} to={n.to} title={n.label} className={cls} activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" }}>{inner}</Link>
            ) : (
              <span key={n.label} title={`${n.label} — قريباً`} aria-disabled="true" className={cn(cls, "cursor-not-allowed opacity-50")}>{inner}</span>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <button onClick={() => setCollapsed((c) => !c)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-sidebar-accent" aria-label="طي القائمة">
            {collapsed ? <PanelRightOpen className="size-[18px]" /> : <><PanelRightClose className="size-[18px]" /> طي القائمة</>}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-background/85 px-4 backdrop-blur sm:px-8">
          <div className="relative hidden max-w-sm flex-1 sm:block">
            <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
            <input aria-label="بحث" placeholder="ابحث عن مادة أو خدمة..." className="h-10 w-full rounded-lg border bg-card ps-9 pe-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
          <div className="ms-auto flex items-center gap-3">
            <Badge variant="outline" className="border-gold/50 text-accent-foreground">بيئة تجريبية</Badge>
            <button className="relative rounded-lg p-2 hover:bg-muted" aria-label={`الإشعارات (${unread})`}>
              <Bell className="size-5" />
              {unread > 0 && <span className="absolute end-1 top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">{unread}</span>}
            </button>
            <div className="hidden text-end leading-tight sm:block">
              <div className="text-sm font-semibold">{name}</div>
              <div className="text-xs text-muted-foreground tabular" dir="ltr">{uid}</div>
            </div>
            <div className="flex size-9 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">{name.charAt(0)}</div>
            <button onClick={signOut} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-destructive" aria-label="تسجيل الخروج" title="تسجيل الخروج">
              <LogOut className="size-5" />
            </button>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
