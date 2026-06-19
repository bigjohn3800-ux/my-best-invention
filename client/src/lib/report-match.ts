export type ReportKey =
  | "saengbu"
  | "competition"
  | "freesemester"
  | "business-plan";

export interface ReportAudienceMeta {
  audiences: string[];
  label: string;
}

export const REPORT_AUDIENCES: Record<ReportKey, ReportAudienceMeta> = {
  saengbu: { audiences: ["high"], label: "고등학생 학생부 활용용" },
  competition: { audiences: ["high", "university", "general"], label: "고등·대학·일반 출품용" },
  freesemester: { audiences: ["middle"], label: "중학생 자유학기용" },
  "business-plan": { audiences: ["university", "general"], label: "대학·일반·창업자용" },
};

export interface ReportMatch {
  recommended: boolean;
  dimmed: boolean;
  hint: string;
  audienceLabel: string;
}

export function getReportMatch(
  level: string | null | undefined,
  key: ReportKey,
): ReportMatch {
  const entry = REPORT_AUDIENCES[key];
  if (!entry) {
    return { recommended: false, dimmed: false, hint: "", audienceLabel: "" };
  }
  if (!level) {
    return {
      recommended: false,
      dimmed: false,
      hint: entry.label,
      audienceLabel: entry.label,
    };
  }
  if (entry.audiences.includes(level)) {
    return {
      recommended: true,
      dimmed: false,
      hint: "내 학교급에 딱 맞는 추천 양식이에요",
      audienceLabel: entry.label,
    };
  }
  return {
    recommended: false,
    dimmed: true,
    hint: `${entry.label} 양식 (다른 학교급용)`,
    audienceLabel: entry.label,
  };
}

export function reportPriority(
  level: string | null | undefined,
  key: ReportKey,
): number {
  const entry = REPORT_AUDIENCES[key];
  if (!entry || !level) return 1;
  return entry.audiences.includes(level) ? 0 : 1;
}

export function recommendedRingClass(match: ReportMatch): string {
  if (match.recommended) {
    return "ring-2 ring-cyan-400/70 shadow-[0_0_14px_rgba(0,209,255,0.35)]";
  }
  if (match.dimmed) {
    return "opacity-60 hover:opacity-95";
  }
  return "";
}

export function audienceFriendlyName(level: string | null | undefined): string {
  switch (level) {
    case "elementary":
      return "초등학생";
    case "middle":
      return "중학생";
    case "high":
      return "고등학생";
    case "university":
      return "대학생";
    case "general":
      return "일반·창업자";
    default:
      return "";
  }
}

export function getRecommendedSummary(level: string | null | undefined): string | null {
  switch (level) {
    case "middle":
      return "중학생에게는 '자유학기 활동지'를 가장 먼저 추천드려요.";
    case "high":
      return "고등학생에게는 '생기부 활동보고서'를 가장 먼저 추천드려요.";
    case "university":
      return "대학생에게는 '정부지원사업 사업계획서'와 '대회 출품 양식'을 추천드려요.";
    case "general":
      return "일반·창업자에게는 '정부지원사업 사업계획서'를 가장 먼저 추천드려요.";
    case "elementary":
      return "초등학생용 전용 양식은 준비 중이에요. 부모님·선생님과 함께 작성해 보세요.";
    default:
      return null;
  }
}
