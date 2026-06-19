import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileDown, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import jsPDF from "jspdf";
import { marked } from "marked";
import DOMPurify from "dompurify";

type Props = {
  projectId: number | null;
  projectType: "invention" | "startup";
  title: string;
  disabled?: boolean;
  testId?: string;
  className?: string;
};

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// A4 size in pixels at 96 DPI: 794 x 1123.
// We render the off-screen container at a fixed pixel width and let jsPDF.html()
// scale + autoPage it into the PDF so the result is identical on mobile,
// desktop, and high-DPI displays.
const PAGE_WIDTH_PX = 794;
const PDF_WIDTH_MM = 210;
const PDF_MARGIN_MM = 12;
const CONTENT_WIDTH_MM = PDF_WIDTH_MM - PDF_MARGIN_MM * 2;
// scale = (mm of usable width) / (px of rendered width) * (px/mm at 96dpi).
// jsPDF.html() multiplies pixel widths by this factor when rasterising.
const HTML2PDF_SCALE = CONTENT_WIDTH_MM / PAGE_WIDTH_PX * (96 / 25.4);

marked.setOptions({ gfm: true, breaks: true });

const renderMarkdownToHtml = (md: string): string => {
  const rawHtml = marked.parse(md ?? "", { async: false }) as string;
  return DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
  });
};

export default function FreeSemesterPdfButton({
  projectId,
  projectType,
  title,
  disabled,
  testId = "button-download-freesemester-pdf",
  className,
}: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [school, setSchool] = useState("");
  const [grade, setGrade] = useState("");
  const [classNo, setClassNo] = useState("");
  const [studentNo, setStudentNo] = useState("");
  const [name, setName] = useState("");
  const [semester, setSemester] = useState("");

  const today = new Date();
  const todayStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(
    today.getDate(),
  ).padStart(2, "0")}`;

  const subjectLabel = projectType === "invention" ? "발명 제목" : "사업 아이템";
  const headingTitle =
    projectType === "invention"
      ? "자유학기 활동지 — 발명 프로젝트"
      : "자유학기 활동지 — 창업 프로젝트";

  const handleGenerate = async () => {
    if (!projectId) {
      toast({ title: "먼저 프로젝트를 저장해주세요.", variant: "destructive" });
      return;
    }
    if (!name.trim()) {
      toast({ title: "학생 이름을 입력해주세요.", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const r = await apiRequest("POST", "/api/reports/freesemester", {
        projectId,
        projectType,
      });
      const data = await r.json();
      const text: string = data.text || "";

      const studentIdParts = [
        grade.trim() ? `${grade.trim()}학년` : "",
        classNo.trim() ? `${classNo.trim()}반` : "",
        studentNo.trim() ? `${studentNo.trim()}번` : "",
      ]
        .filter(Boolean)
        .join(" ");

      const headerRows: Array<[string, string]> = [
        ["학교명", school.trim() ? escapeHtml(school.trim()) : "&nbsp;"],
        ["학기", semester.trim() ? escapeHtml(semester.trim()) : "&nbsp;"],
        ["학번", studentIdParts ? escapeHtml(studentIdParts) : "&nbsp;"],
        ["성명", escapeHtml(name.trim())],
        ["활동 주제", escapeHtml(title || "(제목 미입력)")],
        ["작성일", todayStr],
      ];

      const headerHtml = `
        <table style="width:100%;border-collapse:collapse;margin:24px 0 28px;font-size:14px;table-layout:fixed;">
          <tbody>
            ${[0, 2, 4]
              .map((i) => {
                const left = headerRows[i];
                const right = headerRows[i + 1];
                return `
                  <tr>
                    <th style="background:#eef2ff;border:1px solid #c7d2fe;padding:10px 12px;text-align:left;width:14%;color:#1f3a8a;font-weight:700;">${left[0]}</th>
                    <td style="border:1px solid #c7d2fe;padding:10px 12px;width:36%;word-break:break-word;">${left[1]}</td>
                    <th style="background:#eef2ff;border:1px solid #c7d2fe;padding:10px 12px;text-align:left;width:14%;color:#1f3a8a;font-weight:700;">${right[0]}</th>
                    <td style="border:1px solid #c7d2fe;padding:10px 12px;width:36%;word-break:break-word;">${right[1]}</td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      `;

      const bodyHtml = renderMarkdownToHtml(text);

      const container = document.createElement("div");
      // Fixed-width off-screen render so mobile/desktop/zoom all produce the
      // exact same layout. jsPDF.html() will rasterise this container and
      // automatically paginate text across A4 pages.
      container.style.position = "fixed";
      container.style.left = "-99999px";
      container.style.top = "0";
      container.style.width = `${PAGE_WIDTH_PX}px`;
      container.style.boxSizing = "border-box";
      container.style.padding = "48px 56px";
      container.style.background = "#ffffff";
      container.style.color = "#111827";
      container.style.fontFamily =
        '"Noto Sans KR", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
      // Pixel-based sizing — pt units render inconsistently across html2canvas
      // and mobile webviews.
      container.style.fontSize = "15px";
      container.style.lineHeight = "1.75";

      // Inline-style scope so markdown elements (from `marked`) render predictably.
      const bodyStyles = `
        <style>
          .fs-body :where(h1, h2, h3, h4) { color:#1f3a8a; margin: 20px 0 10px; font-weight: 700; line-height:1.4; }
          .fs-body h1 { font-size: 20px; }
          .fs-body h2 { font-size: 18px; border-bottom: 2px solid #1f3a8a; padding-bottom: 4px; }
          .fs-body h3 { font-size: 16px; }
          .fs-body h4 { font-size: 15px; }
          .fs-body p { margin: 8px 0; line-height: 1.8; }
          .fs-body strong { font-weight: 700; color:#0f172a; }
          .fs-body em { font-style: italic; }
          .fs-body ul, .fs-body ol { margin: 8px 0 8px 24px; padding: 0; }
          .fs-body ul ul, .fs-body ol ol, .fs-body ul ol, .fs-body ol ul { margin: 4px 0 4px 20px; }
          .fs-body li { margin: 4px 0; line-height: 1.75; }
          .fs-body code { background:#f1f5f9; padding:1px 5px; border-radius:4px; font-size:13px; }
          .fs-body pre { background:#f8fafc; border:1px solid #e2e8f0; padding:10px 12px; border-radius:6px; overflow:hidden; white-space:pre-wrap; word-break:break-word; }
          .fs-body blockquote { border-left:4px solid #c7d2fe; margin:10px 0; padding:4px 12px; color:#475569; background:#f8fafc; }
          .fs-body table { width:100%; border-collapse:collapse; margin:12px 0; table-layout:fixed; }
          .fs-body th, .fs-body td { border:1px solid #cbd5e1; padding:8px 10px; text-align:left; vertical-align:top; word-break:break-word; font-size:14px; }
          .fs-body th { background:#eef2ff; color:#1f3a8a; font-weight:700; }
          .fs-body hr { border:none; border-top:1px solid #e2e8f0; margin:14px 0; }
          .fs-body img { max-width: 100%; }
        </style>
      `;

      container.innerHTML = `
        ${bodyStyles}
        <div style="text-align:center;margin-bottom:8px;">
          <div style="font-size:12px;color:#6b7280;letter-spacing:2px;">FREE SEMESTER WORKBOOK</div>
          <h1 style="font-size:26px;font-weight:800;color:#0f172a;margin:6px 0 4px;">${headingTitle}</h1>
          <div style="font-size:12px;color:#6b7280;">중학교 자유학기제·진로탐색 활동 양식</div>
        </div>
        ${headerHtml}
        <div style="border-top:3px solid #1f3a8a;padding-top:18px;">
          <div style="font-size:14px;color:#374151;margin-bottom:10px;"><strong>${subjectLabel}:</strong> ${escapeHtml(
            title || "(제목 미입력)",
          )}</div>
          <div class="fs-body">${bodyHtml}</div>
        </div>
        <div style="margin-top:36px;padding-top:14px;border-top:1px dashed #9ca3af;font-size:12px;color:#6b7280;text-align:right;">
          마이베스트 발명창업 · 자동 생성 활동지
        </div>
      `;
      document.body.appendChild(container);

      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      try {
        // jsPDF.html() with autoPaging:'text' handles multi-page rendering by
        // splitting at text boundaries, so 2000자+ 본문이 잘리지 않습니다.
        await pdf.html(container, {
          x: PDF_MARGIN_MM,
          y: PDF_MARGIN_MM,
          width: CONTENT_WIDTH_MM,
          windowWidth: PAGE_WIDTH_PX,
          margin: [PDF_MARGIN_MM, PDF_MARGIN_MM, PDF_MARGIN_MM, PDF_MARGIN_MM],
          autoPaging: "text",
          html2canvas: {
            scale: HTML2PDF_SCALE,
            useCORS: true,
            backgroundColor: "#ffffff",
            logging: false,
            windowWidth: PAGE_WIDTH_PX,
          },
        });
      } finally {
        if (container.parentNode) container.parentNode.removeChild(container);
      }

      const safeTitle = (title || "프로젝트").replace(/[\\/:*?"<>|]/g, "_");
      const prefix = projectType === "invention" ? "자유학기활동지" : "자유학기활동지_창업";
      pdf.save(`${prefix}_${safeTitle}.pdf`);

      toast({ title: "자유학기 활동지 PDF가 생성되었습니다." });
      setOpen(false);
    } catch (err) {
      console.error("Free semester PDF error:", err);
      toast({
        title: "PDF 생성에 실패했습니다.",
        variant: "destructive",
        action: (
          <ToastAction
            altText="다시 시도"
            onClick={() => {
              void handleGenerate();
            }}
            data-testid="button-toast-retry-freesemester-pdf"
          >
            다시 시도
          </ToastAction>
        ),
      });
    }
    setGenerating(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        className={`border-rose-400/60 text-rose-300 hover:bg-rose-500/10 ${className ?? ""}`}
        onClick={() => {
          if (!projectId) {
            toast({ title: "먼저 프로젝트를 저장해주세요.", variant: "destructive" });
            return;
          }
          setOpen(true);
        }}
        data-testid={testId}
      >
        <FileDown className="w-4 h-4 mr-1" />
        활동지 PDF
      </Button>

      <Dialog open={open} onOpenChange={(v) => !generating && setOpen(v)}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-freesemester-pdf">
          <DialogHeader>
            <DialogTitle>자유학기 활동지 PDF 다운로드</DialogTitle>
            <DialogDescription>
              학교 제출용 양식 헤더에 들어갈 정보를 입력해주세요. 비워두면 빈 칸으로 인쇄됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="fs-school">학교명</Label>
              <Input
                id="fs-school"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="예) 마이베스트 중학교"
                data-testid="input-fs-school"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="fs-semester">학기</Label>
              <Input
                id="fs-semester"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="예) 2026학년도 1학기"
                data-testid="input-fs-semester"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="grid gap-1.5">
                <Label htmlFor="fs-grade">학년</Label>
                <Input
                  id="fs-grade"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="1"
                  data-testid="input-fs-grade"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="fs-class">반</Label>
                <Input
                  id="fs-class"
                  value={classNo}
                  onChange={(e) => setClassNo(e.target.value)}
                  placeholder="3"
                  data-testid="input-fs-class"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="fs-no">번호</Label>
                <Input
                  id="fs-no"
                  value={studentNo}
                  onChange={(e) => setStudentNo(e.target.value)}
                  placeholder="12"
                  data-testid="input-fs-no"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="fs-name">
                성명 <span className="text-rose-400">*</span>
              </Label>
              <Input
                id="fs-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예) 홍길동"
                data-testid="input-fs-name"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={generating}
              data-testid="button-fs-cancel"
            >
              취소
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-rose-600 hover:bg-rose-700 text-white"
              data-testid="button-fs-generate"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> PDF 생성 중...
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 mr-2" /> PDF 다운로드
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
