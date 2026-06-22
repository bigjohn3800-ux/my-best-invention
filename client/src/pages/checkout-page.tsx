import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, ShieldCheck } from "lucide-react";

const TOSS_SDK = "https://js.tosspayments.com/v2/standard";

function loadTossSdk(): Promise<any> {
  return new Promise((resolve, reject) => {
    const w = window as any;
    if (w.TossPayments) return resolve(w.TossPayments);
    const existing = document.querySelector(`script[src="${TOSS_SDK}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve((window as any).TossPayments));
      existing.addEventListener("error", reject);
      return;
    }
    const s = document.createElement("script");
    s.src = TOSS_SDK;
    s.onload = () => resolve((window as any).TossPayments);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export default function CheckoutPage() {
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [order, setOrder] = useState<{ orderId: string; orderName: string; amount: number; customerName: string } | null>(null);
  const widgetsRef = useRef<any>(null);
  const startedRef = useRef(false);

  const planCode = new URLSearchParams(window.location.search).get("plan") || "pro_monthly";

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate(`/auth?next=${encodeURIComponent(`/checkout?plan=${planCode}`)}`);
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      try {
        const cfgRes = await apiRequest("GET", "/api/billing/config");
        const { clientKey } = await cfgRes.json();
        const orderRes = await apiRequest("POST", "/api/billing/orders", { planCode });
        const o = await orderRes.json();
        setOrder(o);

        const TossPayments = await loadTossSdk();
        const toss = TossPayments(clientKey);
        const widgets = toss.widgets({ customerKey: o.customerKey || "ANONYMOUS" });
        widgetsRef.current = widgets;
        await widgets.setAmount({ currency: "KRW", value: o.amount });
        await widgets.renderPaymentMethods({ selector: "#payment-method", variantKey: "DEFAULT" });
        await widgets.renderAgreement({ selector: "#agreement", variantKey: "AGREEMENT" });
        setStatus("ready");
      } catch (e: any) {
        setErrorMsg(e?.message || "결제 준비 중 오류가 발생했습니다.");
        setStatus("error");
      }
    })();
  }, [authLoading, user, planCode, navigate]);

  async function handlePay() {
    if (!widgetsRef.current || !order) return;
    try {
      await widgetsRef.current.requestPayment({
        orderId: order.orderId,
        orderName: order.orderName,
        customerName: order.customerName,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (e: any) {
      setErrorMsg(e?.message || "결제 요청에 실패했습니다.");
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="px-4 pt-28 pb-20 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/35 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-200">
          <ShieldCheck className="w-3.5 h-3.5" /> 안전 결제 · Toss Payments
        </div>
        <h1 className="mt-5 text-3xl sm:text-4xl font-bold text-white">결제하기</h1>

        {order && (
          <div className="glass-card rounded-2xl p-5 mt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-cyan-300 font-semibold">선택한 상품</p>
              <p className="text-lg font-bold text-white mt-1">{order.orderName}</p>
            </div>
            <p className="text-2xl font-bold text-white">{order.amount.toLocaleString()}원</p>
          </div>
        )}

        {status === "loading" && (
          <div className="flex items-center gap-2 text-muted-foreground mt-10">
            <Loader2 className="w-5 h-5 animate-spin" /> 결제 수단을 불러오는 중...
          </div>
        )}

        {status === "error" && (
          <div className="glass-card rounded-2xl p-6 mt-8 border border-rose-400/40">
            <p className="text-rose-300 font-semibold">결제를 준비하지 못했습니다.</p>
            <p className="text-sm text-muted-foreground mt-2">{errorMsg}</p>
            <Button className="mt-4 bg-white/10 text-white hover:bg-white/15" onClick={() => navigate("/pricing")}>요금제로 돌아가기</Button>
          </div>
        )}

        <div className={status === "ready" ? "mt-8" : "hidden"}>
          <div id="payment-method" className="bg-white rounded-2xl overflow-hidden" />
          <div id="agreement" className="mt-4" />
          <Button className="mt-6 w-full gradient-primary text-white text-lg py-6" onClick={handlePay}>
            {order ? `${order.amount.toLocaleString()}원 결제하기` : "결제하기"}
          </Button>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            테스트 결제 환경입니다. 실제 카드 승인 심사 완료 후 실키로 전환됩니다.
          </p>
        </div>
      </main>
    </div>
  );
}
