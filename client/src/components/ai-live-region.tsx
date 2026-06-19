import { useMemo } from "react";

interface AiLiveRegionProps {
  streaming: boolean;
  content?: string;
  label: string;
  statusOnly?: boolean;
  testId?: string;
}

function takeCompletedSentences(text: string): string {
  if (!text) return "";
  const re = /[.!?。！？\n]/g;
  let lastIdx = -1;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    lastIdx = match.index;
  }
  if (lastIdx === -1) return "";
  return text.slice(0, lastIdx + 1);
}

export default function AiLiveRegion({
  streaming,
  content = "",
  label,
  statusOnly = false,
  testId,
}: AiLiveRegionProps) {
  const announced = useMemo(() => {
    if (statusOnly) {
      if (streaming) return `${label}을(를) 생성하고 있습니다.`;
      if (content) return `${label} 생성이 완료되었습니다.`;
      return "";
    }
    if (!streaming) return content;
    return takeCompletedSentences(content);
  }, [streaming, content, statusOnly, label]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="false"
      aria-busy={streaming}
      aria-label={label}
      className="sr-only"
      data-testid={testId}
    >
      {announced}
    </div>
  );
}
