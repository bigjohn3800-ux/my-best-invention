import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Lightbulb, Rocket, FileText, ChevronLeft, ChevronRight, GraduationCap } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";

const STORAGE_KEY_BASE = "mb_onboarded_v1";

const LEVELS = [
  { value: "elementary", label: "초등학생", emoji: "🧒" },
  { value: "middle", label: "중학생", emoji: "📚" },
  { value: "high", label: "고등학생", emoji: "🎓" },
  { value: "university", label: "대학생", emoji: "🏫" },
  { value: "general", label: "일반/성인", emoji: "💼" },
];

export default function OnboardingModal() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState<string>("middle");
  const [dontShow, setDontShow] = useState(true);

  const storageKey = user ? `${STORAGE_KEY_BASE}:${(user as any).id}` : STORAGE_KEY_BASE;

  useEffect(() => {
    if (!user) return;
    const seen = typeof window !== "undefined" && window.localStorage.getItem(storageKey);
    if (!seen) {
      setLevel((user as any).level || "middle");
      setOpen(true);
    }
  }, [user, storageKey]);

  const finish = async () => {
    if (level && (user as any)?.level !== level) {
      try {
        await apiRequest("PATCH", "/api/user/level", { level });
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      } catch {}
    }
    if (dontShow && typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, "1");
    }
    setOpen(false);
  };

  const dismiss = () => setOpen(false);

  const next = () => setStep(s => Math.min(2, s + 1));
  const prev = () => setStep(s => Math.max(0, s - 1));

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss(); }}>
      <DialogContent className="bg-gray-900 border-white/10 text-white max-w-lg" data-testid="modal-onboarding">
        <div className="absolute top-4 right-4 flex gap-1">
          {[0, 1, 2].map(i => (
            <span key={i} className={`h-1.5 w-6 rounded-full ${step === i ? "bg-cyan-400" : "bg-white/10"}`} />
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-5 mt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center neon-glow">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">환영합니다 👋</h2>
                <p className="text-sm text-gray-400">먼저 학습자 수준을 알려주세요</p>
              </div>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              선택하신 수준에 맞춰 AI 도구의 설명 난이도와 보고서 양식이 자동으로 조정됩니다.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {LEVELS.map(l => (
                <button
                  key={l.value}
                  onClick={() => setLevel(l.value)}
                  className={`p-3 rounded-xl border transition-all text-left ${level === l.value ? "border-cyan-500 bg-cyan-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                  data-testid={`button-onboard-level-${l.value}`}
                >
                  <div className="text-2xl mb-1">{l.emoji}</div>
                  <div className="text-sm font-medium text-white">{l.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5 mt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-cyan-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">AI 도구 둘러보기</h2>
                <p className="text-sm text-gray-400">두 가지 트랙으로 시작합니다</p>
              </div>
            </div>
            <div className="space-y-3">
              <Link href="/invention-studio">
                <div className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer transition-all" data-testid="link-onboard-invention">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/15 flex items-center justify-center">
                      <Lightbulb className="w-5 h-5 text-yellow-300" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">AI 발명 스튜디오</p>
                      <p className="text-xs text-gray-400 mt-0.5">SCAMPER · TRIZ · 특허 명세서 초안</p>
                    </div>
                  </div>
                </div>
              </Link>
              <Link href="/startup-lab">
                <div className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer transition-all" data-testid="link-onboard-startup">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center">
                      <Rocket className="w-5 h-5 text-purple-300" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">AI 창업 랩</p>
                      <p className="text-xs text-gray-400 mt-0.5">BMC 9칸 작성 · IR 피칭덱 자동 생성</p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 mt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
                <FileText className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">보고서로 마무리</h2>
                <p className="text-sm text-gray-400">학습 결과를 한 번에 정리</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex gap-2 p-2.5 rounded-lg bg-white/5"><span className="text-cyan-300">•</span> <strong>중학교 자유학기</strong> 활동지 (4섹션 자동 작성)</li>
              <li className="flex gap-2 p-2.5 rounded-lg bg-white/5"><span className="text-cyan-300">•</span> <strong>고등학교 학생부</strong> 500/1500자 보고서</li>
              <li className="flex gap-2 p-2.5 rounded-lg bg-white/5"><span className="text-cyan-300">•</span> <strong>K-Startup 사업계획서</strong> 양식</li>
              <li className="flex gap-2 p-2.5 rounded-lg bg-white/5"><span className="text-cyan-300">•</span> <strong>발명·창업 대회</strong> 출품 보고서</li>
            </ul>
            <p className="text-xs text-gray-400 leading-relaxed bg-yellow-500/5 border border-yellow-500/15 rounded-lg p-3">
              💡 모든 AI 결과물은 학습용 초안입니다. 마지막엔 본인이 직접 검토·수정해서 제출해주세요.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
            <input type="checkbox" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} className="accent-cyan-500" data-testid="input-onboard-dontshow" />
            다시 보지 않기
          </label>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="ghost" size="sm" onClick={prev} className="text-gray-300" data-testid="button-onboard-prev">
                <ChevronLeft className="w-4 h-4 mr-1" /> 이전
              </Button>
            )}
            {step < 2 ? (
              <Button size="sm" onClick={next} className="gradient-primary text-white" data-testid="button-onboard-next">
                다음 <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button size="sm" onClick={finish} className="gradient-primary text-white" data-testid="button-onboard-finish">
                시작하기
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
