import { useState, useEffect, useRef } from "react";
import { ToastAction } from "@/components/ui/toast";
import { useAuth } from "@/hooks/use-auth";
import { Link, useSearch } from "wouter";
import Navbar from "@/components/navbar";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, ChevronRight, Loader2, Brain, Rocket, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useSSEStream } from "@/hooks/use-sse-stream";
import { useGuestLimitModal } from "@/hooks/use-guest-limit-modal";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import GuestSignupModal from "@/components/guest-signup-modal";
import AiLiveRegion from "@/components/ai-live-region";
import confetti from "canvas-confetti";

const CREATIVITY_QUESTIONS = [
  { domain: "fluency", text: "주어진 주제에 대해 다양한 아이디어를 빠르게 떠올릴 수 있다.", kid: "어떤 주제를 들으면 아이디어가 술술 떠올라요." },
  { domain: "fluency", text: "브레인스토밍할 때 다른 사람보다 많은 아이디어를 낸다.", kid: "친구들과 같이 생각할 때 내가 생각을 더 많이 내요." },
  { domain: "flexibility", text: "문제를 여러 가지 다른 관점에서 바라볼 수 있다.", kid: "한 가지 일을 여러 방향에서 바라볼 수 있어요." },
  { domain: "flexibility", text: "익숙한 방법이 안 통할 때 새로운 방법을 쉽게 찾는다.", kid: "늘 하던 방법이 안 되면 다른 방법을 잘 찾아요." },
  { domain: "originality", text: "다른 사람이 생각하지 못한 독특한 아이디어를 자주 낸다.", kid: "친구들이 생각 못 한 아이디어를 자주 떠올려요." },
  { domain: "originality", text: "평범한 것을 특별하게 만드는 방법을 잘 안다.", kid: "평범한 물건을 특별하게 바꾸는 걸 잘해요." },
  { domain: "elaboration", text: "아이디어를 구체적으로 발전시키는 것을 잘한다.", kid: "떠오른 아이디어를 자세하게 키워가는 걸 잘해요." },
  { domain: "elaboration", text: "세부 사항을 꼼꼼하게 다듬어 완성도를 높인다.", kid: "작은 부분까지 꼼꼼하게 챙겨요." },
  { domain: "openness", text: "새로운 경험이나 도전을 즐긴다.", kid: "처음 해보는 일이나 도전을 즐겨요." },
  { domain: "openness", text: "남들과 다른 생각을 하는 것이 두렵지 않다.", kid: "친구들과 생각이 달라도 괜찮아요." },
];

const STARTUP_QUESTIONS = [
  { domain: "feasibility", text: "아이디어를 실제 제품/서비스로 만들 수 있는 방법을 잘 안다.", kid: "내 아이디어를 진짜 만들 수 있는 방법을 떠올려요." },
  { domain: "feasibility", text: "필요한 기술이나 자원을 파악하고 조달할 수 있다.", kid: "필요한 도구나 재료가 무엇인지 잘 알아요." },
  { domain: "profitability", text: "사람들이 기꺼이 돈을 낼 만한 서비스를 구상할 수 있다.", kid: "사람들이 \"사고 싶다!\"라고 할 만한 걸 떠올려요." },
  { domain: "profitability", text: "비용과 수익 구조를 합리적으로 설계할 수 있다.", kid: "얼마에 만들고 얼마에 팔지 잘 정할 수 있어요." },
  { domain: "growth", text: "작게 시작해서 점차 키워나가는 전략을 세울 수 있다.", kid: "작은 것부터 시작해서 크게 키울 계획을 세워요." },
  { domain: "growth", text: "시장의 트렌드를 파악하고 성장 기회를 포착할 수 있다.", kid: "요즘 어떤 게 인기 있는지 잘 알아채요." },
  { domain: "marketability", text: "목표 고객이 누구인지 명확하게 정의할 수 있다.", kid: "누가 내 물건을 좋아할지 잘 알아요." },
  { domain: "marketability", text: "고객의 니즈를 파악하고 그에 맞는 가치를 제안할 수 있다.", kid: "사람들이 뭘 원하는지 잘 알아채요." },
  { domain: "innovation", text: "기존 시장에 없는 새로운 방식을 제안할 수 있다.", kid: "지금까지 없던 새로운 방법을 잘 생각해요." },
  { domain: "innovation", text: "경쟁자와 차별화되는 핵심 강점을 만들 수 있다.", kid: "내 것만의 특별한 점을 만들 수 있어요." },
];

const CREATIVITY_DOMAINS = {
  fluency: "유창성",
  flexibility: "융통성",
  originality: "독창성",
  elaboration: "정교성",
  openness: "개방성",
};

const STARTUP_DOMAINS = {
  feasibility: "실현가능성",
  profitability: "수익성",
  growth: "성장성",
  marketability: "시장성",
  innovation: "혁신성",
};

// Map any incoming level value (URL query, saved user.level, legacy seed values)
// to the audience values our AI prompts and kid-mode UI expect.
const VALID_AUDIENCES = new Set(["elementary", "middle", "high", "university", "general"]);
const normalizeLevel = (l?: string | null): string => {
  if (!l) return "high";
  if (l === "beginner") return "elementary";
  if (l === "intermediate") return "high";
  if (l === "advanced") return "university";
  return VALID_AUDIENCES.has(l) ? l : "high";
};

const LEVEL_OPTIONS = [
  { value: "elementary", label: "초등학생" },
  { value: "high", label: "중·고등학생" },
  { value: "university", label: "대학·일반" },
];

const ANSWER_OPTIONS = [
  { value: 1, label: "전혀 아니다", kid: "😞 전혀 안 그래요" },
  { value: 2, label: "아니다", kid: "🙁 잘 안 그래요" },
  { value: 3, label: "보통", kid: "😐 보통이에요" },
  { value: 4, label: "그렇다", kid: "🙂 그래요" },
  { value: 5, label: "매우 그렇다", kid: "😍 정말 그래요" },
];

export default function DiagnosisPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [testType, setTestType] = useState<"creativity" | "startup" | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [scores, setScores] = useState<Record<string, number> | null>(null);
  const searchString = useSearch();
  const urlLevel = new URLSearchParams(searchString).get("level");
  const [level, setLevel] = useState(normalizeLevel(urlLevel || user?.level));
  const [saving, setSaving] = useState(false);
  const analysisStream = useSSEStream();
  const lastAiActionRef = useRef<(() => void) | null>(null);
  const { showSignupModal, setShowSignupModal } = useGuestLimitModal([analysisStream.sseError]);

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const typeParam = params.get("type");
    if (typeParam === "creativity" || typeParam === "startup") {
      setTestType(typeParam);
      setAnswers([]);
      setCurrentQ(0);
      setScores(null);
    }
    const levelParam = params.get("level");
    if (levelParam) setLevel(normalizeLevel(levelParam));
  }, [searchString]);

  // When the user logs in (or their saved default level loads), adopt their
  // saved level — but never override an explicit ?level= URL param.
  useEffect(() => {
    if (user?.level && !urlLevel) setLevel(normalizeLevel(user.level));
  }, [user?.level]);

  useEffect(() => {
    if (analysisStream.sseError?.type === "GUEST_LIMIT_REACHED") {
      setShowSignupModal(true);
    }
    if (analysisStream.sseError?.type === "GENERAL") {
      const retry = lastAiActionRef.current;
      toast({
        title: "AI 응답 오류",
        description: analysisStream.sseError.message,
        variant: "destructive",
        action: retry ? (
          <ToastAction altText="다시 시도" onClick={() => retry()} data-testid="button-toast-retry">
            다시 시도
          </ToastAction>
        ) : undefined,
      });
      analysisStream.clearError();
    }
  }, [analysisStream.sseError]);

  const questions = testType === "creativity" ? CREATIVITY_QUESTIONS : STARTUP_QUESTIONS;
  const domains = testType === "creativity" ? CREATIVITY_DOMAINS : STARTUP_DOMAINS;

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQ] = value;
    setAnswers(newAnswers);

    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      calculateScores(newAnswers);
    }
  };

  const calculateScores = (ans: number[]) => {
    const domainScores: Record<string, number[]> = {};
    questions.forEach((q, i) => {
      if (!domainScores[q.domain]) domainScores[q.domain] = [];
      domainScores[q.domain].push(ans[i] || 0);
    });
    const result: Record<string, number> = {};
    for (const [key, vals] of Object.entries(domainScores)) {
      result[key] = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 2);
    }
    setScores(result);

    if (user) {
      const runAnalysis = () => {
        analysisStream.startStream("/api/ai/diagnostic-analysis", {
          type: testType,
          scores: result,
          level,
        });
      };
      lastAiActionRef.current = runAnalysis;
      runAnalysis();
      saveResult(ans, result);
    }
  };

  const saveResult = async (ans: number[], scr: Record<string, number>) => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await apiRequest("POST", "/api/diagnostic-results", {
        type: testType,
        answers: ans,
        scores: scr,
      });
      const data = await res.json();
      if (data.newBadge) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        toast({ title: `🏆 배지 획득: ${data.newBadge.name}`, description: "대시보드에서 배지를 확인하세요!" });
        queryClient.invalidateQueries({ queryKey: ["/api/user/badges"] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    } catch {}
    setSaving(false);
  };

  const radarData = scores
    ? Object.entries(domains).map(([key, label]) => ({
        domain: label,
        score: scores[key] || 0,
        fullMark: 10,
      }))
    : [];

  const resetTest = () => {
    setTestType(null);
    setAnswers([]);
    setCurrentQ(0);
    setScores(null);
    if (window.location.search) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  };

  const isKid = level === "elementary";

  return (
    <div className="min-h-screen" data-testid={isKid ? "kid-mode-active" : undefined}>
      <Navbar />
      <div className={`max-w-4xl mx-auto px-4 pt-24 pb-20 ${isKid ? "kid-mode" : ""}`}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white" data-testid="text-diagnosis-title">
                {isKid ? "🧒 나의 창의성 알아보기" : "진단 솔루션"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isKid ? "10개의 질문에 답하면 내가 어떤 점이 강한지 알려줘요!" : "창의성 · 창업 역량 진단 + AI 분석"}
              </p>
            </div>
          </div>

          {isKid && (
            <div className="kid-banner mb-6" data-testid="banner-kid-mode">
              <span className="text-2xl">🌟</span>
              <span>지금은 <strong>초등학생 모드</strong>예요! 글씨가 더 크고, 문장이 쉬워요.</span>
            </div>
          )}

          {!testType && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {LEVEL_OPTIONS.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => setLevel(l.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${level === l.value ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-gray-400 bg-white/5"}`}
                    data-testid={`button-level-${l.value}`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <button
                  onClick={() => { setTestType("creativity"); setAnswers([]); setCurrentQ(0); setScores(null); }}
                  className="glass-card glass-card-hover rounded-2xl p-8 text-left transition-all group"
                  data-testid="button-test-creativity"
                >
                  <div className="w-14 h-14 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
                    <Brain className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {isKid ? "🧠 창의성 진단" : "창의성 진단"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {isKid
                      ? "내가 얼마나 새로운 생각을 잘 떠올리는지 알아봐요. 5가지 힘을 점수로 보여줘요!"
                      : "유창성, 융통성, 독창성, 정교성, 개방성 5개 영역 진단"}
                  </p>
                  <span className="text-cyan-400 text-sm font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    시작하기 <ChevronRight className="w-4 h-4" />
                  </span>
                </button>

                <button
                  onClick={() => { setTestType("startup"); setAnswers([]); setCurrentQ(0); setScores(null); }}
                  className="glass-card glass-card-hover rounded-2xl p-8 text-left transition-all group"
                  data-testid="button-test-startup"
                >
                  <div className="w-14 h-14 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
                    <Rocket className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {isKid ? "🚀 창업 지수 진단" : "창업 지수 진단"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {isKid
                      ? "내 아이디어를 진짜로 만들 수 있는 힘이 얼마나 있는지 알아봐요!"
                      : "실현가능성, 수익성, 성장성, 시장성, 혁신성 5개 영역 진단"}
                  </p>
                  <span className="text-purple-400 text-sm font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    시작하기 <ChevronRight className="w-4 h-4" />
                  </span>
                </button>
              </div>

              {!user && (
                <div className="glass-card rounded-xl p-4 flex items-center gap-3 border border-yellow-500/20">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <p className="text-sm text-yellow-300">
                    로그인하면 AI 맞춤 분석과 결과 저장이 가능합니다.{" "}
                    <Link href="/auth" className="underline">로그인하기</Link>
                  </p>
                </div>
              )}
            </div>
          )}

          {testType && !scores && (
            <div className="glass-card rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">
                  {testType === "creativity" ? "창의성" : "창업 지수"} 진단
                </h2>
                <span className="text-sm text-muted-foreground">{currentQ + 1} / {questions.length}</span>
              </div>

              <div className="w-full bg-white/5 rounded-full h-1.5 mb-8">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${testType === "creativity" ? "bg-cyan-500" : "bg-purple-500"}`}
                  style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
                />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQ}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-white text-lg mb-8" data-testid={`text-question-${currentQ}`}>
                    {isKid ? questions[currentQ].kid : questions[currentQ].text}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    {ANSWER_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleAnswer(opt.value)}
                        className={`flex-1 py-4 px-4 rounded-xl border transition-all text-sm font-medium ${
                          answers[currentQ] === opt.value
                            ? testType === "creativity" ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300" : "border-purple-500/50 bg-purple-500/10 text-purple-300"
                            : "border-white/10 bg-white/[0.02] text-gray-400 hover:bg-white/5 hover:text-white"
                        }`}
                        data-testid={`button-answer-${opt.value}`}
                      >
                        {isKid ? opt.kid : opt.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={() => currentQ > 0 ? setCurrentQ(currentQ - 1) : resetTest()}
                  className="border-white/10 text-gray-400"
                  data-testid="button-prev-question"
                >
                  {currentQ > 0 ? "이전 질문" : "돌아가기"}
                </Button>
              </div>
            </div>
          )}

          {scores && (
            <div className="space-y-6">
              <div className="glass-card rounded-2xl p-8">
                <h2 className="text-xl font-bold text-white mb-6" data-testid="text-result-title">
                  {testType === "creativity" ? "창의성" : "창업 지수"} 진단 결과
                </h2>

                <div className="flex justify-center mb-8" data-testid="chart-radar">
                  <ResponsiveContainer width="100%" height={350}>
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="domain" tick={{ fill: "#94a3b8", fontSize: 13 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fill: "#64748b", fontSize: 10 }} />
                      <Radar
                        name="점수"
                        dataKey="score"
                        stroke={testType === "creativity" ? "#00D1FF" : "#7000FF"}
                        fill={testType === "creativity" ? "#00D1FF" : "#7000FF"}
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {Object.entries(domains).map(([key, label]) => (
                    <div key={key} className="text-center p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                      <p className="text-xs text-muted-foreground mb-1">{label}</p>
                      <p className={`text-2xl font-bold ${testType === "creativity" ? "text-cyan-400" : "text-purple-400"}`}>
                        {scores[key]}
                      </p>
                      <p className="text-[10px] text-muted-foreground">/10점</p>
                    </div>
                  ))}
                </div>
              </div>

              <AiLiveRegion
                streaming={analysisStream.streaming}
                content={analysisStream.streamContent}
                label="AI 맞춤 분석"
                testId="live-diagnosis"
              />

              {(analysisStream.streaming || analysisStream.streamContent) && (
                <div className="glass-card rounded-2xl p-8">
                  <div className="flex items-center gap-2 mb-4">
                    {analysisStream.streaming && <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />}
                    <h3 className="text-lg font-bold text-white">AI 맞춤 분석</h3>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none" data-testid="text-ai-analysis">
                    <ReactMarkdown>{analysisStream.streamContent}</ReactMarkdown>
                  </div>
                </div>
              )}

              <div className="flex justify-center">
                <Button onClick={resetTest} variant="outline" className="border-white/10 text-gray-400" data-testid="button-restart-test">
                  {isKid ? "🔄 다른 진단 해보기" : "다른 진단 하기"}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
      <GuestSignupModal open={showSignupModal} onOpenChange={setShowSignupModal} />
    </div>
  );
}
