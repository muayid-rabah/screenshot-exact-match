import React, { useState } from 'react';
import { Sparkles, X, Send, Bot, ArrowLeft } from 'lucide-react';
import { useStudentStore } from '@/lib/student-store';
import { generateAssistantResponse, type ChatMessage } from '@/services/smartAssistant';
import { Link } from '@tanstack/react-router';

export function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const { activeStudent, courses } = useStudentStore();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      content: `أهلاً بك يا ${activeStudent.name.split(' ')[0]} في **جامعة NextAura**! 🌟\nأنا مرشدك الأكاديمي الذكي. كيف يمكنني مساعدتك في خطتك أو جدولك أو معدلك اليوم؟`,
      timestamp: 'الآن',
    },
  ]);

  const handleSend = (text?: string) => {
    const q = (text || input).trim();
    if (!q) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: q,
      timestamp: 'الآن',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      const reply = generateAssistantResponse(q, activeStudent, courses);
      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        content: reply,
        timestamp: 'الآن',
      };
      setMessages((prev) => [...prev, assistantMsg]);
    }, 300);
  };

  const quickPrompts = [
    'كم ساعة متبقية لتخرجي؟',
    'ما هو معدلي التراكمي؟',
    'ما هي المواد المتاحة لتسجيلي؟',
    'هل لدي أي غيابات أو إنذارات؟',
  ];

  return (
    <div className="fixed bottom-6 start-6 z-50 font-arabic text-right">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-primary to-cyan-600 text-white font-bold text-xs sm:text-sm shadow-xl hover:shadow-cyan-500/25 hover:scale-105 active:scale-95 transition-all group border border-white/20"
          title="افتح مساعد NextAura الذكي"
        >
          <Sparkles className="size-4 text-amber-300 animate-spin group-hover:rotate-45 transition-transform" />
          <span>مساعد NextAura الذكي</span>
          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-white/20 text-white font-mono">
            AI
          </span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] rounded-3xl bg-card border shadow-2xl flex flex-col overflow-hidden animate-rise">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-cyan-700 text-white p-4 flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Bot className="size-4 text-cyan-200" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-bold flex items-center gap-1.5">
                  <span>مساعد NextAura الذكي</span>
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-[10px] text-white/75">متصل بملفك وسجلك الأكاديمي</div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Link
                to="/assistant"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 text-white/90 text-xs flex items-center gap-1 transition"
                title="فتح في صفحة كاملة"
              >
                <ArrowLeft className="size-4" />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 text-white/90 transition"
                aria-label="إغلاق النافذة"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="p-2 border-b bg-muted/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {quickPrompts.map((p) => (
              <button
                key={p}
                onClick={() => handleSend(p)}
                className="text-[10px] font-semibold whitespace-nowrap px-2.5 py-1 rounded-full bg-background border hover:border-primary hover:text-primary transition shrink-0"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed whitespace-pre-wrap ${
                    m.sender === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-xs'
                      : 'bg-muted border text-foreground rounded-bl-xs'
                  }`}
                >
                  {m.content}
                </div>
                <span className="text-[9px] text-muted-foreground mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}
          </div>

          {/* Input Footer */}
          <div className="p-3 border-t bg-card shrink-0">
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
                placeholder="اسأل المرشد الأكاديمي..."
                className="flex-1 h-9 rounded-xl border bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="size-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 transition"
              >
                <Send className="size-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

