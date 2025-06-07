"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface HeaderProps {
  onThemeToggle: () => void;
  onNewFile: () => void;
  onSave: () => void;
}

export default function Header({ onThemeToggle, onNewFile, onSave }: HeaderProps) {
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [isHelpMenuOpen, setIsHelpMenuOpen] = useState(false);
  const router = useRouter();

  const handleKeyboardShortcut = (e: React.KeyboardEvent) => {
    if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSave();
    }
  };

  return (
    <header className="h-10 bg-[var(--bg-darker)] border-b border-[var(--border-color)] flex items-center px-4 select-none">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-4">
        <button
          onClick={() => router.push("/")}
          className="text-[var(--primary)] font-semibold hover:text-[var(--primary-darker)]"
        >
          AI IDE
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex items-center space-x-1">
        {/* File Menu */}
        <div className="relative">
          <button
            className="px-3 py-1 hover:bg-[var(--bg-lighter)] rounded transition-colors"
            onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}
            onBlur={() => setTimeout(() => setIsFileMenuOpen(false), 100)}
          >
            File
          </button>
          {isFileMenuOpen && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-[var(--bg-darker)] border border-[var(--border-color)] rounded-md shadow-lg py-1 z-50">
              <button
                className="w-full px-4 py-2 text-left hover:bg-[var(--bg-lighter)] text-sm flex items-center justify-between group"
                onClick={onNewFile}
              >
                <span>New File</span>
                <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                  ⌘N
                </span>
              </button>
              <button
                className="w-full px-4 py-2 text-left hover:bg-[var(--bg-lighter)] text-sm flex items-center justify-between group"
                onClick={onSave}
              >
                <span>Save</span>
                <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                  ⌘S
                </span>
              </button>
              <div className="border-t border-[var(--border-color)] my-1" />
              <button
                className="w-full px-4 py-2 text-left hover:bg-[var(--bg-lighter)] text-sm"
                onClick={() => router.push("/")}
              >
                Exit to Workspaces
              </button>
            </div>
          )}
        </div>

        {/* Edit Menu */}
        <button className="px-3 py-1 hover:bg-[var(--bg-lighter)] rounded transition-colors">
          Edit
        </button>

        {/* View Menu */}
        <button className="px-3 py-1 hover:bg-[var(--bg-lighter)] rounded transition-colors">
          View
        </button>

        {/* Help Menu */}
        <div className="relative">
          <button
            className="px-3 py-1 hover:bg-[var(--bg-lighter)] rounded transition-colors"
            onClick={() => setIsHelpMenuOpen(!isHelpMenuOpen)}
            onBlur={() => setTimeout(() => setIsHelpMenuOpen(false), 100)}
          >
            Help
          </button>
          {isHelpMenuOpen && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-[var(--bg-darker)] border border-[var(--border-color)] rounded-md shadow-lg py-1 z-50">
              <button className="w-full px-4 py-2 text-left hover:bg-[var(--bg-lighter)] text-sm">
                Documentation
              </button>
              <button className="w-full px-4 py-2 text-left hover:bg-[var(--bg-lighter)] text-sm">
                Keyboard Shortcuts
              </button>
              <div className="border-t border-[var(--border-color)] my-1" />
              <button className="w-full px-4 py-2 text-left hover:bg-[var(--bg-lighter)] text-sm">
                About AI IDE
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Right Section */}
      <div className="ml-auto flex items-center space-x-2">
        <button
          onClick={onThemeToggle}
          className="p-1.5 rounded-full hover:bg-[var(--bg-lighter)] transition-colors"
          title="Toggle Theme"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        </button>

        <button
          className="p-1.5 rounded-full hover:bg-[var(--bg-lighter)] transition-colors"
          title="Settings"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}
