import { useCallback, useEffect, useRef, useState } from "react";

type SpeakOptions = {
  rate?: number;
  pitch?: number;
};

const isBrowserSpeechSupported = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.speechSynthesis !== "undefined" &&
  typeof window.SpeechSynthesisUtterance !== "undefined";

const stripForSpeech = (text: string): string =>
  text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[(.*?)\]\((.*?)\)/g, " ")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/[#>*_~`>\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const pickKoreanVoice = (
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | undefined =>
  voices.find((v) => v.lang === "ko-KR") ||
  voices.find((v) => v.lang?.toLowerCase().startsWith("ko"));

// Returns true if the character should be spoken aloud. Skips ASCII
// whitespace/punctuation; keeps Hangul (\uAC00-\uD7AF), CJK and any
// alphanumeric. We avoid the `\p{...}u` flag because the project's TS
// target predates it.
const isReadable = (ch: string): boolean => {
  const code = ch.charCodeAt(0);
  if (code <= 0x002f) return false; // space + ASCII punctuation
  if (code >= 0x003a && code <= 0x0040) return false; // : ; < = > ? @
  if (code >= 0x005b && code <= 0x0060) return false; // [ \ ] ^ _ `
  if (code >= 0x007b && code <= 0x007e) return false; // { | } ~
  if (code === 0x00a0) return false; // nbsp
  if (code >= 0x2000 && code <= 0x206f) return false; // general punctuation
  if (code >= 0x3000 && code <= 0x303f) return false; // CJK symbols & punctuation
  if (code >= 0xff00 && code <= 0xff0f) return false; // fullwidth punctuation
  if (code >= 0xff1a && code <= 0xff20) return false;
  return true;
};

export function useKidTTS() {
  const supported = isBrowserSpeechSupported();
  const [speaking, setSpeaking] = useState(false);
  const [currentChar, setCurrentChar] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() =>
    isBrowserSpeechSupported() ? window.speechSynthesis.getVoices() : [],
  );
  const cancelledRef = useRef(false);

  // Keep `voices` state in sync with the browser's voice list. Some browsers
  // populate voices asynchronously, so we re-fetch on the `voiceschanged`
  // event. Storing it in state lets the picker react when voices load late.
  useEffect(() => {
    if (!supported) return;
    const refresh = () => setVoices(window.speechSynthesis.getVoices());
    refresh();
    window.speechSynthesis.addEventListener?.("voiceschanged", refresh);
    return () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", refresh);
    };
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    cancelledRef.current = true;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setCurrentChar(null);
  }, [supported]);

  useEffect(() => {
    return () => {
      if (supported) {
        cancelledRef.current = true;
        window.speechSynthesis.cancel();
      }
    };
  }, [supported]);

  const buildUtterance = useCallback(
    (text: string, opts: SpeakOptions): SpeechSynthesisUtterance => {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "ko-KR";
      utter.rate = opts.rate ?? 0.95;
      utter.pitch = opts.pitch ?? 1.05;
      const voice = pickKoreanVoice(voices);
      if (voice) utter.voice = voice;
      return utter;
    },
    [voices],
  );

  const speak = useCallback(
    (text: string, opts: SpeakOptions = {}) => {
      if (!supported) return;
      const cleaned = stripForSpeech(text);
      if (!cleaned) return;

      cancelledRef.current = false;
      window.speechSynthesis.cancel();

      const utter = buildUtterance(cleaned, opts);
      utter.onstart = () => setSpeaking(true);
      utter.onend = () => {
        setSpeaking(false);
        setCurrentChar(null);
      };
      utter.onerror = () => {
        setSpeaking(false);
        setCurrentChar(null);
      };

      window.speechSynthesis.speak(utter);
    },
    [supported, buildUtterance],
  );

  // Reads the text one Hangul syllable / character at a time so that very
  // young readers can follow along character-by-character. Skips whitespace
  // and most punctuation. Updates `currentChar` so the UI can show the
  // currently-spoken character.
  const speakByCharacter = useCallback(
    (text: string, opts: SpeakOptions = {}) => {
      if (!supported) return;
      const cleaned = stripForSpeech(text);
      if (!cleaned) return;

      cancelledRef.current = false;
      window.speechSynthesis.cancel();
      setSpeaking(true);

      // Iterate via Array.from so surrogate pairs / combined characters
      // are treated as a single unit.
      const chars = Array.from(cleaned);
      let i = 0;

      const speakNext = () => {
        if (cancelledRef.current) {
          setSpeaking(false);
          setCurrentChar(null);
          return;
        }
        // Skip non-readable chars (whitespace, punctuation) but advance.
        while (i < chars.length && !isReadable(chars[i])) {
          i += 1;
        }
        if (i >= chars.length) {
          setSpeaking(false);
          setCurrentChar(null);
          return;
        }
        const ch = chars[i];
        setCurrentChar(ch);
        const utter = buildUtterance(ch, { ...opts, rate: opts.rate ?? 0.85 });
        utter.onend = () => {
          i += 1;
          // Small pause between characters for readability.
          window.setTimeout(speakNext, 90);
        };
        utter.onerror = () => {
          i += 1;
          window.setTimeout(speakNext, 90);
        };
        window.speechSynthesis.speak(utter);
      };

      speakNext();
    },
    [supported, buildUtterance],
  );

  const toggle = useCallback(
    (text: string, opts: SpeakOptions = {}) => {
      if (!supported) return;
      if (speaking) {
        stop();
      } else {
        speak(text, opts);
      }
    },
    [supported, speaking, speak, stop],
  );

  const toggleByCharacter = useCallback(
    (text: string, opts: SpeakOptions = {}) => {
      if (!supported) return;
      if (speaking) {
        stop();
      } else {
        speakByCharacter(text, opts);
      }
    },
    [supported, speaking, speakByCharacter, stop],
  );

  return {
    supported,
    speaking,
    currentChar,
    speak,
    speakByCharacter,
    stop,
    toggle,
    toggleByCharacter,
  };
}
