import { useState, useCallback, useRef } from "react";

export type SSEError = { type: "GUEST_LIMIT_REACHED" | "GENERAL"; message: string } | null;

const GUEST_AI_COUNT_KEY = "mybest_guest_ai_count";

function readGuestAiCount(): number {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(GUEST_AI_COUNT_KEY) : null;
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}
function writeGuestAiCount(n: number): void {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(GUEST_AI_COUNT_KEY, String(Math.max(0, n)));
  } catch {
    /* ignore */
  }
}

const DEFAULT_ERROR_MESSAGE = "AI 응답 생성에 실패했습니다. 잠시 후 다시 시도해주세요.";
const GUEST_LIMIT_MESSAGE = "비회원 AI 사용 횟수를 초과했습니다. 회원가입 후 무제한 이용하세요.";

function classifyError(raw: unknown): { type: "GUEST_LIMIT_REACHED" | "GENERAL"; message: string } {
  if (raw && typeof raw === "object") {
    const obj = raw as { error?: unknown; message?: unknown };
    const code = typeof obj.error === "string" ? obj.error : "";
    const msg = typeof obj.message === "string" ? obj.message : "";
    if (code === "GUEST_LIMIT_REACHED") {
      return { type: "GUEST_LIMIT_REACHED", message: msg || GUEST_LIMIT_MESSAGE };
    }
    return { type: "GENERAL", message: msg || (code && code !== "GENERAL" ? code : DEFAULT_ERROR_MESSAGE) };
  }
  if (typeof raw === "string") {
    if (raw === "GUEST_LIMIT_REACHED") return { type: "GUEST_LIMIT_REACHED", message: GUEST_LIMIT_MESSAGE };
    return { type: "GENERAL", message: raw };
  }
  return { type: "GENERAL", message: DEFAULT_ERROR_MESSAGE };
}

export function useSSEStream() {
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [sseError, setSseError] = useState<SSEError>(null);
  const bufferRef = useRef("");

  const startStream = useCallback(async (url: string, body: any): Promise<string> => {
    setStreaming(true);
    setStreamContent("");
    setSseError(null);
    bufferRef.current = "";
    let fullText = "";
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;

    const fail = (err: { type: "GUEST_LIMIT_REACHED" | "GENERAL"; message: string }) => {
      setSseError(err);
      setStreaming(false);
      if (reader) {
        try { reader.cancel(); } catch {}
      }
    };

    try {
      const guestCount = readGuestAiCount();
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Guest-Ai-Count": String(guestCount),
        },
        body: JSON.stringify(body),
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 403) {
          try {
            const errData = await response.json();
            if (errData?.error === "GUEST_LIMIT_REACHED") {
              writeGuestAiCount(Math.max(readGuestAiCount(), 2));
              fail({ type: "GUEST_LIMIT_REACHED", message: errData.message || GUEST_LIMIT_MESSAGE });
              return "";
            }
          } catch {}
        }
        fail({ type: "GENERAL", message: DEFAULT_ERROR_MESSAGE });
        return "";
      }

      const serverCountRaw = response.headers.get("X-Guest-Ai-Count");
      if (serverCountRaw) {
        const serverCount = parseInt(serverCountRaw, 10);
        if (Number.isFinite(serverCount) && serverCount > 0) {
          writeGuestAiCount(Math.max(readGuestAiCount(), serverCount));
        }
      }

      reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        fail({ type: "GENERAL", message: DEFAULT_ERROR_MESSAGE });
        return "";
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        bufferRef.current += decoder.decode(value, { stream: true });
        const lines = bufferRef.current.split("\n");
        bufferRef.current = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let data: any = null;
          try {
            data = JSON.parse(line.slice(6));
          } catch {
            continue;
          }
          if (data?.content) {
            fullText += data.content;
            setStreamContent(fullText);
          }
          if (data?.error) {
            console.error("SSE error:", data.error);
            fail(classifyError(data));
            return "";
          }
        }
      }

      if (bufferRef.current.startsWith("data: ")) {
        try {
          const data = JSON.parse(bufferRef.current.slice(6));
          if (data?.content) {
            fullText += data.content;
            setStreamContent(fullText);
          }
          if (data?.error) {
            console.error("SSE error:", data.error);
            fail(classifyError(data));
            return "";
          }
        } catch {}
      }
    } catch (err) {
      console.error(err);
      fail({ type: "GENERAL", message: DEFAULT_ERROR_MESSAGE });
      return "";
    }
    setStreaming(false);
    return fullText;
  }, []);

  return { streaming, streamContent, startStream, setStreamContent, sseError, clearError: () => setSseError(null) };
}
