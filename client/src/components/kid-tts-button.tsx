import { Volume2, VolumeX, Type } from "lucide-react";
import { useKidTTS } from "@/hooks/use-kid-tts";

type KidTtsButtonProps = {
  text: string;
  label?: string;
  variant?: "icon" | "pill";
  mode?: "full" | "char";
  testId?: string;
  className?: string;
};

export default function KidTtsButton({
  text,
  label,
  variant = "icon",
  mode = "full",
  testId,
  className = "",
}: KidTtsButtonProps) {
  const { supported, speaking, currentChar, toggle, toggleByCharacter } =
    useKidTTS();

  if (!supported) return null;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (mode === "char") {
      toggleByCharacter(text);
    } else {
      toggle(text);
    }
  };

  const Icon = speaking ? VolumeX : mode === "char" ? Type : Volume2;
  const defaultPillLabel = mode === "char" ? "한 글자씩 듣기" : "처음부터 읽기";
  const ariaLabel = speaking
    ? "음성 멈추기"
    : label ?? (mode === "char" ? "한 글자씩 듣기" : "소리로 듣기");

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={ariaLabel}
        title={ariaLabel}
        className={`tts-button tts-button-pill ${speaking ? "is-speaking" : ""} ${className}`}
        data-testid={testId}
      >
        <Icon className="w-4 h-4" />
        <span>
          {speaking
            ? mode === "char" && currentChar
              ? `읽는 중: ${currentChar}`
              : "멈춤"
            : label ?? defaultPillLabel}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`tts-button ${speaking ? "is-speaking" : ""} ${className}`}
      data-testid={testId}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}
