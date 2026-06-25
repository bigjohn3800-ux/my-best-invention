import { FileText, GraduationCap, Presentation, LayoutGrid } from "lucide-react";

// 결과물 샘플 갤러리 — "대화로 끝나지 않고 제출 가능한 결과물이 남는다"를 눈으로 보여줘 신뢰 형성.
// 모두 예시(샘플) 텍스트. 디자인은 기존 톤(glass-card·네온·다크) 유지.
const SAMPLES = [
  {
    icon: FileText,
    accent: "text-cyan-300",
    ring: "border-cyan-400/20",
    tag: "특허 명세서 초안",
    title: "비접촉 빗물 제거 우산 거치대",
    lines: [
      "【발명의 명칭】 송풍 기반 비접촉 우산 빗물 제거 장치",
      "【청구항 1】 거치부와, 우산 표면에 공기를 분사하는 송풍부와,",
      "물받이부를 포함하는 것을 특징으로 하는 우산 거치대.",
      "【효과】 실내 바닥 오염과 미끄럼 사고를 저감한다.",
    ],
  },
  {
    icon: GraduationCap,
    accent: "text-emerald-300",
    ring: "border-emerald-400/20",
    tag: "자유학기·생기부 활동지",
    title: "탐구 보고서 (학교 제출용)",
    lines: [
      "주제 선정: 비 오는 날 현관이 미끄러운 불편을 관찰하고 해결을 시도함.",
      "탐구 과정: SCAMPER로 ‘결합·제거’ 아이디어를 발산하고 시제품을 설계함.",
      "느낀 점: 작은 불편도 발명의 출발점이 됨을 체득함.",
      "진로 연계: 기계공학·산업디자인 분야 탐색으로 확장.",
    ],
  },
  {
    icon: Presentation,
    accent: "text-purple-300",
    ring: "border-purple-400/20",
    tag: "IR 피칭덱",
    title: "투자자용 피칭 구조",
    lines: [
      "문제 — 우천 시 실내 안전사고·청소 비용 증가",
      "솔루션 — 비접촉 빗물 제거 거치대 (특허 출원 준비)",
      "시장 — TAM/SAM/SOM, 공공·상업시설 우선 진입",
      "비즈니스 모델 — 설치형 판매 + 유지보수 구독",
    ],
  },
  {
    icon: LayoutGrid,
    accent: "text-amber-300",
    ring: "border-amber-400/20",
    tag: "비즈니스 모델 캔버스",
    title: "BMC 9블록 자동 정리",
    lines: [
      "가치 제안: ‘젖지 않는 깨끗한 실내’를 만드는 거치대",
      "고객: 학교·관공서·대형 상가 시설관리 담당자",
      "수익원: 기기 판매 + 소모품·유지보수",
      "핵심 자원: 특허, 송풍 모듈 설계, 설치 파트너",
    ],
  },
];

export default function SamplesShowcase() {
  return (
    <section className="px-4 py-16 sm:py-20">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">Real outputs</p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white">이런 결과물이 남습니다</h2>
          <p className="mt-3 text-muted-foreground">
            아이디어 대화로 끝나지 않습니다. 특허 초안, 학교 제출용 보고서, IR, 비즈니스 모델까지
            <span className="text-gray-200"> 제출·활용 가능한 산출물</span>로 정리됩니다. (아래는 예시 샘플)
          </p>
        </div>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SAMPLES.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.tag} className={`glass-card rounded-2xl p-5 flex flex-col border ${s.ring}`}>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <Icon className={`w-4 h-4 ${s.accent}`} />
                  </div>
                  <span className={`text-xs font-semibold ${s.accent}`}>{s.tag}</span>
                </div>
                <h3 className="mt-3 text-sm font-bold text-white">{s.title}</h3>
                <div className="mt-3 rounded-lg bg-black/30 border border-white/5 p-3 text-[11px] leading-relaxed text-gray-300 font-mono space-y-1">
                  {s.lines.map((line, i) => (
                    <p key={i} className="break-words">{line}</p>
                  ))}
                </div>
                <span className="mt-3 inline-block text-[10px] text-muted-foreground">· 예시 샘플</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
