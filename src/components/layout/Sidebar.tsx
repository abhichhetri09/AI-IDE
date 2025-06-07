"use client";

import { useState } from "react";
import FileExplorer from "../FileExplorer";
import GitPanel from "../GitPanel";
import { SearchPanel } from "../search/SearchPanel";
import { motion, AnimatePresence } from "framer-motion";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { MessageCircle, FolderOpen, GitBranch, Search, Puzzle } from "lucide-react";

interface SidebarTab {
  id: string;
  label: string;
  icon: JSX.Element;
  badge?: number;
  panel: JSX.Element;
}

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState<string>("explorer");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [width, setWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);

  // Add keyboard shortcut for search
  useKeyboardShortcut(
    "p",
    () => {
      setActiveTab("search");
      setIsCollapsed(false);
    },
    { ctrlKey: true },
  );

  const tabs: SidebarTab[] = [
    {
      id: "explorer",
      label: "Explorer",
      icon: <FolderOpen className="w-5 h-5" />,
      panel: <FileExplorer />,
    },
    {
      id: "search",
      label: "Search",
      icon: <Search className="w-5 h-5" />,
      panel: <SearchPanel />,
    },
    {
      id: "git",
      label: "Source Control",
      icon: <GitBranch className="w-5 h-5" />,
      badge: 2,
      panel: <GitPanel />,
    },
    {
      id: "extensions",
      label: "Extensions",
      icon: <Puzzle className="w-5 h-5" />,
      panel: <div className="p-4 text-[var(--text-primary)]">Extensions Panel (Coming Soon)</div>,
    },
  ];

  const startResizing = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();

    const startWidth = width;
    const startX = e.pageX;

    const onMouseMove = (e: MouseEvent) => {
      const newWidth = startWidth + e.pageX - startX;
      if (newWidth > 160 && newWidth < 600) {
        setWidth(newWidth);
      }
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      setIsResizing(false);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div className="flex h-full select-none" style={{ width: isCollapsed ? 48 : width }}>
      {/* Tab Bar */}
      <div className="w-12 flex-shrink-0 bg-[var(--bg-darker)] border-r border-[var(--border-color)] flex flex-col items-center py-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`relative w-full p-3 mb-2 group transition-colors ${
              activeTab === tab.id
                ? "text-[var(--primary)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
            onClick={() => {
              if (activeTab === tab.id) {
                setIsCollapsed(!isCollapsed);
              } else {
                setActiveTab(tab.id);
                setIsCollapsed(false);
              }
            }}
            title={tab.label}
          >
            {/* Active Tab Indicator */}
            {activeTab === tab.id && (
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--primary)]" />
            )}

            {/* Icon */}
            {tab.icon}

            {/* Badge */}
            {tab.badge && (
              <div className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-[var(--primary)] text-white text-xs px-1">
                {tab.badge}
              </div>
            )}

            {/* Tooltip */}
            <div className="absolute left-12 top-1/2 -translate-y-1/2 px-2 py-1 bg-[var(--bg-darker)] border border-[var(--border-color)] rounded text-xs text-[var(--text-primary)] whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              {tab.label}
            </div>
          </button>
        ))}
      </div>

      {/* Content Panel */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: width - 48, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative flex-1 bg-[var(--bg-darker)] border-r border-[var(--border-color)]"
          >
            {/* Panel Header */}
            <div className="h-10 border-b border-[var(--border-color)] flex items-center px-4">
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {tabs.find((t) => t.id === activeTab)?.label}
              </span>
            </div>

            {/* Panel Content */}
            <div className="h-[calc(100%-2.5rem)] overflow-hidden">
              {tabs.find((t) => t.id === activeTab)?.panel}
            </div>

            {/* Resize Handle */}
            <div
              className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[var(--primary)] transition-colors ${
                isResizing ? "bg-[var(--primary)]" : "bg-transparent"
              }`}
              onMouseDown={startResizing}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
