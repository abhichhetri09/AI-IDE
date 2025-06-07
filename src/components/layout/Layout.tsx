"use client";

import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { theme } = useTheme();

  return (
    <div className={cn("h-screen flex flex-col bg-[var(--bg-dark)] text-[var(--text-primary)]")}>
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">{children}</div>
    </div>
  );
}
