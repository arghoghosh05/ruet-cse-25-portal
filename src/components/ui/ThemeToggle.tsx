"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#DDFBEF]/20 bg-white/5 text-[#DDFBEF] transition hover:border-[#DDFBEF]/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      <Moon aria-hidden="true" className="theme-toggle-moon" size={19} />
      <Sun aria-hidden="true" className="theme-toggle-sun" size={19} />
    </button>
  );
}
