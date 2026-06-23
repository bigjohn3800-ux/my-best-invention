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
    name: "Free 체험",
    price: "무료",
    unit: "",
    desc: "처음 아이디어를 정리하고 AI 발명·창업 흐름을 확인하는 개인 사용자",
    cta: "무료로 시작",
    href: "/auth",
    icon: Lightbulb,
    features: [
      "AI 발명·창업 도구 체험 (2회)",
      "창의성·창업 기본 진단",
      "프로젝트 초안 저장",
      "보고서 미리보기 (워터마크)",
    ],
  },
  {
    name: "Pro 개인",
    price: "준비중",
    unit: "트래픽 확보 후 오픈",
    desc: "특허·시장검증·사업계획·IR·학교제출 보고서까지 제대로 활용하는 개인",
    cta: "오픈 알림 받기",
    href: "/franchise",
    icon: Rocket,
    featured: true,
    features: [
      "AI 발명·창업 도구 공정사용 무제한",
      "SCAMPER·TRIZ·특허 명세서 초안",
      "BMC·IR·정부지원 제출 자료 생성",
      "보고서 정식 PDF 무제한 다운로드",
      "포트폴리오·수료증",
    ],
  },
  {
    name: "기관 (B2B)",
    price: "좌석당 ₩20,000",
    unit: "연",
    desc: "학교·학원·기관, 창업캠프·발명대회 운영자를 위한 단체 라이선스",
    cta: "도입 문의",
    href: "/franchise",
    icon: Building2,
    features: [
      "좌석 라이선스 (학사년도 단위)",
      "단체 회원·그룹 관리자·진도관리",
      "교육용 커리큘럼 운영",
      "캠프·대회 패키지 / 교사 연수",
      "세금계산서·운영 협의",
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

const launchCriteria = [
  "반복 사용자가 충분히 쌓여 핵심 기능 재방문이 확인될 때",
  "보고서·특허 초안·BMC·IR 결과물 샘플 품질이 일정 수준 이상일 때",
  "무료 한도, Pro 권한, 환불·해지·청소년보호 정책이 명확해질 때",
  "기관 도입 상담에서 실제 좌석·운영 수요가 검증될 때",
];

const trustItems = [
  "결제 전까지는 무료 체험과 기관 상담 중심 운영",
  "AI 결과물은 최종 제출 전 사용자가 검토하는 보조 자료로 안내",
  "개인정보·학생 활동기록·아이디어 보호 문구 우선 정비",
  "Toss 결제 코드는 준비하되 실 결제는 테스트 완료 후 오픈",
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
              지금은 무료 체험과 기관 도입 상담을 통해 사용자를 늘리고 품질을 검증합니다. Pro 구독과 실제 결제는 트래픽과 반복 사용 지표가 충분해진 뒤 열 예정입니다.
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

        <section className="max-w-7xl mx-auto mt-12">
          <div className="glass-card rounded-2xl p-6 sm:p-8">
            <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-6 items-start">
              <div>
                <p className="text-sm font-semibold text-cyan-300">Before paid launch</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">결제보다 먼저 유료만큼의 품질을 만듭니다</h2>
                <p className="text-sm text-muted-foreground mt-3">
                  사용자가 늘고 실제 활동 데이터가 쌓일 때까지는 결제를 서두르지 않습니다. 대신 결과물 품질, 학습 흐름, 속도, 신뢰 문구, 기관 운영 구조를 먼저 완성합니다.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  "결과물 샘플과 제출용 PDF 품질 강화",
                  "무료 한도와 Pro 권한 기준 명확화",
                  "환불·개인정보·청소년보호·AI 활용 고지 정비",
                  "대시보드 사용량·프로젝트 진행률·다음 행동 강화",
                ].map((item) => (
                  <div key={item} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-sm text-gray-100 flex gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
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

        <section className="max-w-7xl mx-auto mt-16">
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="glass-card rounded-2xl p-6">
              <p className="text-sm font-semibold text-emerald-300">Launch criteria</p>
              <h2 className="text-2xl font-bold text-white mt-2">이 조건이 맞으면 유료 구독을 엽니다</h2>
              <div className="mt-5 space-y-3">
                {launchCriteria.map((item) => (
                  <p key={item} className="text-sm text-gray-100 flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                    {item}
                  </p>
                ))}
              </div>
            </div>
            <div className="glass-card rounded-2xl p-6">
              <p className="text-sm font-semibold text-cyan-300">Trust checklist</p>
              <h2 className="text-2xl font-bold text-white mt-2">돈을 받기 전에 신뢰부터 쌓습니다</h2>
              <div className="mt-5 space-y-3">
                {trustItems.map((item) => (
                  <p key={item} className="text-sm text-gray-100 flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
