import { useEffect, useState } from "react";
import type { SSEError } from "./use-sse-stream";

export function useGuestLimitModal(sseErrors: Array<SSEError>) {
  const [showSignupModal, setShowSignupModal] = useState(false);

  const hasLimit = sseErrors.some((e) => e?.type === "GUEST_LIMIT_REACHED");

  useEffect(() => {
    if (hasLimit) setShowSignupModal(true);
  }, [hasLimit]);

  return { showSignupModal, setShowSignupModal };
}
