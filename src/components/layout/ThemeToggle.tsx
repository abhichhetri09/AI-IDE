"use client";

import { useTheme } from "@/hooks/useTheme";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mounting, we have access to the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="btn btn-ghost btn-sm opacity-0">
        <span className="w-4">•</span>
      </button>
    );
  }

  return (
    <button onClick={toggleTheme} className="btn btn-ghost btn-sm">
      {isDark ? "🌞" : "🌙"}
    </button>
  );
}
