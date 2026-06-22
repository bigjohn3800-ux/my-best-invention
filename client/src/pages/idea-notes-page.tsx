import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/navbar";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Lightbulb,
  Rocket,
  BarChart3,
  FileDown,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Award,
  Edit3,
  Sparkles,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import ShareButton from "@/components/share-button";
import { useState, useRef, useCallback } from "react";
import { Link } from "wouter";
import type { InventionProject, BusinessCanvas, DiagnosticResult } from "@shared/schema";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

function ExpandableSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-cyan-400 font-medium w-full"
        data-testid={`button-expand-${title}`}
      >
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {open ? "접기" : "상세 보기"}
      </button>
      {open && <div className="mt-3 space-y-2 text-sm text-gray-300">{children}</div>}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-muted-foreground">{label}:</span>{" "}
      <span className="text-gray-200">{value}</span>
    </div>
  );
}

function InventionCard({ project }: { project: InventionProject }) {
  const statusMap: Record<string, string> = { draft: "초안", complete: "완료", completed: "완료", "in-progress": "진행중" };
  return (
    <div className="glass-card rounded-xl p-6" data-testid={`card-invention-${project.id}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-white font-semibold" data-testid={`text-invention-title-${project.id}`}>{project.title}</h3>
            <p className="text-xs text-muted-foreground">
              {new Date(project.createdAt).toLocaleDateString("ko-KR")}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs" data-testid={`badge-invention-status-${project.id}`}>
          {statusMap[project.status || "draft"] || project.status}
        </Badge>
      </div>
      {project.problem && (
        <p className="mt-3 text-sm text-gray-400 line-clamp-2">{project.problem}</p>
      )}
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <Link href={`/invention-studio?projectId=${project.id}`}>
          <Button size="sm" variant="outline" className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 text-xs" data-testid={`button-continue-invention-${project.id}`}>
            <Edit3 className="w-3 h-3 mr-1" />
            이어서 작업
          </Button>
        </Link>
        <ShareButton
          type="invention"
          refId={project.id}
          title={project.title}
          summary={project.problem || project.solution || undefined}
          payload={{
            highlights: [
              { label: "해결할 문제", value: project.problem || "" },
              { label: "해결 방법", value: project.solution || "" },
              { label: "대상", value: project.target || "" },
            ].filter((h) => h.value),
            body: project.patentDraft || project.trizNotes || undefined,
          }}
        />
      </div>
      <ExpandableSection title={`invention-${project.id}`}>
        <DetailRow label="해결할 문제" value={project.problem} />
        <DetailRow label="해결 방법" value={project.solution} />
        <DetailRow label="대상" value={project.target} />
        <DetailRow label="구체적 방법" value={project.method} />
        {project.scamperNotes && Object.keys(project.scamperNotes).length > 0 && (
          <div>
            <span className="text-muted-foreground">SCAMPER 노트:</span>
            <div className="ml-3 mt-1 space-y-1">
              {Object.entries(project.scamperNotes).map(([key, val]) => (
                <div key={key} className="text-xs">
                  <span className="text-cyan-400">{key}:</span> {val}
                </div>
              ))}
            </div>
          </div>
        )}
        <DetailRow label="TRIZ 분석" value={project.trizNotes} />
        {project.patentDraft && (
          <div>
            <span className="text-muted-foreground">특허 명세서 초안:</span>
            <div className="mt-1 text-xs whitespace-pre-wrap bg-white/5 rounded-lg p-3 max-h-60 overflow-y-auto">
              {project.patentDraft}
            </div>
          </div>
        )}
      </ExpandableSection>
    </div>
  );
}

function CanvasCard({ canvas }: { canvas: BusinessCanvas }) {
  const bmcFields: { key: keyof BusinessCanvas; label: string }[] = [
    { key: "valueProposition", label: "가치 제안" },
    { key: "customerSegments", label: "고객 세그먼트" },
    { key: "channels", label: "채널" },
    { key: "customerRelationships", label: "고객 관계" },
    { key: "revenueStreams", label: "수익원" },
    { key: "keyResources", label: "핵심 자원" },
    { key: "keyActivities", label: "핵심 활동" },
    { key: "keyPartners", label: "핵심 파트너" },
    { key: "costStructure", label: "비용 구조" },
  ];

  return (
    <div className="glass-card rounded-xl p-6" data-testid={`card-canvas-${canvas.id}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
          <Rocket className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-white font-semibold" data-testid={`text-canvas-title-${canvas.id}`}>{canvas.title}</h3>
          <p className="text-xs text-muted-foreground">
            {new Date(canvas.createdAt).toLocaleDateString("ko-KR")}
          </p>
        </div>
      </div>
      {canvas.valueProposition && (
        <p className="mt-3 text-sm text-gray-400 line-clamp-2">{canvas.valueProposition}</p>
      )}
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <Link href={`/startup-lab?canvasId=${canvas.id}`}>
          <Button size="sm" variant="outline" className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 text-xs" data-testid={`button-continue-canvas-${canvas.id}`}>
            <Edit3 className="w-3 h-3 mr-1" />
            이어서 작업
          </Button>
        </Link>
        <ShareButton
          type="canvas"
          refId={canvas.id}
          title={canvas.title}
          summary={canvas.valueProposition || undefined}
          payload={{
            highlights: [
              { label: "가치 제안", value: canvas.valueProposition || "" },
              { label: "고객 세그먼트", value: canvas.customerSegments || "" },
              { label: "수익원", value: canvas.revenueStreams || "" },
            ].filter((h) => h.value),
            body: canvas.pitchDeck || canvas.aiFeedback || undefined,
          }}
        />
      </div>
      <ExpandableSection title={`canvas-${canvas.id}`}>
        {bmcFields.map(({ key, label }) => (
          <DetailRow key={key} label={label} value={canvas[key] as string | null} />
        ))}
        {canvas.aiFeedback && (
          <div>
            <span className="text-muted-foreground">AI 피드백:</span>
            <div className="mt-1 text-xs whitespace-pre-wrap bg-white/5 rounded-lg p-3 max-h-40 overflow-y-auto">
              {canvas.aiFeedback}
            </div>
          </div>
        )}
        {canvas.pitchDeck && (
          <div>
            <span className="text-muted-foreground">피칭덱:</span>
            <div className="mt-1 text-xs whitespace-pre-wrap bg-white/5 rounded-lg p-3 max-h-60 overflow-y-auto">
              {canvas.pitchDeck}
            </div>
          </div>
        )}
      </ExpandableSection>
    </div>
  );
}

function DiagnosticCard({ result }: { result: DiagnosticResult }) {
  const typeLabel = result.type === "creativity" ? "창의성 진단" : "창업 지수 진단";
  const categoryLabels: Record<string, string> = {
    fluency: "유창성", flexibility: "융통성", originality: "독창성",
    elaboration: "정교성", openness: "개방성",
    feasibility: "실현가능성", profitability: "수익성", growth: "성장성",
    marketability: "시장성", innovation: "혁신성",
  };

  return (
    <div className="glass-card rounded-xl p-6" data-testid={`card-diagnostic-${result.id}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
          <BarChart3 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-white font-semibold" data-testid={`text-diagnostic-type-${result.id}`}>{typeLabel}</h3>
          <p className="text-xs text-muted-foreground">
            {new Date(result.createdAt).toLocaleDateString("ko-KR")}
          </p>
        </div>
      </div>
      {result.scores && (
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(result.scores).map(([key, val]) => (
            <span key={key} className="text-xs px-2 py-1 rounded-md bg-white/5 text-gray-300">
              {categoryLabels[key] || key}: {val}/10
            </span>
          ))}
        </div>
      )}
      <div className="mt-3">
        <ShareButton
          type="diagnosis"
          refId={result.id}
          title={`${typeLabel} 결과`}
          summary={result.scores ? Object.entries(result.scores).map(([k, v]) => `${categoryLabels[k] || k} ${v}/10`).join(", ") : undefined}
          payload={{
            highlights: result.scores ? Object.entries(result.scores).map(([k, v]) => ({ label: categoryLabels[k] || k, value: `${v} / 10` })) : [],
            body: result.aiAnalysis || undefined,
          }}
        />
      </div>
      <ExpandableSection title={`diagnostic-${result.id}`}>
        {result.aiAnalysis && (
          <div>
            <span className="text-muted-foreground">AI 분석:</span>
            <div className="mt-1 text-xs whitespace-pre-wrap bg-white/5 rounded-lg p-3 max-h-60 overflow-y-auto">
              {result.aiAnalysis}
            </div>
          </div>
        )}
      </ExpandableSection>
    </div>
  );
}

function PrintPortfolio({
  printRef,
  user,
  inventions,
  canvases,
  diagnostics,
}: {
  printRef: React.RefObject<HTMLDivElement>;
  user: { displayName?: string | null; username: string } | null;
  inventions: InventionProject[];
  canvases: BusinessCanvas[];
  diagnostics: DiagnosticResult[];
}) {
  const categoryLabels: Record<string, string> = {
    fluency: "유창성", flexibility: "융통성", originality: "독창성",
    elaboration: "정교성", openness: "개방성",
    feasibility: "실현가능성", profitability: "수익성", growth: "성장성",
    marketability: "시장성", innovation: "혁신성",
  };

  return (
    <div ref={printRef} className="hidden" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
      <div style={{ padding: "40px", background: "white", color: "#1a1a2e" }}>
        <div style={{
          border: "3px double #0e4166",
          padding: "40px",
          position: "relative",
        }}>
          <div style={{
            border: "1px solid #0e4166",
            padding: "30px",
          }}>
            <div style={{ textAlign: "center", marginBottom: "30px" }}>
              <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px", letterSpacing: "4px" }}>
                MYBEST AI INVENTION & STARTUP
              </div>
              <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#0e4166", marginBottom: "4px" }}>
                마이베스트 발명창업
              </h1>
              <h2 style={{ fontSize: "22px", fontWeight: "bold", color: "#0e4166", marginBottom: "16px" }}>
                인증 포트폴리오
              </h2>
              <div style={{ width: "60px", height: "2px", background: "linear-gradient(90deg, #00D1FF, #7000FF)", margin: "0 auto 16px" }} />
              <p style={{ fontSize: "16px", color: "#333" }}>
                {user?.displayName || user?.username}
              </p>
              <p style={{ fontSize: "12px", color: "#888" }}>
                발행일: {new Date().toLocaleDateString("ko-KR")}
              </p>
            </div>

            {inventions.length > 0 && (
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#0e4166", borderBottom: "1px solid #ddd", paddingBottom: "6px", marginBottom: "12px" }}>
                  발명 프로젝트
                </h3>
                {inventions.map((p) => (
                  <div key={p.id} style={{ marginBottom: "16px", paddingLeft: "12px", borderLeft: "3px solid #00D1FF" }}>
                    <div style={{ fontWeight: "bold", fontSize: "14px" }}>{p.title}</div>
                    {p.problem && <div style={{ fontSize: "12px", color: "#555", marginTop: "4px" }}>문제: {p.problem}</div>}
                    {p.solution && <div style={{ fontSize: "12px", color: "#555" }}>해결방법: {p.solution}</div>}
                    {p.patentDraft && <div style={{ fontSize: "11px", color: "#777", marginTop: "4px" }}>특허 명세서 초안 작성 완료</div>}
                  </div>
                ))}
              </div>
            )}

            {canvases.length > 0 && (
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#0e4166", borderBottom: "1px solid #ddd", paddingBottom: "6px", marginBottom: "12px" }}>
                  비즈니스 모델 캔버스
                </h3>
                {canvases.map((c) => (
                  <div key={c.id} style={{ marginBottom: "16px", paddingLeft: "12px", borderLeft: "3px solid #7000FF" }}>
                    <div style={{ fontWeight: "bold", fontSize: "14px" }}>{c.title}</div>
                    {c.valueProposition && <div style={{ fontSize: "12px", color: "#555", marginTop: "4px" }}>가치 제안: {c.valueProposition}</div>}
                    {c.revenueStreams && <div style={{ fontSize: "12px", color: "#555" }}>수익원: {c.revenueStreams}</div>}
                    {c.pitchDeck && <div style={{ fontSize: "11px", color: "#777", marginTop: "4px" }}>IR 피칭덱 작성 완료</div>}
                  </div>
                ))}
              </div>
            )}

            {diagnostics.length > 0 && (
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#0e4166", borderBottom: "1px solid #ddd", paddingBottom: "6px", marginBottom: "12px" }}>
                  역량 진단 결과
                </h3>
                {diagnostics.map((d) => (
                  <div key={d.id} style={{ marginBottom: "16px", paddingLeft: "12px", borderLeft: "3px solid #10b981" }}>
                    <div style={{ fontWeight: "bold", fontSize: "14px" }}>
                      {d.type === "creativity" ? "창의성 진단" : "창업 지수 진단"}
                    </div>
                    {d.scores && (
                      <div style={{ fontSize: "12px", color: "#555", marginTop: "4px" }}>
                        {Object.entries(d.scores).map(([k, v]) => `${categoryLabels[k] || k}: ${v}/10`).join(" | ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ textAlign: "center", marginTop: "40px", paddingTop: "20px", borderTop: "1px solid #ddd" }}>
              <p style={{ fontSize: "12px", color: "#888" }}>
                본 포트폴리오는 마이베스트 발명창업 플랫폼에서 수행한 학습 및 프로젝트 결과를 정리한 것입니다.
              </p>
              <p style={{ fontSize: "11px", color: "#aaa", marginTop: "4px" }}>
                © {new Date().getFullYear()} 마이베스트 발명창업
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function IdeaNotesPage() {
  const { user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null!)

  const { data: inventions, isLoading: loadingInventions } = useQuery<InventionProject[]>({
    queryKey: ["/api/invention-projects"],
    enabled: !!user,
  });

  const { data: canvases, isLoading: loadingCanvases } = useQuery<BusinessCanvas[]>({
    queryKey: ["/api/business-canvases"],
    enabled: !!user,
  });

  const { data: diagnostics, isLoading: loadingDiagnostics } = useQuery<DiagnosticResult[]>({
    queryKey: ["/api/diagnostic-results"],
    enabled: !!user,
  });

  const isLoading = loadingInventions || loadingCanvases || loadingDiagnostics;
  const hasData = (inventions && inventions.length > 0) || (canvases && canvases.length > 0) || (diagnostics && diagnostics.length > 0);

  const [exporting, setExporting] = useState(false);

  const handleExportPdf = useCallback(async () => {
    if (!printRef.current || exporting) return;
    setExporting(true);
    try {
      const el = printRef.current;
      el.style.display = "block";
      el.style.position = "absolute";
      el.style.left = "-9999px";
      el.style.top = "0";
      el.style.width = "800px";

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      el.style.display = "";
      el.style.position = "";
      el.style.left = "";
      el.style.top = "";
      el.style.width = "";

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - 20);

      while (heightLeft > 0) {
        position = -(pageHeight - 20) * (Math.ceil((imgHeight - heightLeft) / (pageHeight - 20))) + 10;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - 20);
      }

      pdf.save("마이베스트_AI발명창업_포트폴리오.pdf");
    } catch (err) {
      console.error("PDF export failed:", err);
    }
    setExporting(false);
  }, [exporting]);

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="relative overflow-hidden pt-24 pb-12 px-4">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-[radial-gradient(ellipse,rgba(0,209,255,0.1),transparent_60%)]" />

        <motion.div
          className="relative z-10 max-w-4xl mx-auto text-center pt-12"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="mb-4">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium glass-card text-cyan-300 border border-cyan-500/20" data-testid="badge-notes">
              <BookOpen className="w-3.5 h-3.5" />
              나의 학습 포트폴리오
            </span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4" data-testid="text-notes-title">
            <span className="text-white">나의 </span>
            <span className="gradient-text">아이디어 노트</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8" data-testid="text-notes-subtitle">
            AI와 함께 만들어낸 모든 발명 아이디어, 비즈니스 모델, 역량 진단 결과를 한눈에
          </motion.p>

          {user && hasData && (
            <motion.div variants={fadeUp}>
              <Button
                onClick={handleExportPdf}
                className="gradient-primary text-white font-semibold rounded-xl neon-glow"
                size="lg"
                disabled={exporting}
                data-testid="button-export-pdf"
              >
                {exporting ? (
                  <><span className="w-5 h-5 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> PDF 생성 중...</>
                ) : (
                  <><FileDown className="w-5 h-5 mr-2" /> 포트폴리오 PDF 내보내기</>
                )}
              </Button>
            </motion.div>
          )}
        </motion.div>
      </section>

      <section className="pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          {!user ? (
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center py-16">
              <div className="glass-card rounded-2xl p-12 max-w-md mx-auto">
                <Award className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-3" data-testid="text-login-required">로그인이 필요합니다</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  나의 아이디어 노트를 확인하려면 먼저 로그인해주세요.
                </p>
                <Link href="/auth">
                  <Button className="gradient-primary text-white" data-testid="button-go-login">
                    로그인하기
                  </Button>
                </Link>
              </div>
            </motion.div>
          ) : isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          ) : !hasData ? (
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="py-8">
              <EmptyState
                icon={Sparkles}
                title="첫 아이디어를 만들어보세요"
                description="AI 발명 스튜디오·창업랩·진단 도구로 첫 결과물을 만들면 이곳에 자동으로 저장됩니다."
                size="lg"
                className="max-w-2xl mx-auto"
                testId="empty-state-idea-notes"
              >
                <Link href="/invention-studio">
                  <Button className="gradient-primary text-white w-full sm:w-auto" data-testid="button-go-invention">
                    <Lightbulb className="w-4 h-4 mr-2" />
                    발명 스튜디오 시작
                  </Button>
                </Link>
                <Link href="/startup-lab">
                  <Button variant="outline" className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 w-full sm:w-auto" data-testid="button-go-startup">
                    <Rocket className="w-4 h-4 mr-2" />
                    창업 랩 시작
                  </Button>
                </Link>
                <Link href="/diagnosis">
                  <Button variant="outline" className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 w-full sm:w-auto" data-testid="button-go-diagnosis">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    창의성/창업 진단
                  </Button>
                </Link>
              </EmptyState>
            </motion.div>
          ) : (
            <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-10">
              <motion.div variants={fadeUp}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl font-bold text-white" data-testid="text-section-inventions">
                    발명 프로젝트 <span className="text-muted-foreground text-sm font-normal ml-2">({inventions?.length || 0})</span>
                  </h2>
                </div>
                {inventions && inventions.length > 0 ? (
                  <div className="space-y-4">
                    {inventions.map((p) => (
                      <InventionCard key={p.id} project={p} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Lightbulb}
                    title="아직 저장된 발명 프로젝트가 없어요"
                    description="SCAMPER·TRIZ·특허 초안을 저장하면 여기에 모입니다."
                    iconColor="text-cyan-400"
                    iconBg="bg-cyan-500/10"
                    size="sm"
                    testId="empty-section-inventions"
                  >
                    <Link href="/invention-studio">
                      <Button size="sm" variant="outline" className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10" data-testid="button-empty-go-invention">
                        <Lightbulb className="w-3.5 h-3.5 mr-1.5" />
                        발명 시작하기
                      </Button>
                    </Link>
                  </EmptyState>
                )}
              </motion.div>

              <motion.div variants={fadeUp}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <Rocket className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl font-bold text-white" data-testid="text-section-canvases">
                    비즈니스 모델 캔버스 <span className="text-muted-foreground text-sm font-normal ml-2">({canvases?.length || 0})</span>
                  </h2>
                </div>
                {canvases && canvases.length > 0 ? (
                  <div className="space-y-4">
                    {canvases.map((c) => (
                      <CanvasCard key={c.id} canvas={c} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Rocket}
                    title="아직 저장된 BMC가 없어요"
                    description="9칸 비즈니스 모델 캔버스와 IR 피칭덱을 작성해보세요."
                    iconColor="text-purple-400"
                    iconBg="bg-purple-500/10"
                    size="sm"
                    testId="empty-section-canvases"
                  >
                    <Link href="/startup-lab">
                      <Button size="sm" variant="outline" className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10" data-testid="button-empty-go-startup">
                        <Rocket className="w-3.5 h-3.5 mr-1.5" />
                        창업 랩 열기
                      </Button>
                    </Link>
                  </EmptyState>
                )}
              </motion.div>

              <motion.div variants={fadeUp}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl font-bold text-white" data-testid="text-section-diagnostics">
                    역량 진단 결과 <span className="text-muted-foreground text-sm font-normal ml-2">({diagnostics?.length || 0})</span>
                  </h2>
                </div>
                {diagnostics && diagnostics.length > 0 ? (
                  <div className="space-y-4">
                    {diagnostics.map((d) => (
                      <DiagnosticCard key={d.id} result={d} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={BarChart3}
                    title="아직 진단 결과가 없어요"
                    description="창의성/창업 지수를 측정하면 레이더 차트와 AI 분석이 저장됩니다."
                    iconColor="text-emerald-400"
                    iconBg="bg-emerald-500/10"
                    size="sm"
                    testId="empty-section-diagnostics"
                  >
                    <Link href="/diagnosis">
                      <Button size="sm" variant="outline" className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10" data-testid="button-empty-go-diagnosis">
                        <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                        진단 받으러 가기
                      </Button>
                    </Link>
                  </EmptyState>
                )}
              </motion.div>
            </motion.div>
          )}
        </div>
      </section>

      <PrintPortfolio
        printRef={printRef}
        user={user}
        inventions={inventions || []}
        canvases={canvases || []}
        diagnostics={diagnostics || []}
      />
    </div>
  );
}
