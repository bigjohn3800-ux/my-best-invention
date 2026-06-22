import { useEffect, useRef, useState } from "react";
import { useLocation, Link } from "wouter";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export default function PaymentSuccessPage() {
  const [, navigate] = useLocation();
  const [state, setState] = useState<"confirming" | "done" | "error">("confirming");
  const [msg, setMsg] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const q = new URLSearchParams(window.location.search);
    const paymentKey = q.get("paymentKey");
    const orderId = q.get("orderId");
    const amount = Number(q.get("amount") || 0);
    if (!paymentKey || !orderId || !amount) {
      setState("error"); setMsg("결제 정보가 올바르지 않습니다.");
      return;
    }
    (async () => {
      try {
        const res = await apiRequest("POST", "/api/billing/confirm", { paymentKey, orderId, amount });
        await res.json();
        queryClient.invalidateQueries({ queryKey: ["/api/billing/subscription"] });
        setState("done");
      } catch (e: any) {
        setState("error");
        setMsg(e?.message?.replace(/^\d+:\s*/, "") || "결제 승인에 실패했습니다.");
      }
    })();
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="px-4 pt-32 pb-20 max-w-xl mx-auto text-center">
        {state === "confirming" && (
          <div className="flex flex-col items-center gap-3 text-white">
            <Loader2 className="w-10 h-10 animate-spin text-cyan-300" />
            <p className="text-lg">결제를 승인하는 중입니다...</p>
          </div>
        )}
        {state === "done" && (
          <div className="glass-card rounded-2xl p-10">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
            <h1 className="mt-5 text-2xl font-bold text-white">결제가 완료되었습니다 🎉</h1>
            <p className="mt-3 text-muted-foreground">이제 Pro 기능을 모두 이용하실 수 있습니다.</p>
            <div className="mt-7 flex gap-3 justify-center">
              <Link href="/dashboard"><Button className="gradient-primary text-white">대시보드로 가기</Button></Link>
              <Link href="/invention-studio"><Button className="bg-white/10 text-white hover:bg-white/15">AI 발명도구 시작</Button></Link>
            </div>
          </div>
        )}
        {state === "error" && (
          <div className="glass-card rounded-2xl p-10 border border-rose-400/40">
            <XCircle className="w-16 h-16 text-rose-400 mx-auto" />
            <h1 className="mt-5 text-2xl font-bold text-white">결제 승인 실패</h1>
            <p className="mt-3 text-muted-foreground">{msg}</p>
            <Button className="mt-7 gradient-primary text-white" onClick={() => navigate("/pricing")}>요금제로 돌아가기</Button>
          </div>
        )}
      </main>
    </div>
  );
}
