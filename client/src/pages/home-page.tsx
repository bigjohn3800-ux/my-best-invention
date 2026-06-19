import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Lightbulb,
  LockKeyhole,
  MessageSquareText,
  Rocket,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import Navbar from "@/components/navbar";
import OnboardingModal from "@/components/onboarding-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import introVideoPath from "@assets/generated_videos/mybest_invention_platform_intro.mp4";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

const operatingFlow = [
  {
    title: "아이디어 접수",
    desc: "문제, 대상 고객, 해결 방식, 차별점을 한 곳에 정리합니다.",
    icon: Lightbulb,
    accent: "text-cyan-300 bg-cyan-500/10",
  },
  {
    title: "IP 준비도 점검",
    desc: "SCAMPER, TRIZ, 특허 명세서 초안으로 보호 가능성을 좁힙니다.",
    icon: ShieldCheck,
    accent: "text-amber-300 bg-amber-500/10",
  },
  {
    title: "시장 검증",
    desc: "고객 가설, 경쟁 대안, 구매 이유를 사업화 언어로 바꿉니다.",
    icon: Search,
    accent: "text-emerald-300 bg-emerald-500/10",
  },
  {
    title: "사업화 패키징",
    desc: "BMC, IR, 정부지원, 멘토 리뷰까지 실행 자료로 묶습니다.",
    icon: Rocket,
    accent: "text-purple-300 bg-purple-500/10",
  },
];

const readiness = [
  { label: "문제 명확도", value: 86, color: "bg-cyan-400" },
  { label: "특허 준비도", value: 72, color: "bg-amber-400" },
  { label: "시장 검증", value: 64, color: "bg-emerald-400" },
  { label: "IR 완성도", value: 58, color: "bg-purple-400" },
];

const paidSignals = [
  "비공개 발명 프로젝트 저장",
  "특허 초안과 BMC 자동 생성",
  "멘토 검토 요청과 피드백 기록",
  "정부지원·대회 제출용 문서 다운로드",
  "운영자용 회원·프로젝트 관리",
];

const packages = [
  {
    name: "Inventor",
    price: "무료 체험",
    desc: "아이디어를 처음 정리하는 개인 발명가용",
    points: ["AI 발명 체험", "기본 진단", "프로젝트 초안 저장"],
    href: "/auth",
  },
  {
    name: "Venture Builder",
    price: "유료 준비",
    desc: "특허·시장·IR까지 이어가는 창업 준비팀용",
    points: ["사업화 로드맵", "BMC/IR 생성", "전문가 리뷰 요청"],
    href: "/pricing",
    highlighted: true,
  },
  {
    name: "Institution",
    price: "도입 문의",
    desc: "학교, 기관, 캠프, 창업 교육 운영자용",
    points: ["단체 계정", "관리자 대시보드", "교육 결과 관리"],
    href: "/franchise",
  },
];

function AiTrialWidget() {
  const [idea, setIdea] = useState("");
  const [result, setResult] = useState("");
  const { toast } = useToast();

  const trialMutation = useMutation({
    mutationFn: async (ideaText: string) => {
      const res = await apiRequest("POST", "/api/ai/quick-trial", { idea: ideaText });
      return await res.json();
    },
    onSuccess: (data: { result: string }) => setResult(data.result),
    onError: (error: Error) => {
      if (error.message.includes("GUEST_LIMIT_REACHED") || error.message.includes("403")) {
        toast({ title: "체험 횟수를 초과했습니다", description: "회원가입 후 계속 이용할 수 있습니다.", variant: "destructive" });
      } else {
        toast({ title: "분석 중 오류가 발생했습니다", variant: "destructive" });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (idea.trim()) trialMutation.mutate(idea.trim());
  };

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">Quick validation</p>
          <h3 className="text-xl font-bold text-white mt-1">아이디어 1분 진단</h3>
          <p className="text-sm text-muted-foreground mt-1">한 줄 아이디어를 입력하면 가능성, 위험, 다음 행동을 바로 정리합니다.</p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-cyan-500/15 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-cyan-300" />
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2" data-testid="form-ai-trial">
        <Input
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="예: 비 오는 날 젖지 않는 스마트 우산 거치대"
          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
          disabled={trialMutation.isPending}
          data-testid="input-ai-trial"
        />
        <Button type="submit" className="gradient-primary text-white shrink-0" disabled={!idea.trim() || trialMutation.isPending} data-testid="button-ai-trial">
          {trialMutation.isPending ? "분석 중" : "분석"}
          <Send className="w-4 h-4 ml-2" />
        </Button>
      </form>
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-gray-100 whitespace-pre-wrap leading-relaxed">{result}</p>
            <Link href="/auth">
              <Button size="sm" className="mt-4 gradient-primary text-white" data-testid="button-trial-signup">
                프로젝트로 저장하기 <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const { data: publicStats } = useQuery<{ totalUsers: number; totalProjects: number; totalAnalyses: number }>({
    queryKey: ["/api/stats/public"],
  });

  return (
    <div className="min-h-screen">
      <OnboardingModal />
      <Navbar />

      <section className="relative overflow-hidden px-4 pt-24 pb-10 sm:pt-28">
        <div className="absolute inset-0 grid-bg opacity-35" />
        <div className="relative z-10 max-w-7xl mx-auto">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="grid lg:grid-cols-[1.02fr_0.98fr] gap-8 lg:gap-10 items-center min-h-[calc(100vh-7rem)]">
            <motion.div variants={fadeUp}>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/35 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-200 mb-5">
                <LockKeyhole className="w-3.5 h-3.5" />
                발명 아이디어는 비공개 프로젝트로 관리됩니다
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-normal leading-[1.08] text-white" data-testid="text-hero-title">
                Invention Ventures Hub
              </h1>
              <p className="mt-5 text-lg sm:text-xl text-muted-foreground max-w-2xl">
                발명 아이디어를 특허 검토, 시장 검증, 사업계획, IR 자료까지 이어주는 AI 기반 발명 사업화 워크스페이스입니다.
              </p>
              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <Link href={user ? "/invention-studio" : "/auth"}>
                  <Button size="lg" className="gradient-primary text-white font-semibold px-6" data-testid="button-start-project">
                    발명 프로젝트 시작 <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" variant="outline" className="border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/10 px-6" data-testid="button-view-pricing">
                    패키지 보기
                  </Button>
                </Link>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-3 max-w-xl">
                {[
                  { label: "사용자", value: publicStats?.totalUsers ?? 500 },
                  { label: "프로젝트", value: publicStats?.totalProjects ?? 120 },
                  { label: "AI 분석", value: publicStats?.totalAnalyses ?? 900 },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-2xl font-bold text-white">{stat.value.toLocaleString()}+</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="space-y-4">
              <div className="glass-card rounded-2xl overflow-hidden">
                <video src={introVideoPath} controls muted loop playsInline className="w-full aspect-video object-cover" data-testid="video-intro" />
              </div>
              <AiTrialWidget />
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
            <motion.div variants={fadeUp} className="max-w-3xl mb-8">
              <p className="text-sm font-semibold text-cyan-300">Commercialization OS</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2">돈을 내고 쓰는 이유는 결과물이 남기 때문입니다</h2>
              <p className="text-muted-foreground mt-3">
                유사한 발명·스타트업 검증 플랫폼의 공통점은 단순 채팅이 아니라 진행 상태, 증거, 제출 가능한 산출물을 대시보드로 남긴다는 점입니다.
              </p>
            </motion.div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {operatingFlow.map((item) => (
                <motion.div key={item.title} variants={fadeUp} className="glass-card glass-card-hover rounded-2xl p-5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.accent}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mt-5">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[0.92fr_1.08fr] gap-6 items-start">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-emerald-300">Project command center</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">사업화 준비도</h2>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-emerald-300" />
              </div>
            </div>
            <div className="mt-6 space-y-5">
              {readiness.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-white">{item.label}</span>
                    <span className="text-muted-foreground">{item.value}%</span>
                  </div>
                  <Progress value={item.value} className="h-2" />
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4">
              <p className="text-sm font-semibold text-amber-200">다음 추천 행동</p>
              <p className="text-sm text-muted-foreground mt-1">경쟁 대안 3개와 예상 구매자를 먼저 정리하면 특허·IR 문서의 설득력이 올라갑니다.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: "비공개 발명 노트", desc: "아이디어, 문제, 대상, 해결책을 프로젝트 단위로 저장합니다.", icon: FileText },
              { title: "검토 가능한 산출물", desc: "특허 명세서 초안, BMC, IR 피치, 보고서를 내려받습니다.", icon: ClipboardCheck },
              { title: "멘토 리뷰 흐름", desc: "검토 상태와 코멘트를 기록해 다음 액션으로 연결합니다.", icon: MessageSquareText },
              { title: "기관 운영 관리", desc: "회원, 프로젝트, 교육 결과, 권한을 관리자 화면에서 봅니다.", icon: Building2 },
            ].map((item) => (
              <div key={item.title} className="glass-card glass-card-hover rounded-2xl p-5">
                <item.icon className="w-6 h-6 text-cyan-300" />
                <h3 className="text-lg font-semibold text-white mt-4">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-8">
            <div>
              <p className="text-sm font-semibold text-purple-300">Paid-ready packages</p>
              <h2 className="text-3xl font-bold text-white mt-2">개인 발명가부터 기관 교육까지 한 흐름으로</h2>
              <ul className="mt-5 space-y-3">
                {paidSignals.map((signal) => (
                  <li key={signal} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                    {signal}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {packages.map((pkg) => (
                <div key={pkg.name} className={`glass-card rounded-2xl p-5 flex flex-col ${pkg.highlighted ? "ring-2 ring-cyan-400/50" : ""}`}>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-cyan-300">{pkg.name}</p>
                    <h3 className="text-2xl font-bold text-white mt-2">{pkg.price}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{pkg.desc}</p>
                    <div className="mt-5 space-y-2">
                      {pkg.points.map((point) => (
                        <p key={point} className="text-sm text-gray-100 flex gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                          {point}
                        </p>
                      ))}
                    </div>
                  </div>
                  <Link href={pkg.href}>
                    <Button className={`mt-6 w-full ${pkg.highlighted ? "gradient-primary text-white" : "bg-white/10 text-white hover:bg-white/15"}`} data-testid={`button-package-${pkg.name}`}>
                      선택하기
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="max-w-7xl mx-auto glass-card rounded-2xl p-6 sm:p-8">
          <div className="grid lg:grid-cols-[1fr_0.85fr] gap-8 items-center">
            <div>
              <p className="text-sm font-semibold text-amber-300">Roadmap</p>
              <h2 className="text-3xl font-bold text-white mt-2">아이디어에서 구매자와 투자자가 보는 자료까지</h2>
              <p className="text-muted-foreground mt-3">
                발명가가 가장 자주 막히는 지점은 “다음에 무엇을 해야 하는지”입니다. 이 플랫폼은 다음 행동을 단계로 고정해 실행력을 높입니다.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { label: "특허/선행기술", icon: ShieldCheck },
                { label: "고객/문제 검증", icon: Target },
                { label: "BMC/수익모델", icon: TrendingUp },
                { label: "IR/지원사업", icon: Users },
              ].map((item) => (
                <Link key={item.label} href="/invention-studio">
                  <button className="w-full min-h-[72px] rounded-xl border border-white/10 bg-white/[0.04] px-4 text-left hover:bg-white/[0.07] transition-colors">
                    <item.icon className="w-5 h-5 text-cyan-300 mb-2" />
                    <span className="text-sm font-semibold text-white">{item.label}</span>
                  </button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="px-4 py-10 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-bold text-white">마이베스트 발명창업</p>
            <p className="text-sm text-muted-foreground mt-1">발명 아이디어를 사업화 가능한 프로젝트로 바꾸는 AI 워크스페이스</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/legal/terms"><span className="text-gray-300 hover:text-cyan-300 cursor-pointer">이용약관</span></Link>
            <Link href="/legal/privacy"><span className="text-gray-300 hover:text-cyan-300 cursor-pointer">개인정보처리방침</span></Link>
            <Link href="/franchise"><span className="text-gray-300 hover:text-cyan-300 cursor-pointer">도입 문의</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
