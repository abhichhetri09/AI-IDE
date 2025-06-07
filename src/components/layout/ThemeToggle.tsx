"use client";

import { useTheme } from "@/hooks/useTheme";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mounting, we have access to the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="w-8 h-8 flex items-center justify-center rounded-md opacity-0">
        <span className="sr-only">Toggle theme</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[var(--bg-lighter)] transition-colors"
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      <span className="sr-only">Toggle theme</span>
      {isDark ? (
        <Sun className="w-4 h-4 text-[var(--text-primary)] hover:text-[var(--primary)]" />
      ) : (
        <Moon className="w-4 h-4 text-[var(--text-primary)] hover:text-[var(--primary)]" />
      )}
    </button>
  );
}
