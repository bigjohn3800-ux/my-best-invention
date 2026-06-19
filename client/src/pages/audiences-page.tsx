import Navbar from "@/components/navbar";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Sparkles, Users, GraduationCap, BookOpen, Briefcase, Lightbulb, Rocket, Brain, FileText, ArrowRight, Trophy, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Audience {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  color: string;
  icon: typeof Lightbulb;
  description: string;
  benefits: string[];
  recommended: { label: string; href: string; icon: typeof Lightbulb }[];
  primaryCta: { label: string; href: string };
}

const AUDIENCES: Audience[] = [
  {
    id: "elementary",
    emoji: "🧒",
    title: "초등학생",
    subtitle: "재미있게 시작하는 첫 발명",
    color: "yellow",
    icon: Sparkles,
    description: "쉬운 단어와 친근한 예시로 AI 멘토와 함께 일상의 불편을 발명으로 바꿔봐요. 실과(발명·로봇) 교과 연계.",
    benefits: [
      "한글 음성 안내(향후 지원) · 그림처럼 단계별 안내",
      "문장이 짧고 단어가 쉬워 혼자서도 따라갈 수 있어요",
      "발명 미션을 완수하면 배지가 쌓여요",
    ],
    recommended: [
      { label: "AI 발명도구 (쉬운 모드)", href: "/invention-studio?level=elementary", icon: Lightbulb },
      { label: "영감의 전당", href: "/inspiration", icon: Trophy },
      { label: "창의성 진단", href: "/diagnosis?type=creativity", icon: Brain },
    ],
    primaryCta: { label: "초등 모드로 시작", href: "/invention-studio?level=elementary" },
  },
  {
    id: "middle",
    emoji: "🎒",
    title: "중학생",
    subtitle: "자유학기제·진로탐색",
    color: "cyan",
    icon: Users,
    description: "친구와 함께 팀 프로젝트로 발명·창업을 경험해요. 자유학기제 활동, 학생발명전시회 출품 준비에 최적.",
    benefits: [
      "자유학기제 16차시 활동에 바로 활용",
      "발명 결과를 진로/직업과 연결해 탐색",
      "또래에게 공유하고 피드백 받기",
    ],
    recommended: [
      { label: "AI 발명도구", href: "/invention-studio?level=middle", icon: Lightbulb },
      { label: "AI 창업도구", href: "/startup-lab?level=middle", icon: Rocket },
      { label: "발명 갤러리", href: "/community?type=invention", icon: Users },
    ],
    primaryCta: { label: "중학생 모드로 시작", href: "/invention-studio?level=middle" },
  },
  {
    id: "high",
    emoji: "📚",
    title: "고등학생",
    subtitle: "학생부·대입 포트폴리오",
    color: "purple",
    icon: GraduationCap,
    description: "발명·창업 활동을 학생부 활동보고서로 자동 변환. 학종, 자기소개서, 면접 자료로 활용하세요.",
    benefits: [
      "500자/1500자 학생부 활동보고서 자동 생성",
      "학종 평가 요소(탐구역량·자기주도성·문제해결력) 강조",
      "특허 명세서 초안으로 탐구 깊이 입증",
    ],
    recommended: [
      { label: "AI 발명도구 (학술 모드)", href: "/invention-studio?level=high", icon: Lightbulb },
      { label: "AI 창업도구", href: "/startup-lab?level=high", icon: Rocket },
      { label: "창의성 진단", href: "/diagnosis?type=creativity", icon: Brain },
    ],
    primaryCta: { label: "고등학생 모드로 시작", href: "/invention-studio?level=high" },
  },
  {
    id: "university",
    emoji: "🎓",
    title: "대학생",
    subtitle: "캡스톤·창업동아리",
    color: "blue",
    icon: BookOpen,
    description: "캡스톤 디자인·창업동아리·연구실 IP화에 바로 쓸 수 있는 전문가급 BMC와 IR 피칭덱을 만들어보세요.",
    benefits: [
      "비즈니스 모델 캔버스 + IR 피칭덱 자동 생성",
      "특허 명세서 초안으로 산학협력·기술이전 준비",
      "창업 진단으로 사업화 가능성 점검",
    ],
    recommended: [
      { label: "AI 창업도구 (전문 모드)", href: "/startup-lab?level=university", icon: Rocket },
      { label: "AI 발명도구", href: "/invention-studio?level=university", icon: Lightbulb },
      { label: "창업 진단", href: "/diagnosis?type=startup", icon: Target },
    ],
    primaryCta: { label: "대학생 모드로 시작", href: "/startup-lab?level=university" },
  },
  {
    id: "general",
    emoji: "💼",
    title: "일반인 · 예비창업자",
    subtitle: "정부지원사업·실전 창업",
    color: "green",
    icon: Briefcase,
    description: "K-Startup 표준 양식 기반 사업계획서를 자동 변환합니다. 예비창업패키지·청년창업사관학교 신청에 바로 활용하세요.",
    benefits: [
      "BMC → 정부지원사업 사업계획서 자동 변환",
      "PSST 양식 (Problem-Solution-Scale-Team) 적용",
      "분기별 마일스톤 · 자금 운용 계획 자동 작성",
    ],
    recommended: [
      { label: "AI 창업도구 (실무 모드)", href: "/startup-lab?level=general", icon: Rocket },
      { label: "AI 발명도구", href: "/invention-studio?level=general", icon: Lightbulb },
      { label: "창업 진단", href: "/diagnosis?type=startup", icon: Target },
    ],
    primaryCta: { label: "일반인 모드로 시작", href: "/startup-lab?level=general" },
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string; glow: string; ring: string }> = {
  yellow: { bg: "bg-yellow-500/10", text: "text-yellow-300", border: "border-yellow-500/30", glow: "shadow-[0_0_30px_rgba(250,204,21,0.15)]", ring: "ring-yellow-500/40" },
  cyan: { bg: "bg-cyan-500/10", text: "text-cyan-300", border: "border-cyan-500/30", glow: "shadow-[0_0_30px_rgba(34,211,238,0.15)]", ring: "ring-cyan-500/40" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-300", border: "border-purple-500/30", glow: "shadow-[0_0_30px_rgba(168,85,247,0.15)]", ring: "ring-purple-500/40" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-300", border: "border-blue-500/30", glow: "shadow-[0_0_30px_rgba(59,130,246,0.15)]", ring: "ring-blue-500/40" },
  green: { bg: "bg-emerald-500/10", text: "text-emerald-300", border: "border-emerald-500/30", glow: "shadow-[0_0_30px_rgba(16,185,129,0.15)]", ring: "ring-emerald-500/40" },
};

export default function AudiencesPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 pt-24 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" data-testid="text-audiences-title">
            <span className="gradient-text">대상별</span> 맞춤 시작
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            나에게 맞는 모드를 선택하면 AI가 수준에 맞춰 대화하고, 결과물도 목적에 맞게 자동 변환됩니다.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AUDIENCES.map((aud, i) => {
            const c = colorMap[aud.color];
            const Icon = aud.icon;
            return (
              <motion.div
                key={aud.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`glass-card rounded-2xl p-6 border ${c.border} ${c.glow} hover:ring-1 ${c.ring} transition-all flex flex-col`}
                data-testid={`card-audience-${aud.id}`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center text-2xl flex-shrink-0`}>
                    {aud.emoji}
                  </div>
                  <div>
                    <h2 className={`text-xl font-bold text-white`}>{aud.title}</h2>
                    <p className={`text-sm ${c.text}`}>{aud.subtitle}</p>
                  </div>
                </div>

                <p className="text-gray-300 text-sm mb-4 leading-relaxed">{aud.description}</p>

                <div className="space-y-1.5 mb-5">
                  {aud.benefits.map((b, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-gray-300">
                      <Icon className={`w-3.5 h-3.5 ${c.text} flex-shrink-0 mt-0.5`} />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/10 pt-4 mb-4">
                  <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-2">추천 도구</p>
                  <div className="space-y-1">
                    {aud.recommended.map((r) => {
                      const RIcon = r.icon;
                      return (
                        <Link key={r.href} href={r.href}>
                          <button
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-gray-200 hover:bg-white/5 transition-colors`}
                            data-testid={`link-audience-${aud.id}-${r.href.replace(/[/?=]/g, "-").replace(/^-/, "")}`}
                          >
                            <RIcon className={`w-3.5 h-3.5 ${c.text}`} />
                            <span className="flex-1 text-left">{r.label}</span>
                            <ArrowRight className="w-3 h-3 text-gray-500" />
                          </button>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-auto">
                  <Link href={aud.primaryCta.href}>
                    <Button
                      className={`w-full ${c.bg} ${c.text} border ${c.border} hover:brightness-125`}
                      data-testid={`button-cta-${aud.id}`}
                    >
                      {aud.primaryCta.label}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 glass-card rounded-2xl p-6 text-center"
        >
          <FileText className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-2">맞춤 보고서 자동 생성</h3>
          <p className="text-gray-300 text-sm max-w-2xl mx-auto">
            <span className="text-purple-300 font-medium">고등학생</span>은 발명·창업 결과를 <strong className="text-white">학생부 활동보고서(500/1500자)</strong>로,
            <span className="text-emerald-300 font-medium"> 일반인·예비창업자</span>는 BMC를 <strong className="text-white">정부지원사업 사업계획서(K-Startup 양식)</strong>로 한 번에 변환합니다.
            발명도구·창업도구 결과 화면 하단의 <strong className="text-cyan-300">다운로드</strong> 버튼을 확인하세요.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
