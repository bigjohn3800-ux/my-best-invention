import { useState, useRef, useCallback, useEffect } from "react";
import { useSSEStream } from "@/hooks/use-sse-stream";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import GuestSignupModal from "@/components/guest-signup-modal";
import ReactMarkdown from "react-markdown";

interface FollowUpMessage {
  role: "user" | "assistant";
  content: string;
}

interface AiFollowUpProps {
  previousContent: string;
  context?: string;
  level?: string;
}

const QUICK_BUTTONS = [
  { label: "더 자세히 설명해줘", icon: "📝" },
  { label: "다른 방향으로 바꿔줘", icon: "🔄" },
  { label: "더 간단하게 요약해줘", icon: "✂️" },
];

export default function AiFollowUp({ previousContent, context, level }: AiFollowUpProps) {
  const [messages, setMessages] = useState<FollowUpMessage[]>([]);
  const [input, setInput] = useState("");
  const followupStream = useSSEStream();
  const { toast } = useToast();
  const [showSignupModal, setShowSignupModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastRetryRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (followupStream.sseError?.type === "GUEST_LIMIT_REACHED") {
      setShowSignupModal(true);
      followupStream.clearError();
    } else if (followupStream.sseError?.type === "GENERAL") {
      const retry = lastRetryRef.current;
      toast({
        title: "AI 응답 오류",
        description: followupStream.sseError.message,
        variant: "destructive",
        action: retry ? (
          <ToastAction
            altText="다시 시도"
            onClick={() => retry()}
            data-testid="button-toast-retry-followup"
          >
            다시 시도
          </ToastAction>
        ) : undefined,
      });
      followupStream.clearError();
    }
  }, [followupStream.sseError]);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 150) + "px";
    }
  }, []);

  const handleSend = async (question: string) => {
    if (!question.trim() || followupStream.streaming) return;

    const updatedMessages = [...messages, { role: "user" as const, content: question }];
    setMessages(updatedMessages);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const payload = {
      previousContent,
      question,
      context,
      level,
      history: updatedMessages,
    };

    const run = async () => {
      const result = await followupStream.startStream("/api/ai/followup", payload);
      if (result) {
        setMessages(prev => [...prev, { role: "assistant", content: result }]);
        followupStream.setStreamContent("");
      }
    };
    lastRetryRef.current = () => { run(); };
    await run();
  };

  if (!previousContent) return null;

  return (
    <div className="mt-4 border-t border-white/5 pt-4">
      {messages.length > 0 && (
        <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
          {messages.map((msg, i) => (
            <div key={i} className={`rounded-lg p-3 text-sm ${msg.role === "user" ? "bg-cyan-500/10 text-cyan-200 ml-8" : "bg-white/5 text-gray-300 mr-8"}`}>
              {msg.role === "user" ? (
                <p>{msg.content}</p>
              ) : (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {followupStream.streaming && followupStream.streamContent && (
        <div className="rounded-lg p-3 text-sm bg-white/5 text-gray-300 mr-8 mb-4">
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{followupStream.streamContent}</ReactMarkdown>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        {QUICK_BUTTONS.map((btn) => (
          <button
            key={btn.label}
            onClick={() => handleSend(btn.label)}
            disabled={followupStream.streaming}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50 border border-white/5"
            data-testid={`button-followup-quick-${btn.label}`}
          >
            <span>{btn.icon}</span>
            {btn.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            autoResize();
          }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(input); } }}
          placeholder="후속 질문을 입력하세요..."
          rows={1}
          className="bg-white/5 border border-white/10 text-white placeholder:text-gray-500 text-sm flex-1 min-h-[38px] max-h-[150px] rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 overflow-y-auto"
          style={{ resize: "none" }}
          data-testid="input-followup"
        />
        <Button
          onClick={() => handleSend(input)}
          disabled={!input.trim() || followupStream.streaming}
          size="sm"
          className="gradient-primary text-white h-[38px] px-3"
          data-testid="button-followup-send"
        >
          {followupStream.streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
      <GuestSignupModal open={showSignupModal} onOpenChange={setShowSignupModal} />
    </div>
  );
}
