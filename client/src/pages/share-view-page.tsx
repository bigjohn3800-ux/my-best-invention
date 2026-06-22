import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Lightbulb, Rocket, BarChart3, Loader2, Sparkles, ArrowRight } from "lucide-react";

interface Highlight { label: string; value: string }
interface SharePayload { highlights?: Highlight[]; body?: string }
interface ShareData {
  token: string; type: string; title: string; summary?: string | null;
  authorName?: string | null; viewCount: number; payload?: SharePayload | null;
  createdAt: string;
}

const typeMeta: Record<string, { label: string; icon: any; color: string; ring: string }> = {
  invention: { label: "AI 발명", icon: Lightbulb, color: "text-cyan-300", ring: "from-cyan-500/20" },
  canvas: { label: "AI 창업 (BMC)", icon: Rocket, color: "text-purple-300", ring: "from-purple-500/20" },
  diagnosis: { label: "역량 진단", icon: BarChart3, color: "text-emerald-300", ring: "from-emerald-500/20" },
};

export default function ShareViewPage() {
  const [, params] = useRoute("/share/:token");
  const token = params?.token;
  const [data, setData] = useState<ShareData | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    if (!token) return;
    fetch(`/api/shares/${token}`, { credentials: "include" })
      .then((r) => { if (!r.ok) throw new Error("not found"); return r.json(); })
      .then((d) => { setData(d); setState("ok"); })
      .catch(() => setState("error"));
  }, [token]);

  const meta = data ? (typeMeta[data.type] || typeMeta.invention) : typeMeta.invention;
  const Icon = meta.icon;

  return (
    <div className="min-h-screen grid-bg">
      <header className="px-4 py-4 flex items-center justify-between max-w-4xl mx-auto">
        <Link href="/">
          <span className="text-lg font-bold gradient-text cursor-pointer">마이베스트 발명창업</span>
        </Link>
        <Link href="/auth"><Button size="sm" className="gradient-primary text-white">무료로 시작</Button></Link>
      </header>

      <main className="px-4 pb-20 max-w-3xl mx-auto">
        {state === "loading" && (
          <div className="flex items-center gap-2 text-muted-foreground mt-20 justify-center">
            <Loader2 className="w-5 h-5 animate-spin" /> 불러오는 중...
          </div>
        )}

        {state === "error" && (
          <div className="glass-card rounded-2xl p-10 mt-16 text-center">
            <p className="text-white font-semibold text-lg">공유한 결과물을 찾을 수 없어요</p>
            <p className="text-muted-foreground mt-2 text-sm">링크가 만료되었거나 삭제되었을 수 있습니다.</p>
            <Link href="/"><Button className="mt-6 gradient-primary text-white">마이베스트 발명창업 둘러보기</Button></Link>
          </div>
        )}

        {state === "ok" && data && (
          <>
            <div className="glass-card rounded-3xl p-8 mt-8 relative overflow-hidden">
              <div className={`absolute -top-24 -right-20 w-72 h-72 rounded-full bg-gradient-to-br ${meta.ring} to-transparent blur-2xl`} />
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80">
                  <Icon className={`w-3.5 h-3.5 ${meta.color}`} /> {meta.label}
                </div>
                <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-white leading-snug">{data.title}</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {data.authorName ? `${data.authorName} 님의 결과물` : "마이베스트 발명창업"} · 조회 {data.viewCount.toLocaleString()}
                </p>
                {data.summary && <p className="mt-4 text-gray-200 leading-relaxed">{data.summary}</p>}

                {data.payload?.highlights && data.payload.highlights.length > 0 && (
                  <div className="mt-6 grid sm:grid-cols-2 gap-3">
                    {data.payload.highlights.map((h, i) => (
                      <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-4">
                        <p className={`text-xs font-semibold ${meta.color}`}>{h.label}</p>
                        <p className="mt-1 text-sm text-gray-100 whitespace-pre-wrap line-clamp-6">{h.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {data.payload?.body && (
                  <div className="mt-5 rounded-xl bg-white/5 border border-white/10 p-4 max-h-72 overflow-y-auto">
                    <p className="text-sm text-gray-100 whitespace-pre-wrap leading-relaxed">{data.payload.body}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 전환 CTA — 바이럴 루프 */}
            <div className="glass-card rounded-3xl p-8 mt-6 text-center">
              <Sparkles className="w-8 h-8 text-cyan-300 mx-auto" />
              <h2 className="mt-3 text-xl sm:text-2xl font-bold text-white">나도 AI로 발명·창업 결과물 만들기</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                SCAMPER·TRIZ 발명 도구, 비즈니스 모델 캔버스, 학교 제출용 보고서까지 — AI가 함께합니다. 가입 없이 바로 체험!
              </p>
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <Link href="/invention-studio">
                  <Button className="gradient-primary text-white">
                    무료로 만들어보기 <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <Link href="/"><Button variant="outline" className="border-white/20 text-white hover:bg-white/10">서비스 둘러보기</Button></Link>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
