"use client";

import { useState } from "react";
import FileExplorer from "../FileExplorer";
import Files from "../Files";
import GitPanel from "../GitPanel";
import SearchPanel from "../search/SearchPanel";
import { motion, AnimatePresence } from "framer-motion";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { MessageCircle, FolderOpen, GitBranch, Search, Puzzle, FileText } from "lucide-react";

interface SidebarProps {
  workspaceId: string;
}

type Panel = "explorer" | "files" | "search" | "git" | "extensions";

export default function Sidebar({ workspaceId }: SidebarProps) {
  const [activePanel, setActivePanel] = useState<Panel>("explorer");
  const [isCollapsed, setIsCollapsed] = useState(false);

  useKeyboardShortcut("ctrl+b", () => setIsCollapsed((prev) => !prev));

  const panels = [
    {
      id: "explorer" as Panel,
      icon: FolderOpen,
      title: "Explorer",
      component: <FileExplorer workspaceId={workspaceId} />,
    },
    {
      id: "files" as Panel,
      icon: FileText,
      title: "Files",
      component: <Files workspaceId={workspaceId} />,
    },
    {
      id: "search" as Panel,
      icon: Search,
      title: "Search",
      component: <SearchPanel workspaceId={workspaceId} />,
    },
    {
      id: "git" as Panel,
      icon: GitBranch,
      title: "Source Control",
      component: <GitPanel workspaceId={workspaceId} />,
    },
    {
      id: "extensions" as Panel,
      icon: Puzzle,
      title: "Extensions",
      component: <div>Extensions</div>,
    },
  ];

  return (
    <div className="h-full flex select-none">
      {/* Activity Bar */}
      <div className="w-12 flex-shrink-0 bg-[var(--bg-darker)] border-r border-[var(--border-color)]">
        <div className="flex flex-col items-center py-2">
          {panels.map((panel) => {
            const Icon = panel.icon;
            return (
              <button
                key={panel.id}
                onClick={() => {
                  if (activePanel === panel.id && !isCollapsed) {
                    setIsCollapsed(true);
                  } else {
                    setActivePanel(panel.id);
                    setIsCollapsed(false);
                  }
                }}
                className={`relative w-full p-3 mb-1 group ${
                  activePanel === panel.id
                    ? "text-[var(--primary)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
                title={panel.title}
              >
                {/* Active Indicator */}
                {activePanel === panel.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--primary)]" />
                )}
                <Icon size={20} />
                {/* Tooltip */}
                <div className="absolute left-12 top-1/2 -translate-y-1/2 px-2 py-1 bg-[var(--bg-darker)] border border-[var(--border-color)] rounded text-xs whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  {panel.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel Content */}
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div
            key={activePanel}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="w-[240px] flex-shrink-0 bg-[var(--bg-darker)] border-r border-[var(--border-color)] flex flex-col overflow-hidden"
          >
            <div className="h-9 border-b border-[var(--border-color)] flex items-center px-4">
              <h2 className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                {panels.find((p) => p.id === activePanel)?.title}
              </h2>
            </div>
            <div className="flex-1 overflow-hidden">
              {panels.find((p) => p.id === activePanel)?.component}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
