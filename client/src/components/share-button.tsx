import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Share2, Loader2, Check } from "lucide-react";

export interface ShareHighlight { label: string; value: string }

interface Props {
  type: "invention" | "canvas" | "diagnosis";
  refId?: number;
  title: string;
  summary?: string;
  payload?: { highlights?: ShareHighlight[]; body?: string };
  size?: "sm" | "default";
  className?: string;
}

export default function ShareButton({ type, refId, title, summary, payload, size = "sm", className }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleShare() {
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/shares", { type, refId, title, summary, payload });
      const { url } = await res.json();
      let shared = false;
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        try {
          await (navigator as any).share({
            title: `${title} · 마이베스트 발명창업`,
            text: summary || "AI로 만든 발명·창업 결과물을 확인해보세요",
            url,
          });
          shared = true;
        } catch { /* 사용자가 취소 */ }
      }
      if (!shared) {
        try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
        toast({ title: "공유 링크 복사 완료 🎉", description: "카카오톡·인스타에 붙여넣어 자랑해보세요!" });
      }
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch (e: any) {
      toast({
        title: "공유에 실패했어요",
        description: e?.message?.replace(/^\d+:\s*/, "") || "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size={size}
      variant="outline"
      onClick={handleShare}
      disabled={loading}
      className={className || "border-amber-500/30 text-amber-300 hover:bg-amber-500/10 text-xs"}
      data-testid={`button-share-${type}-${refId ?? "x"}`}
    >
      {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : done ? <Check className="w-3 h-3 mr-1" /> : <Share2 className="w-3 h-3 mr-1" />}
      {done ? "복사됨" : "자랑하기"}
    </Button>
  );
}
