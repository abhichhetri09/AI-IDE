"use client";

import { useState } from "react";
import FileExplorer from "../FileExplorer";
import GitPanel from "../GitPanel";
import { motion, AnimatePresence } from "framer-motion";

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

  const tabs: SidebarTab[] = [
    {
      id: "explorer",
      label: "Explorer",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
      ),
      panel: <FileExplorer />,
    },
    {
      id: "git",
      label: "Source Control",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      badge: 2,
      panel: <GitPanel />,
    },
    {
      id: "search",
      label: "Search",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      ),
      panel: <div className="p-4">Search Panel (Coming Soon)</div>,
    },
    {
      id: "extensions",
      label: "Extensions",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 7h-7m0 0v7m0-7l7 7m-7-7l-7 7M4 17h7m0 0v-7m0 7l-7-7m7 7l7-7"
          />
        </svg>
      ),
      panel: <div className="p-4">Extensions Panel (Coming Soon)</div>,
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
            className={`relative w-full p-3 mb-2 group ${
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
            <div className="absolute left-12 top-1/2 -translate-y-1/2 px-2 py-1 bg-[var(--bg-darker)] border border-[var(--border-color)] rounded text-xs whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
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
              <span className="text-sm font-medium">
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
