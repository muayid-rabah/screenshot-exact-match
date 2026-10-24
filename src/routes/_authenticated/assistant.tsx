import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Sparkles,
  Bot,
  User,
  Send,
  RotateCcw,
  BookOpenCheck,
  CalendarDays,
  TrendingUp,
  Wallet,
  UserX,
  Map,
  ShieldCheck,
  ChevronLeft,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { useStudentStore } from "@/lib/student-store";
import { generateAssistantResponse, type ChatMessage } from "@/services/smartAssistant";
import { calculateStudentProgress } from "@/services/academicEngine";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({
    meta: [
      { title: "المرشد الأكاديمي الذكي | جامعة NextAura" },
      { name: "description", content: "المساعد الأكاديمي الذكي المخصص لطلبة جامعة NextAura للإجابة على الاستفسارات الأكاديمية." },
    ],
  }),
  component: AssistantPage,
});

export function AssistantPage() {
  const { activeStudent, courses } = useStudentStore();
  const progress = calculateStudentProgress(activeStudent, courses);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      sender: "assistant",
      content: `مرحباً بك يا **${activeStudent.name}** في مساعد **جامعة NextAura** الأكاديمي الذكي! 🎓🌟\n\nأنا متصل بسجلك الدراسي وخطة تخصصك (${activeStudent.major}). يمكنك سؤالي عن:\n- معدلك التراكمي والفصلي وخطة رفع المعدل.\n- الساعات المنجزة والمتبقية للتخرج.\n- المواد التي يحق لك تسجيلها واستيفاء المتطلبات.\n- فحص التعارضات في جدول المحاضرات.\n- سجل الحضور والغيابات والإنذارات.\n- كشف الحساب المالي والرسوم الجامعية.\n\nكيف يمكنني مساعدتك الآن؟`,
      timestamp: "الآن",
    },
  ]);

  const quickPrompts = [
    { label: "📊 ما هو وضعي الأكاديمي ومعدلي الحالي؟", q: "ما هو وضعي الأكاديمي ومعدلي الحالي؟" },
    { label: "🎓 كم ساعة متبقية لتخرجي وما هي الخطة؟", q: "كم ساعة متبقية لتخرجي؟" },
    { label: "✨ ما هي المواد التي يحق لي تسجيلها الآن؟", q: "ما هي المواد المؤهل لتسجيلها؟" },
    { label: "📅 هل يوجد تعارض زمني في جدول محاضراتي؟", q: "هل يوجد تعارض في جدول المحاضرات؟" },
    { label: "⚠️ كشف الغيابات ونسب الحضور ومخاطر الإنذار", q: "ما هو سجل غيابي وهل لدي إنذارات؟" },
    { label: "💳 ما هو رصيد الرسوم المستحق في حسابي المالي؟", q: "ما هو رصيد حسابي المالي والرسوم؟" },
  ];

  function handleSend(text?: string) {
    const q = (text || input).trim();
    if (!q) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      content: q,
      timestamp: new Date().toLocaleTimeString("ar-JO", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      const response = generateAssistantResponse(q, activeStudent, courses);
      const asstMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: "assistant",
        content: response,
        timestamp: new Date().toLocaleTimeString("ar-JO", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, asstMsg]);
    }, 250);
  }

  function handleClear() {
    setMessages([
      {
        id: `rst-${Date.now()}`,
        sender: "assistant",
        content: `تمت إعادة ضبط المحادثة. أهلاً بك يا ${activeStudent.name.split(" ")[0]}، أنا جاهز للإجابة عن أي استفسار أكاديمي جديد.`,
        timestamp: "الآن",
      },
    ]);
  }

  return (
    <AppShell name={activeStudent.name} uid={activeStudent.universityId}>
      <div className="mx-auto max-w-5xl space-y-6 text-right animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-gradient-to-br from-primary to-cyan-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Sparkles className="size-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  مساعد NextAura الأكاديمي الذكي
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200">
                  متصل بالسجل الحي
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                نظام إرشاد أكاديمي ذكي مدعوم بالبيانات الرسمية للطالب في جامعة NextAura
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleClear}
              className="px-3.5 py-2 rounded-xl border bg-card hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              title="إعادة بدء المحادثة"
            >
              <RotateCcw className="size-3.5" />
              <span>محادثة جديدة</span>
            </button>
          </div>
        </div>

        {/* Live Academic Context Bar */}
        <div className="p-4 rounded-3xl bg-card border shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-muted-foreground block text-[11px]">الطالب المستعلم:</span>
            <strong className="text-foreground">{activeStudent.name}</strong>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">التخصص والخطة:</span>
            <strong className="text-foreground">{activeStudent.major} ({activeStudent.studyPlan})</strong>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">الإنجاز الأكاديمي:</span>
            <strong className="text-emerald-600 font-mono">
              {progress.totalCompletedHours} / {progress.totalPlanHours} ساعة ({progress.completionPercentage}%)
            </strong>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">الحالة الأكاديمية:</span>
            <strong className="text-purple-600">{activeStudent.academicStatus}</strong>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-muted-foreground block px-1">
            استفسارات سريعة مقترحة:
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {quickPrompts.map((p) => (
              <button
                key={p.q}
                onClick={() => handleSend(p.q)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-card border hover:border-primary hover:text-primary transition shadow-2xs"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Chat Interface */}
        <div className="rounded-3xl border bg-card overflow-hidden shadow-sm flex flex-col h-[600px]">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex gap-3 max-w-[85%]",
                  m.sender === "user" ? "ms-auto flex-row-reverse" : "me-auto flex-row",
                )}
              >
                <div
                  className={cn(
                    "size-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                    m.sender === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
                  )}
                >
                  {m.sender === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
                </div>

                <div className="space-y-1">
                  <div
                    className={cn(
                      "p-4 rounded-3xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-xs",
                      m.sender === "user"
                        ? "bg-primary text-primary-foreground rounded-br-xs"
                        : "bg-muted/40 border text-foreground rounded-bl-xs",
                    )}
                  >
                    {m.content}
                  </div>
                  <div
                    className={cn(
                      "text-[10px] text-muted-foreground px-2 font-mono",
                      m.sender === "user" ? "text-start" : "text-end",
                    )}
                  >
                    {m.timestamp}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Deep Navigation Shortcuts */}
          <div className="p-2 border-t bg-muted/20 flex items-center justify-around text-xs text-muted-foreground overflow-x-auto">
            <Link to="/registration" className="flex items-center gap-1 hover:text-primary px-2 py-1">
              <BookOpenCheck className="size-3.5" />
              <span>التسجيل الإلكتروني</span>
            </Link>
            <Link to="/schedule" className="flex items-center gap-1 hover:text-primary px-2 py-1">
              <CalendarDays className="size-3.5" />
              <span>الجدول الدراسي</span>
            </Link>
            <Link to="/gpa" className="flex items-center gap-1 hover:text-primary px-2 py-1">
              <TrendingUp className="size-3.5" />
              <span>محاكاة المعدل</span>
            </Link>
            <Link to="/financial" className="flex items-center gap-1 hover:text-primary px-2 py-1">
              <Wallet className="size-3.5" />
              <span>المركز المالي</span>
            </Link>
          </div>

          {/* Input Box */}
          <div className="p-3 sm:p-4 border-t bg-card">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اسأل المرشد الذكي عن موادك، جدولك، معدلك، أو أي استفسار أكاديمي..."
                className="flex-1 h-11 rounded-2xl border bg-background px-4 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary/40 transition"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="h-11 px-5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm transition disabled:opacity-40 flex items-center gap-2 shadow-xs"
              >
                <span>إرسال</span>
                <Send className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

