"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import LoadingSpinner from "@/components/LoadingSpinner";
import FileExplorer from "@/components/FileExplorer";
import Terminal from "@/components/Terminal";
import Header from "@/components/layout/Header";
import ActivityBar from "@/components/layout/ActivityBar";
import SearchPanel from "@/components/search/SearchPanel";
import GitPanel from "@/components/GitPanel";
import Debugger from "@/components/Debugger";

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
  const [terminalHeight, setTerminalHeight] = useState(300);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isDark, setIsDark] = useState(true);
  const [activePanel, setActivePanel] = useState("explorer");

  const handleThemeToggle = () => {
    setIsDark(!isDark);
    // Add theme switching logic here
  };

  const handleNewFile = () => {
    // Add new file logic here
  };

  const handleSave = () => {
    // Add save logic here
  };

  const renderSidePanel = () => {
    switch (activePanel) {
      case "explorer":
        return <FileExplorer workspaceId={workspace.id} />;
      case "search":
        return <SearchPanel workspaceId={workspace.id} />;
      case "git":
        return <GitPanel workspaceId={workspace.id} />;
      case "debug":
        return <Debugger workspaceId={workspace.id} />;
      case "extensions":
        return (
          <div className="p-4">
            <h2 className="text-lg font-medium mb-4">Extensions</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Extension management coming soon...
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[var(--bg-dark)]">
      {/* Header */}
      <Header onThemeToggle={handleThemeToggle} onNewFile={handleNewFile} onSave={handleSave} />

      {/* Main Content */}
      <div className="flex flex-1 min-h-0">
        {/* Activity Bar */}
        <ActivityBar activePanel={activePanel} onPanelChange={setActivePanel} />

        {/* Side Panel */}
        <div
          className="relative h-full bg-[var(--bg-darker)] border-r border-[var(--border-color)]"
          style={{ width: sidebarWidth, minWidth: sidebarWidth }}
        >
          <div className="h-full overflow-hidden">
            <ErrorBoundary>{renderSidePanel()}</ErrorBoundary>
          </div>
          {/* Resizer */}
          <div
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[var(--primary)] transition-colors"
            onMouseDown={(e) => {
              const startX = e.clientX;
              const startWidth = sidebarWidth;

              const handleMouseMove = (e: MouseEvent) => {
                const delta = e.clientX - startX;
                setSidebarWidth(Math.max(160, Math.min(480, startWidth + delta)));
              };

              const handleMouseUp = () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
              };

              document.addEventListener("mousemove", handleMouseMove);
              document.addEventListener("mouseup", handleMouseUp);
            }}
          />
        </div>

        {/* Editor and Terminal */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Editor */}
          <div className="flex-1 min-h-0">
            <ErrorBoundary>
              <Editor workspaceId={workspace.id} />
            </ErrorBoundary>
          </div>

          {/* Terminal */}
          <div
            className="relative bg-[var(--bg-darker)] border-t border-[var(--border-color)]"
            style={{ height: terminalHeight, minHeight: terminalHeight }}
          >
            <div
              className="absolute left-0 right-0 top-0 h-1 cursor-row-resize hover:bg-[var(--primary)] transition-colors"
              onMouseDown={(e) => {
                const startY = e.clientY;
                const startHeight = terminalHeight;

                const handleMouseMove = (e: MouseEvent) => {
                  const delta = startY - e.clientY;
                  setTerminalHeight(Math.max(100, Math.min(800, startHeight + delta)));
                };

                const handleMouseUp = () => {
                  document.removeEventListener("mousemove", handleMouseMove);
                  document.removeEventListener("mouseup", handleMouseUp);
                };

                document.addEventListener("mousemove", handleMouseMove);
                document.addEventListener("mouseup", handleMouseUp);
              }}
            />
            <div className="h-full overflow-hidden">
              <ErrorBoundary>
                <Terminal workspaceId={workspace.id} />
              </ErrorBoundary>
            </div>
          </div>
        </div>

        {/* AI Chat Panel */}
        <div
          className="relative h-full bg-[var(--bg-darker)] border-l border-[var(--border-color)]"
          style={{ width: chatWidth, minWidth: chatWidth }}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[var(--primary)] transition-colors"
            onMouseDown={(e) => {
              const startX = e.clientX;
              const startWidth = chatWidth;

              const handleMouseMove = (e: MouseEvent) => {
                const delta = startX - e.clientX;
                setChatWidth(Math.max(200, Math.min(800, startWidth + delta)));
              };

              const handleMouseUp = () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
              };

              document.addEventListener("mousemove", handleMouseMove);
              document.addEventListener("mouseup", handleMouseUp);
            }}
          />
          <div className="h-full overflow-hidden">
            <ErrorBoundary>
              <AIChatPanel workspaceId={workspace.id} />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
