import { motion } from "framer-motion";
import { Link } from "wouter";
import { BookOpen, Lightbulb, Rocket, BarChart3, Brain, Wrench, GraduationCap, StickyNote, Users, ChevronRight, Shield, Award, Sparkles, FileText, Presentation, Target, ArrowRight, Play, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import introVideoPath from "@assets/generated_videos/mybest_invention_platform_intro.mp4";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const sections = [
  {
    id: "invention-studio",
    title: "AI 발명 스튜디오",
    icon: Lightbulb,
    color: "cyan",
    description: "SCAMPER, TRIZ 기법과 AI를 결합하여 체계적으로 발명 아이디어를 발전시키고, 특허 명세서 초안까지 자동으로 생성합니다.",
    steps: [
      { step: "1", title: "아이디어 입력", desc: "해결하고 싶은 문제나 발명 아이디어를 입력하세요. 제목, 문제 상황, 해결책, 대상, 방법을 구체적으로 작성할수록 좋은 결과를 얻을 수 있습니다." },
      { step: "2", title: "SCAMPER 분석", desc: "AI가 대체(S), 결합(C), 응용(A), 수정(M), 다른용도(P), 제거(E), 재배열(R) 7가지 관점으로 아이디어를 확장합니다." },
      { step: "3", title: "TRIZ 분석", desc: "기술적 모순을 해결하는 40가지 발명 원리 중 적합한 원리를 AI가 추천하고 적용 방법을 제안합니다." },
      { step: "4", title: "특허 초안 생성", desc: "발명의 명칭, 기술 분야, 배경, 해결과제, 해결수단, 효과를 포함한 특허 명세서 초안을 AI가 자동 작성합니다." },
    ],
    link: "/invention-studio",
  },
  {
    id: "startup-lab",
    title: "AI 창업 랩",
    icon: Rocket,
    color: "purple",
    description: "비즈니스 모델 캔버스(BMC)를 AI와 함께 완성하고, 투자자 대상 IR 피칭덱을 자동으로 생성합니다.",
    steps: [
      { step: "1", title: "비즈니스 아이디어 입력", desc: "창업 아이디어의 제목과 핵심 가치 제안을 입력하세요." },
      { step: "2", title: "BMC 9블록 작성", desc: "핵심파트너, 핵심활동, 가치제안, 고객관계, 고객세그먼트, 핵심자원, 채널, 비용구조, 수익모델을 AI 도움으로 채웁니다." },
      { step: "3", title: "AI 피드백", desc: "작성된 BMC의 논리적 일관성, 보완 포인트, 경쟁 우위를 AI가 분석하고 피드백합니다." },
      { step: "4", title: "IR 피칭덱 생성", desc: "문제-해결-시장-비즈니스모델-팀-요청 구조의 투자 제안서를 AI가 자동 생성합니다." },
    ],
    link: "/startup-lab",
  },
  {
    id: "diagnosis",
    title: "역량 진단",
    icon: BarChart3,
    color: "emerald",
    description: "창의성 5대 영역 진단과 창업 역량 진단을 통해 나의 강점과 약점을 파악하고, AI가 맞춤형 성장 방향을 제시합니다.",
    steps: [
      { step: "1", title: "진단 유형 선택", desc: "창의성 진단 또는 창업 역량 진단 중 원하는 진단을 선택합니다." },
      { step: "2", title: "문항 응답", desc: "각 영역별 문항에 1~5점 척도로 솔직하게 응답합니다." },
      { step: "3", title: "결과 분석", desc: "레이더 차트로 영역별 점수를 시각화하고, AI가 상세 분석 리포트를 제공합니다." },
    ],
    link: "/diagnosis",
  },
  {
    id: "courses",
    title: "교육 과정",
    icon: GraduationCap,
    color: "blue",
    description: "수준별(초급/중급/고급) 맞춤 커리큘럼으로 발명과 창업을 단계적으로 학습합니다. 각 과정은 이론과 실습이 결합된 스텝으로 구성됩니다.",
    steps: [
      { step: "1", title: "트랙 선택", desc: "발명 트랙 또는 창업 트랙을 선택합니다." },
      { step: "2", title: "수준별 과정", desc: "초급(초등학생), 중급(중·고등학생), 고급(대학·일반) 중 수준에 맞는 과정을 선택합니다." },
      { step: "3", title: "단계별 학습", desc: "각 과정의 스텝을 순서대로 학습하고 완료 표시를 합니다." },
      { step: "4", title: "수료증 발급", desc: "모든 스텝을 완료하면 대시보드에서 디지털 수료증을 다운로드할 수 있습니다." },
    ],
    link: "/invention",
  },
  {
    id: "idea-notes",
    title: "My Idea 노트",
    icon: StickyNote,
    color: "yellow",
    description: "AI 도구 사용 중 떠오른 아이디어와 AI 분석 결과를 자동으로 저장하고, 언제든 다시 확인할 수 있습니다.",
    steps: [
      { step: "1", title: "자동 저장", desc: "AI 발명 스튜디오, 창업 랩에서 생성된 결과가 자동으로 저장됩니다." },
      { step: "2", title: "아이디어 관리", desc: "저장된 아이디어를 검토하고, 이어서 발전시킬 수 있습니다." },
    ],
    link: "/idea-notes",
  },
  {
    id: "badges",
    title: "배지 시스템",
    icon: Award,
    color: "amber",
    description: "다양한 활동을 수행하면 배지를 획득할 수 있습니다. 배지는 대시보드에서 확인할 수 있으며, 학습 동기를 부여합니다.",
    steps: [
      { step: "🏅", title: "첫 발명 / 첫 BMC", desc: "첫 번째 발명 프로젝트 또는 비즈니스 캔버스를 생성하면 획득" },
      { step: "⭐", title: "5회 달성 배지", desc: "발명 프로젝트 또는 BMC를 5개 이상 생성하면 획득" },
      { step: "🏆", title: "마스터 배지", desc: "특허 명세서 생성, IR 피치덱 생성, 전 과정 수료 시 획득" },
    ],
    link: "/dashboard",
  },
];

export default function GuidePage() {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    cyan: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
    yellow: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="relative overflow-hidden pt-24 pb-16 px-4">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <motion.div className="relative z-10 max-w-4xl mx-auto text-center pt-12" initial="hidden" animate="visible" variants={stagger}>
          <motion.div variants={fadeUp} className="mb-4">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium glass-card text-cyan-300 border border-cyan-500/20">
              <BookOpen className="w-3.5 h-3.5" />
              활용 매뉴얼
            </span>
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4" data-testid="text-guide-title">
            <span className="gradient-text">플랫폼</span>
            <span className="text-white"> 활용 가이드</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-2xl mx-auto">
            마이베스트 AI발명창업의 주요 기능과 사용법을 안내합니다
          </motion.p>
        </motion.div>
      </section>

      <section className="py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <div className="glass-card rounded-2xl overflow-hidden" data-testid="video-guide-intro">
              <video
                src={introVideoPath}
                controls
                muted
                playsInline
                className="w-full aspect-video object-cover"
              />
            </div>
            <p className="text-center text-sm text-muted-foreground mt-3">
              <Play className="w-3.5 h-3.5 inline mr-1" />
              플랫폼 소개 영상을 시청하고 주요 기능을 한눈에 파악하세요
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="flex flex-wrap justify-center gap-2 mb-12">
            {sections.map((s) => (
              <motion.a
                key={s.id}
                variants={fadeUp}
                href={`#${s.id}`}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium glass-card ${colorMap[s.color].text} border ${colorMap[s.color].border} hover:bg-white/5 transition-colors`}
                data-testid={`link-guide-nav-${s.id}`}
              >
                <s.icon className="w-3.5 h-3.5" />
                {s.title}
              </motion.a>
            ))}
          </motion.div>
        </div>
      </section>

      {sections.map((section, si) => (
        <section key={section.id} id={section.id} className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={stagger}>
              <motion.div variants={fadeUp} className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-xl ${colorMap[section.color].bg} flex items-center justify-center`}>
                  <section.icon className={`w-6 h-6 ${colorMap[section.color].text}`} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white" data-testid={`text-guide-section-${section.id}`}>{section.title}</h2>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </div>
              </motion.div>

              <motion.div variants={fadeUp} className="glass-card rounded-2xl p-6 mb-4">
                <div className="space-y-4">
                  {section.steps.map((step, i) => (
                    <div key={i} className="flex gap-4" data-testid={`guide-step-${section.id}-${i}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${colorMap[section.color].bg} ${colorMap[section.color].text} border ${colorMap[section.color].border}`}>
                        {step.step}
                      </div>
                      <div className="flex-1 pb-3 border-b border-white/5 last:border-0">
                        <h4 className="text-sm font-semibold text-white mb-1">{step.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div variants={fadeUp}>
                <Link href={section.link}>
                  <Button variant="outline" className={`border ${colorMap[section.color].border} ${colorMap[section.color].text} hover:bg-white/5`} data-testid={`button-guide-go-${section.id}`}>
                    {section.title} 바로가기 <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>
      ))}

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="glass-card rounded-2xl p-8 text-center neon-glow">
            <Sparkles className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-3">도움이 더 필요하신가요?</h3>
            <p className="text-muted-foreground mb-6">단체 활용 문의 또는 기타 질문은 단체 활용 문의 페이지에서 문의해주세요</p>
            <Link href="/franchise">
              <Button className="gradient-primary text-white font-medium rounded-xl" data-testid="button-guide-franchise">
                <Building2 className="w-4 h-4 mr-2" />
                단체 활용 문의
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
