"use client";

import { useEffect } from "react";

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const ACTIVITY_EVENTS = ["click", "keydown", "mousemove", "scroll", "touchstart"] as const;

export function IdleTimeout() {
  useEffect(() => {
    let timeoutId: number | undefined;
    let isLoggingOut = false;

    async function logoutForIdle() {
      if (isLoggingOut) return;
      isLoggingOut = true;

      try {
        await fetch("/api/auth/idle-timeout", {
          method: "POST",
          keepalive: true,
        });
      } finally {
        window.location.href = "/login?error=Sesi berakhir karena tidak ada aktivitas selama 30 menit";
      }
    }

    function resetTimer() {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(logoutForIdle, IDLE_TIMEOUT_MS);
    }

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, resetTimer, { passive: true });
    });
    resetTimer();

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, resetTimer);
      });
    };
  }, []);

  return null;
}
