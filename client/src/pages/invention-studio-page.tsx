import { useState, useEffect, useRef } from "react";
import { ToastAction } from "@/components/ui/toast";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/navbar";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, ChevronRight, ChevronLeft, Sparkles, FileText, Loader2, Check, Wand2, AlertCircle, Save, Edit3, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useSSEStream } from "@/hooks/use-sse-stream";
import { useGuestLimitModal } from "@/hooks/use-guest-limit-modal";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import GuestSignupModal from "@/components/guest-signup-modal";
import AiFollowUp from "@/components/ai-followup";
import FreeSemesterPdfButton from "@/components/freesemester-pdf-button";
import KidTtsButton from "@/components/kid-tts-button";
import AiLiveRegion from "@/components/ai-live-region";
import confetti from "canvas-confetti";
import {
  audienceFriendlyName,
  getRecommendedSummary,
  getReportMatch,
  recommendedRingClass,
  reportPriority,
  type ReportKey,
} from "@/lib/report-match";
import type { InventionProject } from "@shared/schema";

const LEVELS = [
  { value: "elementary", label: "초등학생", desc: "쉽고 재미있게", emoji: "🧒" },
  { value: "middle", label: "중학생", desc: "자유학기·진로탐색", emoji: "🎒" },
  { value: "high", label: "고등학생", desc: "학생부·대입 활용", emoji: "📚" },
  { value: "university", label: "대학생", desc: "캡스톤·연구실 IP", emoji: "🎓" },
  { value: "general", label: "일반·창업자", desc: "정부지원사업 실무", emoji: "💼" },
];

// Map legacy level values from existing user/project records to new audience values.
// Unknown values fall back to "high" so the UI always shows a valid selection.
const VALID_AUDIENCES = new Set(["elementary", "middle", "high", "university", "general"]);
const normalizeLevel = (l?: string | null): string => {
  if (!l) return "high";
  if (l === "beginner") return "elementary";
  if (l === "intermediate") return "middle";
  if (l === "advanced") return "university";
  return VALID_AUDIENCES.has(l) ? l : "high";
};

const SCAMPER_KEYS = ["substitute", "combine", "adapt", "modify", "putToOtherUse", "eliminate", "rearrange"] as const;
const SCAMPER_LABELS: Record<string, { label: string; question: string }> = {
  substitute: { label: "S - 대체하기", question: "다른 재료, 부품, 방법으로 대체할 수 있을까?" },
  combine: { label: "C - 결합하기", question: "다른 것과 결합하면 어떤 새로운 것이 만들어질까?" },
  adapt: { label: "A - 응용하기", question: "다른 분야의 아이디어를 응용할 수 있을까?" },
  modify: { label: "M - 수정/확대/축소", question: "크기, 모양, 색깔 등을 바꾸면 어떨까?" },
  putToOtherUse: { label: "P - 다른 용도", question: "다른 용도로 사용할 수 있을까?" },
  eliminate: { label: "E - 제거하기", question: "불필요한 부분을 제거하면 어떨까?" },
  rearrange: { label: "R - 재배열/역발상", question: "순서를 바꾸거나 반대로 하면 어떨까?" },
};

export default function InventionStudioPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const projectId = new URLSearchParams(searchString).get("projectId");

  const urlLevel = new URLSearchParams(searchString).get("level");
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState(normalizeLevel(urlLevel || user?.level));
  const [problem, setProblem] = useState("");
  const [title, setTitle] = useState("");
  const [solution, setSolution] = useState("");
  const [target, setTarget] = useState("");
  const [method, setMethod] = useState("");
  const [scamperNotes, setScamperNotes] = useState<Record<string, string>>({});
  const [trizContradiction, setTrizContradiction] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingLevel, setSavingLevel] = useState(false);
  const [generatingReport, setGeneratingReport] = useState<number | null>(null);
  const [generatingCompetition, setGeneratingCompetition] = useState(false);
  const [generatingFreeSemester, setGeneratingFreeSemester] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  const scamperStream = useSSEStream();
  const trizStream = useSSEStream();
  const patentStream = useSSEStream();
  const lastAiActionRef = useRef<(() => void) | null>(null);
  const { showSignupModal, setShowSignupModal } = useGuestLimitModal([
    scamperStream.sseError,
    trizStream.sseError,
    patentStream.sseError,
  ]);

  const { data: existingProject } = useQuery<InventionProject>({
    queryKey: ["/api/invention-projects", projectId],
    enabled: !!projectId && !!user,
  });

  useEffect(() => {
    if (existingProject && !loaded) {
      setTitle(existingProject.title);
      setProblem(existingProject.problem || "");
      setSolution(existingProject.solution || "");
      setTarget(existingProject.target || "");
      setMethod(existingProject.method || "");
      if (existingProject.scamperNotes) setScamperNotes(existingProject.scamperNotes as Record<string, string>);
      if (existingProject.trizNotes) trizStream.setStreamContent(existingProject.trizNotes);
      if (existingProject.patentDraft) patentStream.setStreamContent(existingProject.patentDraft);
      if (existingProject.level) setLevel(normalizeLevel(existingProject.level));
      setEditingId(existingProject.id);
      setLoaded(true);
      setStep(4);
    }
  }, [existingProject, loaded]);

  useEffect(() => {
    if (user?.level && !projectId && !urlLevel) setLevel(normalizeLevel(user.level));
  }, [user?.level]);

  useEffect(() => {
    if (scamperStream.sseError?.type === "GUEST_LIMIT_REACHED" ||
        trizStream.sseError?.type === "GUEST_LIMIT_REACHED" ||
        patentStream.sseError?.type === "GUEST_LIMIT_REACHED") {
      setShowSignupModal(true);
    }
    const generalErr =
      (scamperStream.sseError?.type === "GENERAL" && scamperStream.sseError) ||
      (trizStream.sseError?.type === "GENERAL" && trizStream.sseError) ||
      (patentStream.sseError?.type === "GENERAL" && patentStream.sseError);
    if (generalErr) {
      const retry = lastAiActionRef.current;
      toast({
        title: "AI 응답 오류",
        description: generalErr.message,
        variant: "destructive",
        action: retry ? (
          <ToastAction altText="다시 시도" onClick={() => retry()} data-testid="button-toast-retry">
            다시 시도
          </ToastAction>
        ) : undefined,
      });
      scamperStream.clearError();
      trizStream.clearError();
      patentStream.clearError();
    }
  }, [scamperStream.sseError, trizStream.sseError, patentStream.sseError]);

  const handleSaveDefaultLevel = async () => {
    if (!user) return;
    setSavingLevel(true);
    try {
      await apiRequest("PATCH", "/api/user/level", { level });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "기본 레벨이 저장되었습니다." });
    } catch {
      toast({ title: "레벨 저장 실패", variant: "destructive" });
    }
    setSavingLevel(false);
  };

  const steps = [
    { label: "수준 선택", icon: "1" },
    { label: "문제 정의", icon: "2" },
    { label: "SCAMPER", icon: "3" },
    { label: "TRIZ", icon: "4" },
    { label: "아이디어 정리", icon: "5" },
    { label: "특허 명세서", icon: "6" },
  ];

  const handleScamper = async () => {
    const body = { problem, level };
    const run = async () => {
      const result = await scamperStream.startStream("/api/ai/scamper", body);
      try {
        const cleaned = result.replace(/```json\s*/g, "").replace(/```\s*/g, "");
        const parsed = JSON.parse(cleaned);
        const notes: Record<string, string> = {};
        for (const key of SCAMPER_KEYS) {
          if (parsed[key]) {
            notes[key] = `${parsed[key].idea}\n${parsed[key].detail}`;
          }
        }
        setScamperNotes(notes);
      } catch {}
    };
    lastAiActionRef.current = run;
    await run();
  };

  const handleTriz = async () => {
    const body = { problem, contradiction: trizContradiction, level };
    const run = () => trizStream.startStream("/api/ai/triz", body);
    lastAiActionRef.current = () => { run(); };
    await run();
  };

  const handlePatent = async () => {
    const body = { title, problem, solution, target, method, level };
    const run = () => patentStream.startStream("/api/ai/patent-draft", body);
    lastAiActionRef.current = () => { run(); };
    await run();
  };

  const handleSave = async () => {
    if (!user) { setShowSignupModal(true); return; }
    setSaving(true);
    try {
      const body = {
        title: title || "무제",
        problem,
        solution,
        target,
        method,
        scamperNotes,
        trizNotes: trizStream.streamContent,
        patentDraft: patentStream.streamContent,
        level,
        status: patentStream.streamContent ? "complete" : "draft",
      };

      const res = editingId
        ? await apiRequest("PATCH", `/api/invention-projects/${editingId}`, body)
        : await apiRequest("POST", "/api/invention-projects", body);
      const data = await res.json();

      if (!editingId && data.id) {
        setEditingId(data.id);
      }

      if (data.newBadge) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        toast({ title: `🏆 배지 획득: ${data.newBadge.name}`, description: "대시보드에서 배지를 확인하세요!" });
        queryClient.invalidateQueries({ queryKey: ["/api/user/badges"] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invention-projects"] });
      toast({ title: editingId ? "프로젝트가 수정되었습니다." : "프로젝트가 저장되었습니다." });
    } catch {
      toast({ title: "저장 실패", variant: "destructive" });
    }
    setSaving(false);
  };

  const isKid = level === "elementary";

  return (
    <div className="min-h-screen" data-testid={isKid ? "kid-mode-active" : undefined}>
      <Navbar />
      <div className={`max-w-5xl mx-auto px-4 pt-24 pb-20 ${isKid ? "kid-mode" : ""}`}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center neon-glow">
              <Lightbulb className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white" data-testid="text-studio-title">
                {isKid ? "🧒 어린이 발명 놀이터" : "AI 발명 스튜디오"}
                {editingId && <span className="ml-2 text-sm font-normal text-cyan-400">(수정 모드)</span>}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isKid ? "AI 친구와 함께 6단계로 발명을 완성해요!" : "SCAMPER · TRIZ · 특허 명세서 자동 생성"}
              </p>
            </div>
          </div>

          {isKid && (
            <div className="kid-banner mb-6" data-testid="banner-kid-mode">
              <span className="text-2xl">🌟</span>
              <span>지금은 <strong>초등학생 모드</strong>예요! 글씨가 더 크고, 한 단계씩 천천히 따라가면 돼요.</span>
            </div>
          )}

          <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => i <= step ? setStep(i) : null}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    i === step ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" :
                    i < step ? "text-cyan-400/60 bg-white/5" :
                    "text-gray-500 bg-white/[0.02]"
                  }`}
                  data-testid={`button-step-${i}`}
                >
                  {i < step ? <Check className="w-3.5 h-3.5" /> : <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">{s.icon}</span>}
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < steps.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>

              {step === 0 && (
                <div className="glass-card rounded-2xl p-8">
                  <div className="flex items-start gap-2 mb-2">
                    <h2 className="text-xl font-bold text-white">
                      {isKid ? "👇 내 학년을 골라봐요" : "수준을 선택해주세요"}
                    </h2>
                    {isKid && (
                      <KidTtsButton
                        text="내 학년을 골라봐요. AI 친구가 내 눈높이에 맞춰서 쉽게 알려줄 거예요."
                        testId="button-tts-step-0"
                      />
                    )}
                  </div>
                  <p className="text-muted-foreground mb-6">
                    {isKid ? "AI 친구가 내 눈높이에 맞춰서 쉽게 알려줄 거예요." : "AI가 선택한 수준에 맞게 답변합니다."}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {LEVELS.map((l) => (
                      <button
                        key={l.value}
                        onClick={() => setLevel(l.value)}
                        className={`p-4 rounded-xl border transition-all text-left ${
                          level === l.value
                            ? "border-cyan-500/50 bg-cyan-500/10"
                            : "border-white/10 bg-white/[0.02] hover:bg-white/5"
                        }`}
                        data-testid={`button-level-${l.value}`}
                      >
                        <div className="text-2xl mb-2">{l.emoji}</div>
                        <p className="font-semibold text-white mb-1 text-sm">{l.label}</p>
                        <p className="text-xs text-muted-foreground">{l.desc}</p>
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-6">
                    <div>
                      {user && level !== user.level && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSaveDefaultLevel}
                          disabled={savingLevel}
                          className="border-white/10 text-gray-300 hover:bg-white/5"
                          data-testid="button-save-default-level"
                        >
                          <Save className="w-4 h-4 mr-1" />
                          {savingLevel ? "저장 중..." : "내 기본 레벨로 저장"}
                        </Button>
                      )}
                    </div>
                    <Button onClick={() => setStep(1)} className="gradient-primary text-white" data-testid="button-next-step1">
                      다음 <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="glass-card rounded-2xl p-8">
                  <div className="flex items-start gap-2 mb-2">
                    <h2 className="text-xl font-bold text-white">
                      {isKid ? "🤔 어떤 점이 불편했어요?" : "해결하고 싶은 문제/불편을 적어주세요"}
                    </h2>
                    {isKid && (
                      <KidTtsButton
                        text={"어떤 점이 불편했어요? 학교나 집에서 이거 진짜 불편해 라고 느꼈던 일을 한 줄만 적어봐요. 예를 들면, 우산을 쓰면 두 손을 못 써요. 책가방이 너무 무거워요."}
                        testId="button-tts-step-1"
                      />
                    )}
                  </div>
                  <p className="text-muted-foreground mb-6">
                    {isKid
                      ? "학교나 집에서 \"이거 진짜 불편해!\"라고 느꼈던 일을 한 줄만 적어봐요."
                      : "일상에서 겪는 불편, 개선하고 싶은 점 등을 자유롭게 적어주세요."}
                  </p>
                  <Textarea
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    placeholder={
                      isKid
                        ? "예) 우산을 쓰면 두 손을 못 써요. 책가방이 너무 무거워요."
                        : "예: 비 오는 날 우산을 들고 다니기 불편하다. 양손을 사용할 수 없고..."
                    }
                    rows={5}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 mb-6"
                    data-testid="input-problem"
                  />
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep(0)} className="border-white/10 text-gray-400" data-testid="button-prev-step1">
                      <ChevronLeft className="w-4 h-4 mr-1" /> 이전
                    </Button>
                    <Button onClick={() => setStep(2)} disabled={!problem.trim()} className="gradient-primary text-white" data-testid="button-next-step2">
                      다음: SCAMPER <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="glass-card rounded-2xl p-8">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold text-white">
                            {isKid ? "💡 7가지 마법 질문 (SCAMPER)" : "SCAMPER 기법"}
                          </h2>
                          {isKid && (
                            <KidTtsButton
                              text="일곱 가지 마법 질문, 스캠퍼예요. AI 친구에게 질문해서 아이디어를 일곱 개나 받아봐요. 아래 AI한테 물어보기 버튼을 누르면 돼요."
                              testId="button-tts-step-2"
                            />
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">
                          {isKid
                            ? "AI 친구에게 질문해서 아이디어를 7개나 받아봐요!"
                            : "7가지 관점으로 아이디어를 발전시켜 보세요"}
                        </p>
                      </div>
                      <Button
                        onClick={handleScamper}
                        disabled={scamperStream.streaming}
                        className="gradient-primary text-white"
                        data-testid="button-scamper-ai"
                      >
                        {scamperStream.streaming ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
                        {isKid ? "✨ AI한테 물어보기" : "AI 아이디어 생성"}
                      </Button>
                    </div>
                    <div className="glass-card rounded-lg p-3 mb-6">
                      <p className="text-sm text-cyan-300"><strong>문제:</strong> {problem}</p>
                    </div>

                    <div className="space-y-4">
                      {SCAMPER_KEYS.map((key) => (
                        <div key={key} className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                          <p className="text-sm font-semibold text-cyan-400 mb-1">{SCAMPER_LABELS[key].label}</p>
                          <p className="text-xs text-muted-foreground mb-3">{SCAMPER_LABELS[key].question}</p>
                          <Textarea
                            value={scamperNotes[key] || ""}
                            onChange={(e) => setScamperNotes((prev) => ({ ...prev, [key]: e.target.value }))}
                            rows={2}
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-sm"
                            placeholder="여기에 아이디어를 적어보세요..."
                            data-testid={`input-scamper-${key}`}
                          />
                        </div>
                      ))}
                    </div>

                    <AiLiveRegion
                      streaming={scamperStream.streaming}
                      content={scamperStream.streamContent}
                      label="SCAMPER 발명 아이디어"
                      testId="live-scamper"
                    />
                    {scamperStream.streamContent && !scamperStream.streaming && (
                      <div className="mt-4 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                        {isKid && (
                          <div className="mb-3 flex flex-wrap gap-2">
                            <KidTtsButton
                              variant="pill"
                              text={scamperStream.streamContent}
                              label="처음부터 읽기"
                              testId="button-tts-scamper-result"
                            />
                            <KidTtsButton
                              variant="pill"
                              mode="char"
                              text={scamperStream.streamContent}
                              testId="button-tts-scamper-result-char"
                            />
                          </div>
                        )}
                        <AiFollowUp previousContent={scamperStream.streamContent} context="SCAMPER 발명 기법 아이디어" level={level} />
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep(1)} className="border-white/10 text-gray-400" data-testid="button-prev-step2">
                      <ChevronLeft className="w-4 h-4 mr-1" /> 이전
                    </Button>
                    <Button onClick={() => setStep(3)} className="gradient-primary text-white" data-testid="button-next-step3">
                      다음: TRIZ <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="glass-card rounded-2xl p-8">
                    <div className="flex items-start gap-2 mb-2">
                      <h2 className="text-xl font-bold text-white">
                        {isKid ? "🧩 두 가지가 부딪힐 때 (TRIZ)" : "TRIZ 기법"}
                      </h2>
                      {isKid && (
                        <KidTtsButton
                          text="두 가지가 부딪힐 때, 트리즈예요. 이건 좋은데 저게 안 좋아져요 같은 고민을 적으면 AI가 해결법을 알려줘요."
                          testId="button-tts-step-3"
                        />
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm mb-6">
                      {isKid
                        ? "\"이건 좋은데, 저게 안 좋아져요\" 같은 고민을 적으면 AI가 해결법을 알려줘요."
                        : "핵심 모순을 정의하고, AI가 40가지 발명 원리 중 최적의 해결 방향을 제시합니다."}
                    </p>

                    <div className="glass-card rounded-lg p-3 mb-6">
                      <p className="text-sm text-cyan-300"><strong>문제:</strong> {problem}</p>
                    </div>

                    <div className="mb-6">
                      <label className="text-sm font-medium text-white mb-2 block">
                        {isKid ? "👉 어떤 점이 서로 부딪혀요?" : "핵심 모순 정의"}
                      </label>
                      <Textarea
                        value={trizContradiction}
                        onChange={(e) => setTrizContradiction(e.target.value)}
                        placeholder={
                          isKid
                            ? "예) 우산을 크게 하면 비는 잘 막아요. 그런데 들고 다니기 무거워져요."
                            : "예: 우산을 크게 하면 비를 잘 막지만 휴대하기 불편하다. (개선하면 악화되는 점)"
                        }
                        rows={3}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                        data-testid="input-triz-contradiction"
                      />
                    </div>

                    <Button
                      onClick={handleTriz}
                      disabled={trizStream.streaming}
                      className="gradient-primary text-white mb-6"
                      data-testid="button-triz-ai"
                    >
                      {trizStream.streaming ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      AI TRIZ 분석
                    </Button>

                    <AiLiveRegion
                      streaming={trizStream.streaming}
                      content={trizStream.streamContent}
                      label="TRIZ 발명 원리 분석"
                      testId="live-triz"
                    />
                    {trizStream.streamContent && (
                      <div className="p-6 rounded-xl border border-white/5 bg-white/[0.02]" data-testid="text-triz-result">
                        {isKid && !trizStream.streaming && (
                          <div className="mb-3 flex flex-wrap gap-2">
                            <KidTtsButton
                              variant="pill"
                              text={trizStream.streamContent}
                              label="처음부터 읽기"
                              testId="button-tts-triz-result"
                            />
                            <KidTtsButton
                              variant="pill"
                              mode="char"
                              text={trizStream.streamContent}
                              testId="button-tts-triz-result-char"
                            />
                          </div>
                        )}
                        <div className="prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown>{trizStream.streamContent}</ReactMarkdown>
                        </div>
                        {!trizStream.streaming && (
                          <AiFollowUp previousContent={trizStream.streamContent} context="TRIZ 발명 원리 분석 결과" level={level} />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep(2)} className="border-white/10 text-gray-400" data-testid="button-prev-step3">
                      <ChevronLeft className="w-4 h-4 mr-1" /> 이전
                    </Button>
                    <Button onClick={() => setStep(4)} className="gradient-primary text-white" data-testid="button-next-step4">
                      다음: 아이디어 정리 <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="glass-card rounded-2xl p-8">
                  <div className="flex items-start gap-2 mb-2">
                    <h2 className="text-xl font-bold text-white">
                      {isKid ? "📝 내 발명 정리하기" : "아이디어 정리"}
                    </h2>
                    {isKid && (
                      <KidTtsButton
                        text="내 발명 정리하기. 지금까지 떠올린 아이디어 중 마음에 드는 걸 네 칸에 적어봐요. 발명 이름, 어떻게 해결할까, 누가 쓸 거예요, 어떻게 만들까, 이렇게 네 가지를 적으면 돼요."
                        testId="button-tts-step-4"
                      />
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm mb-6">
                    {isKid
                      ? "지금까지 떠올린 아이디어 중 마음에 드는 걸 4칸에 적어봐요."
                      : "SCAMPER와 TRIZ에서 영감을 받은 최종 발명 아이디어를 정리해주세요."}
                  </p>

                  <div className="space-y-5">
                    <div>
                      <label className="text-sm font-medium text-white mb-2 block">
                        {isKid ? "✏️ 발명 이름" : "발명 제목"}
                      </label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={isKid ? "예) 양손이 자유로운 우산모자" : "발명의 이름을 지어주세요"}
                        className="bg-white/5 border-white/10 text-white"
                        data-testid="input-title"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white mb-2 block">
                        {isKid ? "💡 어떻게 해결할까?" : "해결 방법 (솔루션)"}
                      </label>
                      <Textarea
                        value={solution}
                        onChange={(e) => setSolution(e.target.value)}
                        placeholder={isKid ? "예) 모자처럼 머리에 쓰는 우산을 만든다" : "어떻게 문제를 해결하나요?"}
                        rows={3}
                        className="bg-white/5 border-white/10 text-white"
                        data-testid="input-solution"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white mb-2 block">
                        {isKid ? "👥 누가 쓸 거예요?" : "대상 (누구를 위한 발명인가)"}
                      </label>
                      <Input
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        placeholder={isKid ? "예) 비 오는 날 자전거 타는 친구" : "이 발명을 사용할 사람"}
                        className="bg-white/5 border-white/10 text-white"
                        data-testid="input-target"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white mb-2 block">
                        {isKid ? "🔧 어떻게 만들까?" : "구체적 구현 방법"}
                      </label>
                      <Textarea
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                        placeholder={isKid ? "예) 가벼운 천과 헬멧을 합친다" : "어떤 기술/재료/방법을 사용하나요?"}
                        rows={3}
                        className="bg-white/5 border-white/10 text-white"
                        data-testid="input-method"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between mt-8">
                    <Button variant="outline" onClick={() => setStep(3)} className="border-white/10 text-gray-400" data-testid="button-prev-step4">
                      <ChevronLeft className="w-4 h-4 mr-1" /> 이전
                    </Button>
                    <Button onClick={() => setStep(5)} disabled={!title.trim() || !solution.trim()} className="gradient-primary text-white" data-testid="button-next-step5">
                      다음: 특허 명세서 <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-6">
                  <div className="glass-card rounded-2xl p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold text-white">
                            {isKid ? "📜 발명 설명서 만들기" : "특허 명세서 초안 생성"}
                          </h2>
                          {isKid && (
                            <KidTtsButton
                              text="발명 설명서 만들기. AI가 내 발명을 멋진 특허 명세서로 정리해줘요. 명세서 생성 버튼을 누르면 시작돼요."
                              testId="button-tts-step-5"
                            />
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">
                          {isKid
                            ? "AI가 내 발명을 멋진 특허 명세서로 정리해줘요."
                            : "AI가 발명 아이디어를 바탕으로 특허 명세서를 작성합니다."}
                        </p>
                      </div>
                      <Button
                        onClick={handlePatent}
                        disabled={patentStream.streaming}
                        className="gradient-primary text-white"
                        data-testid="button-patent-ai"
                      >
                        {patentStream.streaming ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                        명세서 생성
                      </Button>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 mb-6">
                      {[
                        { label: "발명 제목", value: title },
                        { label: "해결할 문제", value: problem },
                        { label: "해결 방법", value: solution },
                        { label: "대상", value: target },
                      ].map((item) => (
                        <div key={item.label} className="p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                          <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                          <p className="text-sm text-white line-clamp-2">{item.value || "-"}</p>
                        </div>
                      ))}
                    </div>

                    <AiLiveRegion
                      streaming={patentStream.streaming}
                      content={patentStream.streamContent}
                      label="특허 명세서 초안"
                      testId="live-patent"
                    />
                    {patentStream.streamContent && (
                      <div className="p-6 rounded-xl border border-white/5 bg-white/[0.02]" data-testid="text-patent-result">
                        {isKid && !patentStream.streaming && (
                          <div className="mb-3 flex flex-wrap gap-2">
                            <KidTtsButton
                              variant="pill"
                              text={patentStream.streamContent}
                              label="처음부터 읽기"
                              testId="button-tts-patent-result"
                            />
                            <KidTtsButton
                              variant="pill"
                              mode="char"
                              text={patentStream.streamContent}
                              testId="button-tts-patent-result-char"
                            />
                          </div>
                        )}
                        <div className="prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown>{patentStream.streamContent}</ReactMarkdown>
                        </div>
                        {!patentStream.streaming && (
                          <>
                            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10"
                                onClick={() => {
                                  const content = `[특허 명세서 초안]\n\n발명 제목: ${title}\n해결할 문제: ${problem}\n해결 방법: ${solution}\n대상: ${target}\n\n${patentStream.streamContent}`;
                                  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = `특허명세서_${title || "초안"}.txt`;
                                  a.click();
                                  URL.revokeObjectURL(url);
                                }}
                                data-testid="button-download-patent"
                              >
                                <Download className="w-4 h-4 mr-1" /> 명세서 다운로드
                              </Button>
                              {(() => {
                                const reportEntries: { key: string; sortKey: ReportKey; node: JSX.Element }[] = [];
                                for (const wc of [500, 1500] as const) {
                                  const match = getReportMatch(level, "saengbu");
                                  reportEntries.push({
                                    key: `saengbu-${wc}`,
                                    sortKey: "saengbu",
                                    node: (
                                      <div key={`saengbu-${wc}`} className="relative inline-flex">
                                        {match.recommended && (
                                          <span className="absolute -top-2 -right-2 z-10 px-1.5 py-0.5 rounded-full bg-cyan-500 text-[10px] font-bold text-white shadow-md" data-testid={`badge-recommend-saengbu-${wc}`}>★추천</span>
                                        )}
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          title={match.hint}
                                          className={`border-purple-500/20 text-purple-300 hover:bg-purple-500/10 ${recommendedRingClass(match)}`}
                                          disabled={!editingId || generatingReport === wc}
                                          onClick={async () => {
                                            if (!editingId) {
                                              toast({ title: "먼저 프로젝트를 저장해주세요.", variant: "destructive" });
                                              return;
                                            }
                                            const run = async () => {
                                              setGeneratingReport(wc);
                                              try {
                                                const r = await apiRequest("POST", "/api/reports/saengbu", {
                                                  projectId: editingId, projectType: "invention", wordCount: wc,
                                                });
                                                const data = await r.json();
                                                const content = `[학생부 활동보고서 (${wc}자)]\n발명 제목: ${title}\n\n${data.text}`;
                                                const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement("a");
                                                a.href = url;
                                                a.download = `생기부_${title || "발명"}_${wc}자.txt`;
                                                a.click();
                                                URL.revokeObjectURL(url);
                                                toast({ title: `${wc}자 학생부 보고서가 생성되었습니다.` });
                                              } catch {
                                                toast({
                                                  title: "보고서 생성 실패",
                                                  variant: "destructive",
                                                  action: (
                                                    <ToastAction altText="다시 시도" onClick={() => run()} data-testid="button-toast-retry-saengbu">
                                                      다시 시도
                                                    </ToastAction>
                                                  ),
                                                });
                                              }
                                              setGeneratingReport(null);
                                            };
                                            await run();
                                          }}
                                          data-testid={`button-download-saengbu-${wc}`}
                                          data-recommended={match.recommended ? "true" : "false"}
                                        >
                                          {generatingReport === wc ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileText className="w-4 h-4 mr-1" />}
                                          생기부 {wc}자 (고등)
                                        </Button>
                                      </div>
                                    ),
                                  });
                                }
                                {
                                  const match = getReportMatch(level, "competition");
                                  reportEntries.push({
                                    key: "competition",
                                    sortKey: "competition",
                                    node: (
                                      <div key="competition" className="relative inline-flex">
                                        {match.recommended && (
                                          <span className="absolute -top-2 -right-2 z-10 px-1.5 py-0.5 rounded-full bg-cyan-500 text-[10px] font-bold text-white shadow-md" data-testid="badge-recommend-competition">★추천</span>
                                        )}
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          title={match.hint}
                                          className={`border-yellow-400/60 text-yellow-300 hover:bg-yellow-500/10 ${recommendedRingClass(match)}`}
                                          disabled={!editingId || generatingCompetition}
                                          onClick={async () => {
                                            if (!editingId) {
                                              toast({ title: "먼저 프로젝트를 저장해주세요.", variant: "destructive" });
                                              return;
                                            }
                                            const run = async () => {
                                              setGeneratingCompetition(true);
                                              try {
                                                const r = await apiRequest("POST", "/api/reports/competition", {
                                                  projectId: editingId, projectType: "invention",
                                                });
                                                const data = await r.json();
                                                const content = `[${data.competitionName} 출품 양식]\n발명 제목: ${title}\n\n${data.text}`;
                                                const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement("a");
                                                a.href = url;
                                                a.download = `대회출품_${title || "발명"}.txt`;
                                                a.click();
                                                URL.revokeObjectURL(url);
                                                toast({ title: `${data.competitionName} 출품 양식이 생성되었습니다.` });
                                              } catch {
                                                toast({
                                                  title: "출품 양식 생성 실패",
                                                  variant: "destructive",
                                                  action: (
                                                    <ToastAction altText="다시 시도" onClick={() => run()} data-testid="button-toast-retry-competition">
                                                      다시 시도
                                                    </ToastAction>
                                                  ),
                                                });
                                              }
                                              setGeneratingCompetition(false);
                                            };
                                            await run();
                                          }}
                                          data-testid="button-download-competition"
                                          data-recommended={match.recommended ? "true" : "false"}
                                        >
                                          {generatingCompetition ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileText className="w-4 h-4 mr-1" />}
                                          대회 출품 양식
                                        </Button>
                                      </div>
                                    ),
                                  });
                                }
                                {
                                  const match = getReportMatch(level, "freesemester");
                                  reportEntries.push({
                                    key: "freesemester",
                                    sortKey: "freesemester",
                                    node: (
                                      <div key="freesemester" className="relative inline-flex">
                                        {match.recommended && (
                                          <span className="absolute -top-2 -right-2 z-10 px-1.5 py-0.5 rounded-full bg-cyan-500 text-[10px] font-bold text-white shadow-md" data-testid="badge-recommend-freesemester">★추천</span>
                                        )}
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          title={match.hint}
                                          className={`border-emerald-400/60 text-emerald-300 hover:bg-emerald-500/10 ${recommendedRingClass(match)}`}
                                          disabled={!editingId || generatingFreeSemester}
                                          onClick={async () => {
                                            if (!editingId) {
                                              toast({ title: "먼저 프로젝트를 저장해주세요.", variant: "destructive" });
                                              return;
                                            }
                                            const run = async () => {
                                              setGeneratingFreeSemester(true);
                                              try {
                                                const r = await apiRequest("POST", "/api/reports/freesemester", {
                                                  projectId: editingId, projectType: "invention",
                                                });
                                                const data = await r.json();
                                                const content = `[자유학기 활동지 (중학생용)]\n발명 제목: ${title}\n\n${data.text}`;
                                                const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement("a");
                                                a.href = url;
                                                a.download = `자유학기활동지_${title || "발명"}.txt`;
                                                a.click();
                                                URL.revokeObjectURL(url);
                                                toast({ title: "자유학기 활동지가 생성되었습니다." });
                                              } catch {
                                                toast({
                                                  title: "활동지 생성 실패",
                                                  variant: "destructive",
                                                  action: (
                                                    <ToastAction altText="다시 시도" onClick={() => run()} data-testid="button-toast-retry-freesemester">
                                                      다시 시도
                                                    </ToastAction>
                                                  ),
                                                });
                                              }
                                              setGeneratingFreeSemester(false);
                                            };
                                            await run();
                                          }}
                                          data-testid="button-download-freesemester"
                                          data-recommended={match.recommended ? "true" : "false"}
                                        >
                                          {generatingFreeSemester ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileText className="w-4 h-4 mr-1" />}
                                          자유학기 활동지 (중등)
                                        </Button>
                                      </div>
                                    ),
                                  });

                                  reportEntries.push({
                                    key: "freesemester-pdf",
                                    sortKey: "freesemester",
                                    node: (
                                      <div key="freesemester-pdf" className="relative inline-flex">
                                        {match.recommended && (
                                          <span className="absolute -top-2 -right-2 z-10 px-1.5 py-0.5 rounded-full bg-cyan-500 text-[10px] font-bold text-white shadow-md" data-testid="badge-recommend-freesemester-pdf">★추천</span>
                                        )}
                                        <div className={recommendedRingClass(match)}>
                                          <FreeSemesterPdfButton
                                            projectId={editingId}
                                            projectType="invention"
                                            title={title}
                                            disabled={!editingId}
                                            testId="button-download-freesemester-pdf"
                                          />
                                        </div>
                                      </div>
                                    ),
                                  });
                                }
                                const sorted = [...reportEntries].sort(
                                  (a, b) => reportPriority(level, a.sortKey) - reportPriority(level, b.sortKey),
                                );
                                return sorted.map((e) => e.node);
                              })()}
                            </div>
                            {(() => {
                              const summary = getRecommendedSummary(level);
                              const audienceName = audienceFriendlyName(level);
                              if (!summary) return null;
                              return (
                                <p className="text-xs text-cyan-300 mt-2" data-testid="text-report-recommendation">
                                  {audienceName ? `${audienceName} 추천: ` : ""}{summary}
                                </p>
                              );
                            })()}
                            {!editingId && (
                              <p className="text-xs text-amber-400 mt-2">학생부 보고서는 프로젝트 저장 후 생성할 수 있습니다.</p>
                            )}
                            <AiFollowUp previousContent={patentStream.streamContent} context="특허 명세서 초안" level={level} />
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep(4)} className="border-white/10 text-gray-400" data-testid="button-prev-step5">
                      <ChevronLeft className="w-4 h-4 mr-1" /> 이전
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="button-save-project">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : editingId ? <Edit3 className="w-4 h-4 mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                      {editingId ? "수정 저장" : "프로젝트 저장"}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
      <GuestSignupModal open={showSignupModal} onOpenChange={setShowSignupModal} />
    </div>
  );
}
