"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

export default function ToastAlert({ error, success }: { error?: string; success?: string }) {
  const message = error || success || "";
  const type = error ? "error" : "success";
  const [isVisible, setIsVisible] = useState(Boolean(message));
  const [isEntering, setIsEntering] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeToast = useCallback(() => {
    setIsEntering(false);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setIsVisible(false), 220);
  }, []);

  useEffect(() => {
    if (!message) return;

    const showFrame = requestAnimationFrame(() => {
      setIsVisible(true);
      requestAnimationFrame(() => setIsEntering(true));
    });
    const hideTimerId = setTimeout(closeToast, 5000);
    window.history.replaceState(null, "", window.location.pathname);

    return () => {
      cancelAnimationFrame(showFrame);
      clearTimeout(hideTimerId);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [closeToast, message]);

  if (!isVisible || !message) return null;

  const Icon = type === "error" ? AlertCircle : CheckCircle2;

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      data-type={type}
      className={`notification-toast fixed right-4 top-4 z-[100] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl border px-4 py-3.5 shadow-[0_16px_48px_rgba(23,42,51,0.2)] backdrop-blur-xl transition duration-200 sm:right-6 sm:top-6 sm:max-w-md ${
        isEntering ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
      } ${
        type === "error"
          ? "border-[#E2B7A9] bg-[#FFF3EF] text-[#733F36]"
          : "border-[#B8D9C5] bg-[#F0FBF4] text-[#2F5E48]"
      }`}
    >
      <Icon aria-hidden="true" className="shrink-0" size={20} />
      <p className="flex-1 text-sm font-medium leading-5">{message}</p>
      <button
        onClick={closeToast}
        className="notification-close flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition hover:bg-[#2F4858]/[0.07]"
        aria-label="Close notification"
      >
        <X aria-hidden="true" size={16} />
      </button>
    </div>
  );
}
