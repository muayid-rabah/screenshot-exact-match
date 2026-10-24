import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bell,
  CheckCheck,
  CircleAlert,
  CalendarDays,
  Info,
  Megaphone,
  Trash2,
  CheckCircle2,
  Filter,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { useStudentStore } from "@/lib/student-store";
import { cn } from "@/lib/utils";
import type { NoticeMessage } from "@/types/student";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "الرسائل والإعلانات | جامعة NextAura" },
      { name: "description", content: "مركز الإشعارات والرسائل الرسمية والإعلانات الأكاديمية في جامعة NextAura." },
    ],
  }),
  component: NotificationsPage,
});

export function NotificationsPage() {
  const {
    activeStudent,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
  } = useStudentStore();

  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const unreadCount = notifications.filter((n) => n.unread).length;

  const categories = [
    "ALL",
    "التسجيل",
    "الامتحانات",
    "الشؤون الأكاديمية",
    "خدمة الطلبة",
    "المالية",
    "إعلان عام",
  ];

  const filteredNotices = notifications.filter((n) => {
    if (selectedCategory === "ALL") return true;
    return n.category === selectedCategory;
  });

  const getToneIcon = (tone: NoticeMessage["tone"]) => {
    switch (tone) {
      case "important":
      case "warning":
        return CircleAlert;
      case "academic":
        return CalendarDays;
      default:
        return Info;
    }
  };

  return (
    <AppShell name={activeStudent.name} uid={activeStudent.universityId} unread={unreadCount}>
      <div className="mx-auto max-w-4xl space-y-6 text-right animate-fade-in">
        {/* Header Hero */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs shrink-0">
              <Bell className="size-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  مركز الرسائل والإشعارات الرسمية
                </h1>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-black font-mono">
                    {unreadCount} غير مقروء
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                الإعلانات والتعميمات والتنبيهات الموجهة إلى الطالب في جامعة NextAura
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => markAllNotificationsAsRead()}
              disabled={unreadCount === 0}
              className="px-4 py-2 rounded-xl bg-card border hover:bg-muted text-foreground text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-40"
            >
              <CheckCheck className="size-4 text-primary" />
              <span>تعليم الكل كمقروء</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition",
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-card border text-muted-foreground hover:bg-muted",
              )}
            >
              {cat === "ALL" ? "جميع الرسائل" : cat}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotices.length === 0 ? (
            <div className="p-16 rounded-3xl border bg-card text-center text-sm text-muted-foreground space-y-2">
              <Bell className="size-10 mx-auto opacity-30" />
              <p className="font-bold">لا توجد رسائل في هذه الفئة حالياً.</p>
            </div>
          ) : (
            filteredNotices.map((notice) => {
              const Icon = getToneIcon(notice.tone);
              return (
                <div
                  key={notice.id}
                  className={cn(
                    "p-5 rounded-3xl border transition-all flex items-start gap-4 shadow-sm",
                    notice.unread
                      ? "bg-card border-primary/40 ring-1 ring-primary/20"
                      : "bg-card/60 opacity-80 hover:opacity-100",
                  )}
                >
                  <div
                    className={cn(
                      "size-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5",
                      notice.tone === "important" || notice.tone === "warning"
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        : notice.tone === "academic"
                          ? "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400"
                          : "bg-primary/10 text-primary",
                    )}
                  >
                    <Icon className="size-5" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                          {notice.category}
                        </span>
                        {notice.unread && (
                          <span className="size-2 rounded-full bg-primary animate-pulse" />
                        )}
                      </div>
                      <time className="text-[11px] text-muted-foreground font-mono">
                        {notice.date}
                      </time>
                    </div>

                    <h2 className="text-sm font-bold text-foreground">{notice.title}</h2>
                    <p className="text-xs text-muted-foreground leading-relaxed">{notice.body}</p>

                    <div className="pt-2 flex items-center justify-end gap-2 text-xs">
                      {notice.unread && (
                        <button
                          onClick={() => markNotificationAsRead(notice.id)}
                          className="text-[11px] text-primary font-bold hover:underline"
                        >
                          تعليم كمقروء
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notice.id)}
                        className="text-muted-foreground hover:text-destructive p-1 rounded-md transition"
                        title="حذف الرسالة"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 rounded-2xl bg-muted/40 border text-xs text-muted-foreground flex items-center gap-2">
          <Megaphone className="size-4 text-primary shrink-0" />
          <span>
            هذه الرسائل والإعلانات تصدر رسمياً من عمادة شؤون الطلبة ودائرة القبول والتسجيل بجامعة NextAura.
          </span>
        </div>
      </div>
    </AppShell>
  );
}

