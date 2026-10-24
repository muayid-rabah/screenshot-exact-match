import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Wallet,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  Printer,
  ShieldCheck,
  Building,
  CheckCircle2,
  X,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { useStudentStore } from "@/lib/student-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/financial")({
  head: () => ({
    meta: [
      { title: "المركز المالي والرسوم | جامعة NextAura" },
      { name: "description", content: "كشف الحساب المالي، الرسوم الجامعية، والدفع الإلكتروني في جامعة NextAura." },
    ],
  }),
  component: FinancialPage,
});

export function FinancialPage() {
  const { activeStudent, processPayment } = useStudentStore();
  const summary = activeStudent.financialSummary;
  const transactions = activeStudent.transactions;

  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(
    summary.currentBalance > 0 ? summary.currentBalance : 100,
  );
  const [paymentMethod, setPaymentMethod] = useState("بطاقة ائتمانية (Visa / MasterCard)");
  const [loading, setLoading] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<string | null>(null);

  async function handleSimulatePayment() {
    if (payAmount <= 0) {
      toast.error("يرجى إدخال مبلغ دفع صالح.");
      return;
    }
    setLoading(true);
    try {
      const res = await processPayment(payAmount, paymentMethod);
      if (res.success) {
        setLastReceipt(res.receiptNumber);
        toast.success(`تمت عملية الدفع بنجاح بقيمة ${payAmount} د.أ. رقم الإيصال: #${res.receiptNumber}`);
      }
    } finally {
      setLoading(false);
      setShowPayModal(false);
    }
  }

  return (
    <AppShell name={activeStudent.name} uid={activeStudent.universityId}>
      <div className="mx-auto max-w-7xl space-y-6 text-right animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-foreground">
              <Wallet className="size-7 text-primary" />
              <span>كشف الحساب المالي والرسوم الجامعية</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              سجل الحركات المالية المعتمدة بالدينار الأردني (د.أ) للطالب {activeStudent.name}
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {summary.currentBalance > 0 && (
              <button
                onClick={() => setShowPayModal(true)}
                className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md transition flex items-center gap-2"
              >
                <CreditCard className="size-4" />
                <span>دفع إلكتروني فوري</span>
              </button>
            )}

            <button
              onClick={() => window.print()}
              className="p-2.5 rounded-xl border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition shadow-xs"
              title="طباعة كشف الحساب"
            >
              <Printer className="size-4" />
            </button>
          </div>
        </div>

        {/* 5 Financial Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* الرصيد السابق */}
          <div className="bg-card p-4 rounded-3xl border shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground block mb-1">الرصيد السابق</span>
            <div className="text-2xl font-black text-foreground font-mono">
              {summary.previousBalance.toFixed(2)}{' '}
              <span className="text-xs font-normal text-muted-foreground">د.أ</span>
            </div>
            <span className="text-[11px] text-muted-foreground">مدور من الفصول السابقة</span>
          </div>

          {/* إجمالي الرسوم */}
          <div className="bg-card p-4 rounded-3xl border shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground block mb-1">إجمالي الرسوم</span>
            <div className="text-2xl font-black text-rose-600 font-mono">
              {summary.totalFees.toFixed(2)}{' '}
              <span className="text-xs font-normal text-muted-foreground">د.أ</span>
            </div>
            <span className="text-[11px] text-rose-500 font-semibold">رسوم ساعات وتسجيل</span>
          </div>

          {/* إجمالي الدفعات */}
          <div className="bg-card p-4 rounded-3xl border shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground block mb-1">إجمالي الدفعات</span>
            <div className="text-2xl font-black text-emerald-600 font-mono">
              {summary.totalPayments.toFixed(2)}{' '}
              <span className="text-xs font-normal text-muted-foreground">د.أ</span>
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold">مسددة رسمياً</span>
          </div>

          {/* إجمالي الخصومات */}
          <div className="bg-card p-4 rounded-3xl border shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground block mb-1">الخصومات والمنح</span>
            <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono">
              {summary.totalDiscounts.toFixed(2)}{' '}
              <span className="text-xs font-normal text-muted-foreground">د.أ</span>
            </div>
            <span className="text-[11px] text-cyan-600 font-semibold">منح تفوق وخصم إخوة</span>
          </div>

          {/* الرصيد الحالي المستحق */}
          <div className="bg-card p-4 rounded-3xl border shadow-sm col-span-2 sm:col-span-1">
            <span className="text-xs font-semibold text-muted-foreground block mb-1">الرصيد المستحق</span>
            <div
              className={cn(
                "text-2xl font-black font-mono",
                summary.currentBalance > 0 ? "text-destructive" : "text-emerald-600",
              )}
            >
              {summary.currentBalance.toFixed(2)}{' '}
              <span className="text-xs font-normal text-muted-foreground">د.أ</span>
            </div>
            <span
              className={cn(
                "text-[11px] font-bold",
                summary.currentBalance > 0 ? "text-destructive" : "text-emerald-600",
              )}
            >
              {summary.currentBalance > 0 ? "مستحق السداد" : "مسدد بالكامل ✓"}
            </span>
          </div>
        </div>

        {/* Receipt confirmation if last payment exists */}
        {lastReceipt && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
              <CheckCircle2 className="size-4" />
              <span>تم توثيق إيصال السداد الأخير بنجاح برقم: <code className="font-mono">{lastReceipt}</code></span>
            </div>
            <button
              onClick={() => window.print()}
              className="text-xs text-primary font-bold hover:underline"
            >
              طباعة إشعار القبض
            </button>
          </div>
        )}

        {/* Transaction Ledger Table */}
        <div className="rounded-3xl border bg-card overflow-hidden shadow-sm space-y-4">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">سجل الحركات المالية المعتمدة</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                سجل قيود الرسوم والدفعات المالية المسجلة على الرقم الجامعي {activeStudent.universityId}
              </p>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {transactions.length} حركات مسجلة
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground space-y-2">
              <Receipt className="size-8 mx-auto opacity-40" />
              <p>لا توجد حركات مالية مسجلة على هذا الحساب حالياً.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-3 px-4">رقم الحركة</th>
                    <th className="py-3 px-4">التاريخ</th>
                    <th className="py-3 px-4">رقم الإيصال / المرجع</th>
                    <th className="py-3 px-4">البيان والتفاصيل</th>
                    <th className="py-3 px-4 text-center">مدين (رسوم)</th>
                    <th className="py-3 px-4 text-center">دائن (دفعات)</th>
                    <th className="py-3 px-4 text-center">الرصيد التراكمي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/20 transition">
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">{t.id}</td>
                      <td className="py-3.5 px-4 font-mono">{t.date}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground">{t.reference}</td>
                      <td className="py-3.5 px-4 font-semibold text-foreground max-w-xs">{t.statement}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-600">
                        {t.debit > 0 ? `${t.debit.toFixed(2)} د.أ` : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-600">
                        {t.credit > 0 ? `${t.credit.toFixed(2)} د.أ` : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-extrabold text-foreground">
                        {t.balance.toFixed(2)} د.أ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payment Simulation Modal */}
        {showPayModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-3xl bg-card border p-6 shadow-2xl space-y-4 animate-rise text-right">
              <div className="flex items-center justify-between pb-2 border-b">
                <div className="flex items-center gap-2">
                  <CreditCard className="size-5 text-primary" />
                  <h3 className="text-base font-bold text-foreground">
                    بوابة الدفع الإلكتروني المعتمدة
                  </h3>
                </div>
                <button onClick={() => setShowPayModal(false)} className="p-1 rounded-lg hover:bg-muted">
                  <X className="size-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    المبلغ المراد سداده (دينار أردني):
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5000}
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="h-10 w-full rounded-xl border bg-background px-3 font-mono font-bold text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setPayAmount(summary.currentBalance)}
                      className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground hover:text-foreground text-[10px] font-bold"
                    >
                      كامل الرصيد المستحق ({summary.currentBalance} د.أ)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayAmount(100)}
                      className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground hover:text-foreground text-[10px] font-bold"
                    >
                      100 د.أ
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayAmount(200)}
                      className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground hover:text-foreground text-[10px] font-bold"
                    >
                      200 د.أ
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    طريقة الدفع المعتمدة:
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-10 w-full rounded-xl border bg-background px-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="بطاقة ائتمانية (Visa / MasterCard)">
                      بطاقة ائتمانية (Visa / MasterCard)
                    </option>
                    <option value="إي فواتيركم (eFAWATEERcom)">إي فواتيركم (eFAWATEERcom)</option>
                    <option value="خدمة كليك الفورية (CliQ)">خدمة كليك الفورية (CliQ)</option>
                    <option value="حوالة بنكية مباشرة">حوالة بنكية مباشرة</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-muted/40 text-[11px] text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>المبلغ المراد خصمه:</span>
                  <span className="font-mono font-bold text-foreground">{payAmount.toFixed(2)} د.أ</span>
                </div>
                <div className="flex justify-between">
                  <span>الرصيد المتبقي بعد السداد:</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {Math.max(0, summary.currentBalance - payAmount).toFixed(2)} د.أ
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t">
                <button
                  onClick={handleSimulatePayment}
                  disabled={loading || payAmount <= 0}
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition disabled:opacity-40"
                >
                  {loading ? "جاري المعالجة..." : "تأكيد الدفع الإلكتروني"}
                </button>
                <button
                  onClick={() => setShowPayModal(false)}
                  className="py-2.5 px-4 rounded-xl border hover:bg-muted font-bold text-xs transition"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

