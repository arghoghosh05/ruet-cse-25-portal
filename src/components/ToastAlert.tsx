"use client";

import { useState, useEffect } from "react";

export default function ToastAlert({ error, success }: { error?: string; success?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"error" | "success" | "">("");

  useEffect(() => {
    if (error || success) {
      setMessage(error || success || "");
      setType(error ? "error" : "success");
      setIsVisible(true);
      
      // Trigger the slide-in animation
      setTimeout(() => setIsEntering(true), 10);

      // Silently clean the URL so refreshes don't trigger the alert again
      window.history.replaceState(null, "", window.location.pathname);

      // Auto-hide completely after 5 seconds
      const timer = setTimeout(() => {
        closeToast();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const closeToast = () => {
    setIsEntering(false);
    setTimeout(() => setIsVisible(false), 300); // Wait for the slide-out animation to finish
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed top-6 right-6 z-[100] flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border transition-all duration-300 transform ${
        isEntering ? "translate-y-0 opacity-100" : "-translate-y-8 opacity-0"
      } ${
        type === "error" 
          ? "bg-red-950/90 border-red-500/50 text-red-400" 
          : "bg-emerald-950/90 border-emerald-500/50 text-emerald-400"
      }`}
    >
      {type === "error" ? (
        <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      ) : (
        <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      )}
      
      <p className="font-medium text-sm md:text-base pr-2">{message}</p>
      
      <button 
        onClick={closeToast} 
        className="shrink-0 p-1.5 rounded-full hover:bg-white/10 transition-colors"
        aria-label="Close"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    </div>
  );
}