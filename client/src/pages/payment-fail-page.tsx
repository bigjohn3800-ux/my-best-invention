import { useLocation } from "wouter";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function PaymentFailPage() {
  const [, navigate] = useLocation();
  const q = new URLSearchParams(window.location.search);
  const message = q.get("message") || "결제가 취소되었거나 실패했습니다.";
  const code = q.get("code");

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="px-4 pt-32 pb-20 max-w-xl mx-auto text-center">
        <div className="glass-card rounded-2xl p-10 border border-rose-400/40">
          <XCircle className="w-16 h-16 text-rose-400 mx-auto" />
          <h1 className="mt-5 text-2xl font-bold text-white">결제를 완료하지 못했습니다</h1>
          <p className="mt-3 text-muted-foreground">{message}</p>
          {code && <p className="mt-1 text-xs text-muted-foreground">오류 코드: {code}</p>}
          <div className="mt-7 flex gap-3 justify-center">
            <Button className="gradient-primary text-white" onClick={() => navigate("/pricing")}>다시 시도</Button>
            <Button className="bg-white/10 text-white hover:bg-white/15" onClick={() => navigate("/")}>홈으로</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
