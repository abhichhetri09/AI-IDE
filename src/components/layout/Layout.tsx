"use client";

import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import dynamic from "next/dynamic";
import { useTheme } from "@/hooks/useTheme";
import { FileProvider } from "@/contexts/FileContext";

const Terminal = dynamic(() => import("../Terminal"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--primary)] border-t-transparent" />
    </div>
  ),
});

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { theme } = useTheme();
  const [terminalHeight, setTerminalHeight] = useState(300);
  const [isTerminalVisible, setIsTerminalVisible] = useState(true);
  const [isResizingTerminal, setIsResizingTerminal] = useState(false);

  const startResizingTerminal = (e: React.MouseEvent) => {
    setIsResizingTerminal(true);
    e.preventDefault();

    const startHeight = terminalHeight;
    const startY = e.pageY;

    const onMouseMove = (e: MouseEvent) => {
      const containerHeight = window.innerHeight - 48; // 48px for header
      const newHeight = containerHeight - (e.pageY - 48); // 48px for header
      if (newHeight > 100 && newHeight < containerHeight - 200) {
        setTerminalHeight(newHeight);
      }
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      setIsResizingTerminal(false);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div className={`h-screen flex flex-col ${theme}`}>
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Content */}
          <div
            className="flex-1 overflow-hidden min-h-0"
            style={{
              height: isTerminalVisible ? `calc(100% - ${terminalHeight}px)` : "100%",
            }}
          >
            {children}
          </div>

          {/* Terminal */}
          {isTerminalVisible && (
            <div
              className="relative bg-[var(--bg-darker)] border-t border-[var(--border-color)]"
              style={{ height: terminalHeight }}
            >
              {/* Terminal Resize Handle */}
              <div
                className={`absolute left-0 right-0 top-0 h-1 cursor-row-resize hover:bg-[var(--primary)] transition-colors ${
                  isResizingTerminal ? "bg-[var(--primary)]" : "bg-transparent"
                }`}
                onMouseDown={startResizingTerminal}
              />

              {/* Terminal Header */}
              <div className="flex items-center justify-between px-4 h-8 border-b border-[var(--border-color)]">
                <span className="text-sm font-medium">Terminal</span>
                <div className="flex items-center space-x-2">
                  <button
                    className="p-1 hover:bg-[var(--bg-lighter)] rounded"
                    onClick={() => setIsTerminalVisible(false)}
                    title="Hide Terminal"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Terminal Content */}
              <div className="h-[calc(100%-2rem)] overflow-hidden">
                <Terminal />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
