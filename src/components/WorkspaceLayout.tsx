"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import LoadingSpinner from "@/components/LoadingSpinner";
import TerminalComponent from "@/components/Terminal";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { useTheme } from "@/hooks/useTheme";
import { GripHorizontal } from "lucide-react";

// Dynamically import components that use browser APIs
const Editor = dynamic(() => import("@/components/editor/Editor"), {
  ssr: false,
  loading: () => <LoadingSpinner />,
});

const AIChatPanel = dynamic(() => import("@/components/AIChatPanel"), {
  ssr: false,
  loading: () => <LoadingSpinner />,
});

interface Workspace {
  id: string;
  path: string;
  created: string;
  modified: string;
}

interface WorkspaceLayoutProps {
  workspace: Workspace;
}

export default function WorkspaceLayout({ workspace }: WorkspaceLayoutProps) {
  const [chatWidth, setChatWidth] = useState(300);
  const [terminalHeight, setTerminalHeight] = useState(200);
  const [isResizingTerminal, setIsResizingTerminal] = useState(false);
  const [isTerminalVisible, setIsTerminalVisible] = useState(true);
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const { toggleTheme } = useTheme();

  const handleNewFile = () => {
    // Add new file logic here
  };

  const handleSave = () => {
    // Add save logic here
  };

  const startResizingTerminal = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingTerminal(true);
  }, []);

  const stopResizingTerminal = useCallback(() => {
    setIsResizingTerminal(false);
  }, []);

  const handleTerminalResize = useCallback(
    (e: MouseEvent) => {
      if (!isResizingTerminal || !terminalContainerRef.current) return;

      const containerRect = terminalContainerRef.current.getBoundingClientRect();
      const containerBottom = containerRect.bottom;
      const newHeight = Math.max(100, containerBottom - e.clientY);

      setTerminalHeight(newHeight);
    },
    [isResizingTerminal],
  );

  // Add event listeners for terminal resizing
  useEffect(() => {
    if (isResizingTerminal) {
      window.addEventListener("mousemove", handleTerminalResize);
      window.addEventListener("mouseup", stopResizingTerminal);
    }

    return () => {
      window.removeEventListener("mousemove", handleTerminalResize);
      window.removeEventListener("mouseup", stopResizingTerminal);
    };
  }, [isResizingTerminal, handleTerminalResize, stopResizingTerminal]);

  return (
    <div className="flex flex-col h-screen w-full bg-[var(--bg-dark)]">
      {/* Header */}
      <Header onThemeToggle={toggleTheme} onNewFile={handleNewFile} onSave={handleSave} />

      {/* Main Content */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <Sidebar workspaceId={workspace.id} />

        {/* Editor and Terminal */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 min-h-0">
            <ErrorBoundary>
              <Editor />
            </ErrorBoundary>
          </div>

          {/* Terminal Container */}
          <div
            ref={terminalContainerRef}
            className={`relative flex flex-col transition-all duration-200 ease-in-out ${
              isTerminalVisible ? "" : "h-0 overflow-hidden"
            }`}
            style={{ height: isTerminalVisible ? terminalHeight : 0 }}
          >
            {/* Terminal Resize Handle */}
            <div
              className="absolute top-0 left-0 right-0 h-2 bg-[var(--bg-darker)] cursor-row-resize flex items-center justify-center group z-10 hover:bg-[var(--bg-lightest)]"
              onMouseDown={startResizingTerminal}
            >
              <GripHorizontal
                size={14}
                className="text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>

            {/* Terminal Header */}
            <div className="h-9 bg-[var(--bg-darker)] border-t border-[var(--border-color)] flex items-center px-4">
              <h3 className="text-sm font-medium text-[var(--text-secondary)]">Terminal</h3>
              <button
                className="ml-auto text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                onClick={() => setIsTerminalVisible(!isTerminalVisible)}
              >
                {isTerminalVisible ? "Hide" : "Show"}
              </button>
            </div>

            {/* Terminal Content */}
            <div className="flex-1 min-h-0 bg-[var(--bg-darker)]">
              <TerminalComponent />
            </div>
          </div>
        </div>

        {/* AI Chat Panel */}
        <div style={{ width: chatWidth }}>
          <ErrorBoundary>
            <AIChatPanel />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
