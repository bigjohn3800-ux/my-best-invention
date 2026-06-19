import { useState, useEffect, useRef } from "react";
import { ToastAction } from "@/components/ui/toast";
import { useAuth } from "@/hooks/use-auth";
import { Link, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/navbar";
import { motion } from "framer-motion";
import { Rocket, Wand2, Loader2, Check, AlertCircle, Presentation, Save, Edit3, Download, FileText } from "lucide-react";
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
import type { BusinessCanvas } from "@shared/schema";

const LEVELS = [
  { value: "elementary", label: "초등", emoji: "🧒" },
  { value: "middle", label: "중등", emoji: "🎒" },
  { value: "high", label: "고등", emoji: "📚" },
  { value: "university", label: "대학", emoji: "🎓" },
  { value: "general", label: "일반·창업", emoji: "💼" },
];

const VALID_AUDIENCES = new Set(["elementary", "middle", "high", "university", "general"]);
const normalizeLevel = (l?: string | null): string => {
  if (!l) return "high";
  if (l === "beginner") return "elementary";
  if (l === "intermediate") return "middle";
  if (l === "advanced") return "university";
  return VALID_AUDIENCES.has(l) ? l : "high";
};

const BMC_FIELDS = [
  { key: "keyPartners", label: "핵심 파트너", desc: "누구와 협력하나요?", area: "left", row: "1/3" },
  { key: "keyActivities", label: "핵심 활동", desc: "무엇을 해야 하나요?", area: "midleft", row: "1/2" },
  { key: "keyResources", label: "핵심 자원", desc: "어떤 자원이 필요하나요?", area: "midleft", row: "2/2" },
  { key: "valueProposition", label: "가치 제안", desc: "어떤 가치를 제공하나요?", area: "center", row: "1/3" },
  { key: "customerRelationships", label: "고객 관계", desc: "어떻게 소통하나요?", area: "midright", row: "1/2" },
  { key: "channels", label: "채널", desc: "어떻게 전달하나요?", area: "midright", row: "2/2" },
  { key: "customerSegments", label: "고객 세그먼트", desc: "누구에게 판매하나요?", area: "right", row: "1/3" },
  { key: "costStructure", label: "비용 구조", desc: "비용은 어디에 드나요?", area: "bottomleft", row: "1/1" },
  { key: "revenueStreams", label: "수익원", desc: "어떻게 돈을 버나요?", area: "bottomright", row: "1/1" },
] as const;

// 초등학생 모드: BMC 9칸을 더 친근한 단어와 이모지로 보여주기 위한 라벨/설명 사전
const KID_BMC: Record<string, { label: string; desc: string; placeholder: string }> = {
  keyPartners: { label: "🤝 도와주는 친구", desc: "누가 같이 도와줄까요?", placeholder: "예) 엄마, 분식집 사장님" },
  keyActivities: { label: "🛠️ 매일 할 일", desc: "내가 매일 무엇을 해야 할까요?", placeholder: "예) 떡볶이 만들기, 인사하기" },
  keyResources: { label: "📦 필요한 것", desc: "어떤 재료나 도구가 필요할까요?", placeholder: "예) 떡, 고추장, 냄비" },
  valueProposition: { label: "🎁 우리만의 좋은 점", desc: "왜 우리 가게에 와야 할까요?", placeholder: "예) 안 매워서 어린이도 먹을 수 있어요" },
  customerRelationships: { label: "💬 손님과 친해지기", desc: "손님과 어떻게 친해질까요?", placeholder: "예) 도장 모으기 카드 주기" },
  channels: { label: "🚚 어떻게 전달", desc: "어떻게 손님에게 가져다줄까요?", placeholder: "예) 학교 앞 가게, 배달" },
  customerSegments: { label: "👫 누구에게 팔까", desc: "누가 우리 가게에 올까요?", placeholder: "예) 우리 학교 1~6학년 친구들" },
  costStructure: { label: "💸 들어가는 돈", desc: "돈이 어디에 들어갈까요?", placeholder: "예) 재료비, 가게 빌리는 돈" },
  revenueStreams: { label: "💰 돈을 버는 방법", desc: "어떻게 돈을 벌까요?", placeholder: "예) 떡볶이 한 그릇 3,000원" },
};

export default function StartupLabPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const searchString = useSearch();
  const canvasId = new URLSearchParams(searchString).get("canvasId");

  const urlLevel = new URLSearchParams(searchString).get("level");
  const [level, setLevel] = useState(normalizeLevel(urlLevel || user?.level));
  const [title, setTitle] = useState("");
  const [canvasData, setCanvasData] = useState<Record<string, string>>({});
  const [activeField, setActiveField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingLevel, setSavingLevel] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [generatingSaengbu, setGeneratingSaengbu] = useState<number | null>(null);
  const [generatingCompetition, setGeneratingCompetition] = useState(false);
  const [generatingFreeSemester, setGeneratingFreeSemester] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [cellAiResults, setCellAiResults] = useState<Record<string, string>>({});

  const bmcStream = useSSEStream();
  const pitchStream = useSSEStream();
  const lastAiActionRef = useRef<(() => void) | null>(null);
  const { showSignupModal, setShowSignupModal } = useGuestLimitModal([
    bmcStream.sseError,
    pitchStream.sseError,
  ]);

  const { data: existingCanvas } = useQuery<BusinessCanvas>({
    queryKey: ["/api/business-canvases", canvasId],
    enabled: !!canvasId && !!user,
  });

  useEffect(() => {
    if (existingCanvas && !loaded) {
      setTitle(existingCanvas.title);
      const data: Record<string, string> = {};
      for (const f of BMC_FIELDS) {
        const val = (existingCanvas as Record<string, unknown>)[f.key];
        if (typeof val === "string") data[f.key] = val;
      }
      setCanvasData(data);
      if (existingCanvas.pitchDeck) pitchStream.setStreamContent(existingCanvas.pitchDeck);
      if (existingCanvas.level) setLevel(normalizeLevel(existingCanvas.level));
      setEditingId(existingCanvas.id);
      setLoaded(true);
    }
  }, [existingCanvas, loaded]);

  useEffect(() => {
    if (user?.level && !canvasId && !urlLevel) setLevel(normalizeLevel(user.level));
  }, [user?.level]);

  useEffect(() => {
    if (bmcStream.sseError?.type === "GUEST_LIMIT_REACHED" ||
        pitchStream.sseError?.type === "GUEST_LIMIT_REACHED") {
      setShowSignupModal(true);
    }
    const generalErr =
      (bmcStream.sseError?.type === "GENERAL" && bmcStream.sseError) ||
      (pitchStream.sseError?.type === "GENERAL" && pitchStream.sseError);
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
      setActiveField(null);
      bmcStream.clearError();
      pitchStream.clearError();
    }
  }, [bmcStream.sseError, pitchStream.sseError]);

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

  const handleAiAssist = async (field: string) => {
    const body = {
      field,
      currentValue: canvasData[field] || "",
      canvasData,
      level,
    };
    const run = async () => {
      setActiveField(field);
      const result = await bmcStream.startStream("/api/ai/bmc-assist", body);
      if (result) {
        setCanvasData((prev) => ({ ...prev, [field]: (prev[field] ? prev[field] + "\n\n" : "") + result }));
        setCellAiResults(prev => ({ ...prev, [field]: result }));
      }
      setActiveField(null);
    };
    lastAiActionRef.current = run;
    await run();
  };

  const handlePitchDeck = async () => {
    const body = { canvasData, level };
    const run = () => pitchStream.startStream("/api/ai/pitch-deck", body);
    lastAiActionRef.current = () => { run(); };
    await run();
  };

  const handleSave = async () => {
    if (!user) { setShowSignupModal(true); return; }
    setSaving(true);
    try {
      const body = {
        title: title || "무제",
        ...canvasData,
        pitchDeck: pitchStream.streamContent || null,
        level,
      };

      const res = editingId
        ? await apiRequest("PATCH", `/api/business-canvases/${editingId}`, body)
        : await apiRequest("POST", "/api/business-canvases", body);
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
      queryClient.invalidateQueries({ queryKey: ["/api/business-canvases"] });
      toast({ title: editingId ? "캔버스가 수정되었습니다." : "캔버스가 저장되었습니다." });
    } catch {
      toast({ title: "저장 실패", variant: "destructive" });
    }
    setSaving(false);
  };

  const isKid = level === "elementary";

  return (
    <div className="min-h-screen" data-testid={isKid ? "kid-mode-active" : undefined}>
      <Navbar />
      <div className={`max-w-7xl mx-auto px-4 pt-24 pb-20 ${isKid ? "kid-mode" : ""}`}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center neon-purple">
                <Rocket className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-white" data-testid="text-lab-title">
                    {isKid ? "🧒 어린이 창업 놀이터" : "AI 창업 랩"}
                    {editingId && <span className="ml-2 text-sm font-normal text-purple-400">(수정 모드)</span>}
                  </h1>
                  {isKid && (
                    <KidTtsButton
                      text="어린이 창업 놀이터예요. 아홉 칸을 채우면 나만의 가게가 만들어져요. 한 칸씩 천천히 따라와 봐요."
                      testId="button-tts-lab-title"
                    />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {isKid ? "9칸을 채우면 나만의 가게가 만들어져요!" : "비즈니스 모델 캔버스 + IR 피칭덱"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setLevel(l.value)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${level === l.value ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "text-gray-300 bg-white/5 hover:bg-white/10 border border-transparent"}`}
                  data-testid={`button-level-${l.value}`}
                >
                  <span>{l.emoji}</span>
                  <span>{l.label}</span>
                </button>
              ))}
              {user && level !== user.level && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSaveDefaultLevel}
                  disabled={savingLevel}
                  className="text-xs text-gray-400 hover:text-white"
                  data-testid="button-save-default-level"
                >
                  <Save className="w-3 h-3 mr-1" />
                  {savingLevel ? "..." : "기본으로 저장"}
                </Button>
              )}
            </div>
          </div>

          {isKid && (
            <div className="kid-banner mb-6" data-testid="banner-kid-mode">
              <span className="text-2xl">🌟</span>
              <span>지금은 <strong>초등학생 모드</strong>예요! 9칸에 차근차근 적어보면 나만의 가게가 완성돼요.</span>
            </div>
          )}

          <div className="mb-6">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isKid ? "예) 친구들이 좋아하는 떡볶이 가게" : "비즈니스 이름을 입력하세요"}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-lg font-semibold max-w-md"
              data-testid="input-biz-title"
            />
          </div>

          <div className="bmc-grid grid grid-cols-1 md:grid-cols-5 gap-3 mb-8">
            <div className="md:row-span-2">
              <CanvasCell field={BMC_FIELDS[0]} canvasData={canvasData} setCanvasData={setCanvasData} onAiAssist={handleAiAssist} activeField={activeField} streaming={bmcStream.streaming} tall isKid={isKid} />
            </div>
            <div>
              <CanvasCell field={BMC_FIELDS[1]} canvasData={canvasData} setCanvasData={setCanvasData} onAiAssist={handleAiAssist} activeField={activeField} streaming={bmcStream.streaming} isKid={isKid} />
            </div>
            <div className="md:row-span-2">
              <CanvasCell field={BMC_FIELDS[3]} canvasData={canvasData} setCanvasData={setCanvasData} onAiAssist={handleAiAssist} activeField={activeField} streaming={bmcStream.streaming} tall isKid={isKid} />
            </div>
            <div>
              <CanvasCell field={BMC_FIELDS[4]} canvasData={canvasData} setCanvasData={setCanvasData} onAiAssist={handleAiAssist} activeField={activeField} streaming={bmcStream.streaming} isKid={isKid} />
            </div>
            <div className="md:row-span-2">
              <CanvasCell field={BMC_FIELDS[6]} canvasData={canvasData} setCanvasData={setCanvasData} onAiAssist={handleAiAssist} activeField={activeField} streaming={bmcStream.streaming} tall isKid={isKid} />
            </div>
            <div>
              <CanvasCell field={BMC_FIELDS[2]} canvasData={canvasData} setCanvasData={setCanvasData} onAiAssist={handleAiAssist} activeField={activeField} streaming={bmcStream.streaming} isKid={isKid} />
            </div>
            <div>
              <CanvasCell field={BMC_FIELDS[5]} canvasData={canvasData} setCanvasData={setCanvasData} onAiAssist={handleAiAssist} activeField={activeField} streaming={bmcStream.streaming} isKid={isKid} />
            </div>
            <div className="md:col-span-2 lg:col-span-2">
              <CanvasCell field={BMC_FIELDS[7]} canvasData={canvasData} setCanvasData={setCanvasData} onAiAssist={handleAiAssist} activeField={activeField} streaming={bmcStream.streaming} isKid={isKid} />
            </div>
            <div className="md:col-span-3 lg:col-span-3">
              <CanvasCell field={BMC_FIELDS[8]} canvasData={canvasData} setCanvasData={setCanvasData} onAiAssist={handleAiAssist} activeField={activeField} streaming={bmcStream.streaming} isKid={isKid} />
            </div>
          </div>

          <AiLiveRegion
            streaming={bmcStream.streaming}
            content={bmcStream.streamContent}
            label={activeField ? `BMC ${activeField} 셀 AI 제안` : "BMC AI 제안"}
            testId="live-bmc"
          />

          {Object.keys(cellAiResults).length > 0 && !bmcStream.streaming && (
            <div className="space-y-3 mb-4">
              {BMC_FIELDS.filter(f => cellAiResults[f.key]).map(f => (
                <div key={f.key} className="glass-card rounded-xl p-4">
                  <p className="text-xs text-purple-400 font-medium mb-2">
                    AI 응답 후속 대화 — {f.label}
                  </p>
                  <AiFollowUp previousContent={cellAiResults[f.key]} context={`BMC ${f.label} 셀 응답`} level={level} />
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <Button onClick={handlePitchDeck} disabled={pitchStream.streaming} className="bg-purple-600 hover:bg-purple-700 text-white" data-testid="button-pitch-deck">
              {pitchStream.streaming ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Presentation className="w-4 h-4 mr-2" />}
              IR 피칭덱 생성
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="button-save-canvas">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : editingId ? <Edit3 className="w-4 h-4 mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              {editingId ? "수정 저장" : "캔버스 저장"}
            </Button>
          </div>

          <AiLiveRegion
            streaming={pitchStream.streaming}
            content={pitchStream.streamContent}
            label="IR 피칭덱"
            testId="live-pitch"
          />

          {pitchStream.streamContent && (
            <div className="glass-card rounded-2xl p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Presentation className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-bold text-white">IR 피칭덱</h3>
                  {isKid && !pitchStream.streaming && (
                    <>
                      <KidTtsButton
                        variant="pill"
                        text={pitchStream.streamContent}
                        label="처음부터 읽기"
                        testId="button-tts-pitch-result"
                      />
                      <KidTtsButton
                        variant="pill"
                        mode="char"
                        text={pitchStream.streamContent}
                        testId="button-tts-pitch-result-char"
                      />
                    </>
                  )}
                </div>
                {!pitchStream.streaming && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-purple-500/20 text-purple-400 hover:bg-purple-500/10"
                    onClick={() => {
                      const content = `[IR 피칭덱]\n\n비즈니스: ${title}\n\n${pitchStream.streamContent}`;
                      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `피칭덱_${title || "초안"}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    data-testid="button-download-pitch"
                  >
                    <Download className="w-4 h-4 mr-1" /> IR덱 다운로드
                  </Button>
                )}
              </div>
              <div className="prose prose-invert prose-sm max-w-none" data-testid="text-pitch-deck-result">
                <ReactMarkdown>{pitchStream.streamContent}</ReactMarkdown>
              </div>
              {!pitchStream.streaming && (
                <AiFollowUp previousContent={pitchStream.streamContent} context="IR 피칭덱" level={level} />
              )}
            </div>
          )}

          {/* 맞춤 보고서 변환 (저장된 캔버스에서만) */}
          <div className="mt-6 glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Presentation className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-white">맞춤 보고서 변환</h3>
            </div>
            <p className="text-sm text-gray-300 mb-4">
              저장된 비즈니스 캔버스를 목적에 맞는 형식으로 변환해 다운로드할 수 있습니다.
              {!editingId && <span className="text-amber-400"> (먼저 캔버스를 저장하세요)</span>}
            </p>
            {(() => {
              const summary = getRecommendedSummary(level);
              const audienceName = audienceFriendlyName(level);
              if (!summary) return null;
              return (
                <p className="text-xs text-cyan-300 mb-3" data-testid="text-report-recommendation-startup">
                  {audienceName ? `${audienceName} 추천: ` : ""}{summary}
                </p>
              );
            })()}
            <div className="flex flex-wrap gap-2">
              {(() => {
                const entries: { sortKey: ReportKey; node: JSX.Element }[] = [];
                {
                  const match = getReportMatch(level, "business-plan");
                  entries.push({
                    sortKey: "business-plan",
                    node: (
                      <div key="business-plan" className="relative inline-flex">
                        {match.recommended && (
                          <span className="absolute -top-2 -right-2 z-10 px-1.5 py-0.5 rounded-full bg-cyan-500 text-[10px] font-bold text-white shadow-md" data-testid="badge-recommend-business-plan">★추천</span>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          title={match.hint}
                          disabled={!editingId || generatingPlan}
                          className={`border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/10 ${recommendedRingClass(match)}`}
                          onClick={async () => {
                            if (!editingId) return;
                            const run = async () => {
                              setGeneratingPlan(true);
                              try {
                                const r = await apiRequest("POST", "/api/reports/business-plan", { canvasId: editingId });
                                const data = await r.json();
                                const content = `[정부지원사업 사업계획서 — K-Startup 양식]\n\n사업명: ${title}\n\n${data.text}`;
                                const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `사업계획서_${title || "캔버스"}.txt`;
                                a.click();
                                URL.revokeObjectURL(url);
                                toast({ title: "사업계획서가 생성되었습니다." });
                              } catch {
                                toast({
                                  title: "사업계획서 생성 실패",
                                  variant: "destructive",
                                  action: (
                                    <ToastAction altText="다시 시도" onClick={() => run()} data-testid="button-toast-retry-business-plan">
                                      다시 시도
                                    </ToastAction>
                                  ),
                                });
                              }
                              setGeneratingPlan(false);
                            };
                            await run();
                          }}
                          data-testid="button-download-business-plan"
                          data-recommended={match.recommended ? "true" : "false"}
                        >
                          {generatingPlan ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
                          정부지원사업 사업계획서 (일반·창업)
                        </Button>
                      </div>
                    ),
                  });
                }
                for (const wc of [500, 1500] as const) {
                  const match = getReportMatch(level, "saengbu");
                  entries.push({
                    sortKey: "saengbu",
                    node: (
                      <div key={`saengbu-${wc}`} className="relative inline-flex">
                        {match.recommended && (
                          <span className="absolute -top-2 -right-2 z-10 px-1.5 py-0.5 rounded-full bg-cyan-500 text-[10px] font-bold text-white shadow-md" data-testid={`badge-recommend-saengbu-startup-${wc}`}>★추천</span>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          title={match.hint}
                          disabled={!editingId || generatingSaengbu === wc}
                          className={`border-purple-500/20 text-purple-300 hover:bg-purple-500/10 ${recommendedRingClass(match)}`}
                          onClick={async () => {
                            if (!editingId) return;
                            const run = async () => {
                              setGeneratingSaengbu(wc);
                              try {
                                const r = await apiRequest("POST", "/api/reports/saengbu", {
                                  projectId: editingId, projectType: "startup", wordCount: wc,
                                });
                                const data = await r.json();
                                const content = `[학생부 활동보고서 — 창업 (${wc}자)]\n사업명: ${title}\n\n${data.text}`;
                                const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `생기부_창업_${title || "캔버스"}_${wc}자.txt`;
                                a.click();
                                URL.revokeObjectURL(url);
                                toast({ title: `${wc}자 학생부 보고서가 생성되었습니다.` });
                              } catch {
                                toast({
                                  title: "보고서 생성 실패",
                                  variant: "destructive",
                                  action: (
                                    <ToastAction altText="다시 시도" onClick={() => run()} data-testid="button-toast-retry-saengbu-startup">
                                      다시 시도
                                    </ToastAction>
                                  ),
                                });
                              }
                              setGeneratingSaengbu(null);
                            };
                            await run();
                          }}
                          data-testid={`button-download-saengbu-startup-${wc}`}
                          data-recommended={match.recommended ? "true" : "false"}
                        >
                          {generatingSaengbu === wc ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
                          생기부 {wc}자 (고등)
                        </Button>
                      </div>
                    ),
                  });
                }
                {
                  const match = getReportMatch(level, "competition");
                  entries.push({
                    sortKey: "competition",
                    node: (
                      <div key="competition" className="relative inline-flex">
                        {match.recommended && (
                          <span className="absolute -top-2 -right-2 z-10 px-1.5 py-0.5 rounded-full bg-cyan-500 text-[10px] font-bold text-white shadow-md" data-testid="badge-recommend-competition-startup">★추천</span>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          title={match.hint}
                          disabled={!editingId || generatingCompetition}
                          className={`border-yellow-400/60 text-yellow-300 hover:bg-yellow-500/10 ${recommendedRingClass(match)}`}
                          onClick={async () => {
                            if (!editingId) return;
                            const run = async () => {
                              setGeneratingCompetition(true);
                              try {
                                const r = await apiRequest("POST", "/api/reports/competition", {
                                  projectId: editingId, projectType: "startup",
                                });
                                const data = await r.json();
                                const content = `[${data.competitionName} 출품 양식]\n사업명: ${title}\n\n${data.text}`;
                                const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `대회출품_창업_${title || "캔버스"}.txt`;
                                a.click();
                                URL.revokeObjectURL(url);
                                toast({ title: `${data.competitionName} 출품 양식이 생성되었습니다.` });
                              } catch {
                                toast({
                                  title: "출품 양식 생성 실패",
                                  variant: "destructive",
                                  action: (
                                    <ToastAction altText="다시 시도" onClick={() => run()} data-testid="button-toast-retry-competition-startup">
                                      다시 시도
                                    </ToastAction>
                                  ),
                                });
                              }
                              setGeneratingCompetition(false);
                            };
                            await run();
                          }}
                          data-testid="button-download-competition-startup"
                          data-recommended={match.recommended ? "true" : "false"}
                        >
                          {generatingCompetition ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileText className="w-4 h-4 mr-1" />}
                          대회 출품 양식 (청소년창업)
                        </Button>
                      </div>
                    ),
                  });
                }
                {
                  const match = getReportMatch(level, "freesemester");
                  entries.push({
                    sortKey: "freesemester",
                    node: (
                      <div key="freesemester" className="relative inline-flex">
                        {match.recommended && (
                          <span className="absolute -top-2 -right-2 z-10 px-1.5 py-0.5 rounded-full bg-cyan-500 text-[10px] font-bold text-white shadow-md" data-testid="badge-recommend-freesemester-startup">★추천</span>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          title={match.hint}
                          disabled={!editingId || generatingFreeSemester}
                          className={`border-emerald-400/60 text-emerald-300 hover:bg-emerald-500/10 ${recommendedRingClass(match)}`}
                          onClick={async () => {
                            if (!editingId) return;
                            const run = async () => {
                              setGeneratingFreeSemester(true);
                              try {
                                const r = await apiRequest("POST", "/api/reports/freesemester", {
                                  projectId: editingId, projectType: "startup",
                                });
                                const data = await r.json();
                                const content = `[자유학기 활동지 — 창업 (중학생용)]\n사업명: ${title}\n\n${data.text}`;
                                const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `자유학기활동지_창업_${title || "캔버스"}.txt`;
                                a.click();
                                URL.revokeObjectURL(url);
                                toast({ title: "자유학기 활동지가 생성되었습니다." });
                              } catch {
                                toast({
                                  title: "활동지 생성 실패",
                                  variant: "destructive",
                                  action: (
                                    <ToastAction altText="다시 시도" onClick={() => run()} data-testid="button-toast-retry-freesemester-startup">
                                      다시 시도
                                    </ToastAction>
                                  ),
                                });
                              }
                              setGeneratingFreeSemester(false);
                            };
                            await run();
                          }}
                          data-testid="button-download-freesemester-startup"
                          data-recommended={match.recommended ? "true" : "false"}
                        >
                          {generatingFreeSemester ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileText className="w-4 h-4 mr-1" />}
                          자유학기 활동지 (중등)
                        </Button>
                      </div>
                    ),
                  });
                  entries.push({
                    sortKey: "freesemester",
                    node: (
                      <div key="freesemester-pdf" className="relative inline-flex">
                        {match.recommended && (
                          <span className="absolute -top-2 -right-2 z-10 px-1.5 py-0.5 rounded-full bg-cyan-500 text-[10px] font-bold text-white shadow-md" data-testid="badge-recommend-freesemester-startup-pdf">★추천</span>
                        )}
                        <FreeSemesterPdfButton
                          projectId={editingId}
                          projectType="startup"
                          title={title}
                          disabled={!editingId}
                          testId="button-download-freesemester-pdf-startup"
                          className={recommendedRingClass(match)}
                        />
                      </div>
                    ),
                  });
                }
                const sorted = [...entries].sort(
                  (a, b) => reportPriority(level, a.sortKey) - reportPriority(level, b.sortKey),
                );
                return sorted.map((e) => e.node);
              })()}
            </div>
          </div>
        </motion.div>
      </div>
      <GuestSignupModal open={showSignupModal} onOpenChange={setShowSignupModal} />
    </div>
  );
}

function CanvasCell({
  field,
  canvasData,
  setCanvasData,
  onAiAssist,
  activeField,
  streaming,
  tall,
  isKid,
}: {
  field: { key: string; label: string; desc: string };
  canvasData: Record<string, string>;
  setCanvasData: (fn: (prev: Record<string, string>) => Record<string, string>) => void;
  onAiAssist: (field: string) => void;
  activeField: string | null;
  streaming: boolean;
  tall?: boolean;
  isKid?: boolean;
}) {
  const kid = isKid ? KID_BMC[field.key] : undefined;
  const label = kid?.label ?? field.label;
  const desc = kid?.desc ?? field.desc;
  const placeholder = kid?.placeholder ?? "클릭하여 입력...";
  const cleanLabel = label.replace(/[\uD800-\uDFFF]./g, " ").trim();
  const ttsText = isKid
    ? `${cleanLabel}. ${desc} 예를 들면, ${kid?.placeholder ?? ""}`
    : "";
  return (
    <div className={`glass-card rounded-xl p-4 ${tall ? "h-full min-h-[200px]" : "min-h-[100px]"} flex flex-col`} data-testid={`cell-bmc-${field.key}`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-base font-bold text-cyan-300" style={{ textShadow: "0 0 12px rgba(0,209,255,0.55)" }}>{label}</p>
            {isKid && (
              <KidTtsButton
                text={ttsText}
                testId={`button-tts-bmc-${field.key}`}
              />
            )}
          </div>
          <p className="text-sm text-yellow-200" style={{ textShadow: "0 0 8px rgba(250,204,21,0.35)" }}>{desc}</p>
        </div>
        <button
          onClick={() => onAiAssist(field.key)}
          disabled={streaming}
          className="p-2 rounded-md bg-purple-500/20 text-purple-200 hover:bg-purple-500/30 transition-colors disabled:opacity-50 border border-purple-400/40"
          data-testid={`button-ai-${field.key}`}
        >
          {activeField === field.key && streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
        </button>
      </div>
      <Textarea
        value={canvasData[field.key] || ""}
        onChange={(e) => setCanvasData((prev) => ({ ...prev, [field.key]: e.target.value }))}
        placeholder={placeholder}
        className="flex-1 bg-transparent border-0 text-white placeholder:text-gray-600 text-sm resize-none p-0 focus-visible:ring-0 min-h-[60px]"
        data-testid={`input-bmc-${field.key}`}
      />
    </div>
  );
}
