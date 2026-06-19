import { Link } from "wouter";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileText,
  Lightbulb,
  MessageSquareText,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Inventor Beta",
    price: "무료",
    unit: "체험",
    desc: "처음 아이디어를 정리하고 AI 발명 흐름을 확인하는 개인 사용자",
    cta: "무료로 시작",
    href: "/auth",
    icon: Lightbulb,
    features: [
      "AI 발명 아이디어 체험",
      "창의성·창업 기본 진단",
      "발명 프로젝트 초안 저장",
      "기본 강좌와 가이드 접근",
    ],
  },
  {
    name: "Venture Builder",
    price: "유료 전환 준비",
    unit: "월/프로젝트",
    desc: "특허, 시장검증, 사업계획, IR까지 이어가는 실전 창업 준비팀",
    cta: "우선 이용 신청",
    href: "/franchise",
    icon: Rocket,
    featured: true,
    features: [
      "비공개 프로젝트 워크스페이스",
      "SCAMPER·TRIZ·특허 명세서 초안",
      "BMC·IR·정부지원 제출 자료 생성",
      "멘토 리뷰 요청과 코멘트 기록",
      "사업화 준비도 대시보드",
    ],
  },
  {
    name: "Institution",
    price: "맞춤 견적",
    unit: "기관/교육",
    desc: "학교, 교육기관, 창업캠프, 발명대회 운영자가 쓰는 단체형",
    cta: "도입 문의",
    href: "/franchise",
    icon: Building2,
    features: [
      "단체 회원과 그룹 관리자",
      "프로젝트·진도·결과물 관리",
      "교육용 커리큘럼 운영",
      "관리자 리뷰와 보고 흐름",
      "운영 정책과 결제 방식 협의",
    ],
  },
];

const buyerReasons = [
  {
    title: "결과물이 남습니다",
    desc: "아이디어 대화에서 끝나지 않고 특허 초안, BMC, IR, 보고서 같은 제출 가능한 산출물로 연결됩니다.",
    icon: FileText,
  },
  {
    title: "진행 상태가 보입니다",
    desc: "발명가와 운영자가 IP, 시장, 사업모델, 투자 준비도를 같은 화면에서 확인합니다.",
    icon: ShieldCheck,
  },
  {
    title: "리뷰 흐름이 있습니다",
    desc: "멘토나 관리자의 검토 의견을 프로젝트에 남기고 다음 행동으로 이어갈 수 있습니다.",
    icon: MessageSquareText,
  },
  {
    title: "기관 운영에 맞습니다",
    desc: "단체 교육, 캠프, 대회, 창업 프로그램에서 프로젝트와 참여자를 관리할 수 있습니다.",
    icon: Users,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="px-4 pt-28 pb-20">
        <section className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/35 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-200">
              <Sparkles className="w-3.5 h-3.5" />
              Commercial packages
            </div>
            <h1 className="mt-5 text-4xl sm:text-5xl font-bold text-white leading-tight">발명 아이디어가 실제 구매·투자 검토 자료가 되도록</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              현재는 무료 베타와 기관 도입 문의를 중심으로 운영하고, 결제는 가격·환불·검토 정책 확정 후 Toss Payments 기반으로 활성화할 수 있게 준비합니다.
            </p>
          </div>

          <div className="mt-10 grid lg:grid-cols-3 gap-5">
            {plans.map((plan) => (
              <div key={plan.name} className={`glass-card rounded-2xl p-6 flex flex-col ${plan.featured ? "ring-2 ring-cyan-400/60" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-cyan-300">{plan.name}</p>
                    <div className="mt-3">
                      <span className="text-3xl font-bold text-white">{plan.price}</span>
                      <span className="text-sm text-muted-foreground ml-2">{plan.unit}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                    <plan.icon className="w-6 h-6 text-cyan-300" />
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{plan.desc}</p>
                <div className="mt-6 space-y-3 flex-1">
                  {plan.features.map((feature) => (
                    <p key={feature} className="text-sm text-gray-100 flex gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                      {feature}
                    </p>
                  ))}
                </div>
                <Link href={plan.href}>
                  <Button className={`mt-7 w-full ${plan.featured ? "gradient-primary text-white" : "bg-white/10 text-white hover:bg-white/15"}`}>
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-7xl mx-auto mt-16">
          <div className="grid lg:grid-cols-[0.78fr_1.22fr] gap-8">
            <div>
              <p className="text-sm font-semibold text-amber-300">Why paid users care</p>
              <h2 className="text-3xl font-bold text-white mt-2">유료화의 기준은 예쁜 화면보다 실행 가능한 산출물입니다</h2>
              <p className="text-muted-foreground mt-3">
                발명가는 아이디어를 노출하는 위험을 줄이면서도, 다음 상담·지원사업·투자 미팅에 가져갈 자료가 필요합니다.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {buyerReasons.map((reason) => (
                <div key={reason.title} className="glass-card rounded-2xl p-5">
                  <reason.icon className="w-6 h-6 text-cyan-300" />
                  <h3 className="text-lg font-semibold text-white mt-4">{reason.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{reason.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
