"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useFileOperations } from "@/hooks/useFileOperations";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import Menu, { MenuItem } from "./Menu";
import dynamic from "next/dynamic";

const ThemeToggle = dynamic(() => import("./ThemeToggle"), {
  ssr: false,
});

export default function Header() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const headerRef = useRef<HTMLElement>(null);
  const { createNewFile, openFile, saveFile, saveFileAs } = useFileOperations();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    }

    if (activeMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeMenu]);

  // Register keyboard shortcuts
  useKeyboardShortcuts([
    { key: "n", ctrl: true, handler: createNewFile },
    { key: "o", ctrl: true, handler: openFile },
    { key: "s", ctrl: true, handler: saveFile },
    { key: "s", ctrl: true, shift: true, handler: saveFileAs },
  ]);

  const setButtonRef = useCallback(
    (id: string) => (el: HTMLButtonElement | null) => {
      buttonRefs.current[id] = el;
    },
    [],
  );

  const getMenuPosition = (buttonId: string) => {
    const button = buttonRefs.current[buttonId];
    if (!button) return { top: 0, left: 0 };
    const rect = button.getBoundingClientRect();
    const headerHeight = headerRef.current?.getBoundingClientRect().height || 0;
    return {
      top: headerHeight,
      left: rect.left,
    };
  };

  const fileMenuItems: MenuItem[] = [
    { label: "New File", shortcut: "Ctrl+N", onClick: createNewFile },
    { label: "Open File...", shortcut: "Ctrl+O", onClick: openFile },
    { label: "Save", shortcut: "Ctrl+S", onClick: saveFile },
    { label: "Save As...", shortcut: "Ctrl+Shift+S", onClick: saveFileAs },
    { divider: true },
    { label: "Exit", shortcut: "Alt+F4" },
  ];

  const editMenuItems: MenuItem[] = [
    { label: "Undo", shortcut: "Ctrl+Z" },
    { label: "Redo", shortcut: "Ctrl+Y" },
    { divider: true },
    { label: "Cut", shortcut: "Ctrl+X" },
    { label: "Copy", shortcut: "Ctrl+C" },
    { label: "Paste", shortcut: "Ctrl+V" },
    { divider: true },
    { label: "Find", shortcut: "Ctrl+F" },
    { label: "Replace", shortcut: "Ctrl+H" },
  ];

  const viewMenuItems: MenuItem[] = [
    { label: "Command Palette", shortcut: "Ctrl+Shift+P" },
    { divider: true },
    { label: "Explorer", shortcut: "Ctrl+Shift+E" },
    { label: "Search", shortcut: "Ctrl+Shift+F" },
    { label: "Source Control", shortcut: "Ctrl+Shift+G" },
    { divider: true },
    { label: "Toggle Terminal", shortcut: "Ctrl+`" },
  ];

  const runMenuItems: MenuItem[] = [
    { label: "Start Debugging", shortcut: "F5" },
    { label: "Run Without Debugging", shortcut: "Ctrl+F5" },
    { divider: true },
    { label: "Toggle Breakpoint", shortcut: "F9" },
  ];

  const helpMenuItems: MenuItem[] = [
    { label: "Documentation", shortcut: "F1" },
    { label: "Check for Updates..." },
    { divider: true },
    { label: "About" },
  ];

  const menuConfig = {
    file: { items: fileMenuItems, label: "File" },
    edit: { items: editMenuItems, label: "Edit" },
    view: { items: viewMenuItems, label: "View" },
    run: { items: runMenuItems, label: "Run" },
    help: { items: helpMenuItems, label: "Help" },
  };

  return (
    <header
      ref={headerRef}
      className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 relative"
    >
      <div className="flex items-center h-12 px-4">
        <div className="flex-1 flex items-center space-x-4">
          <h1 className="text-lg font-semibold text-gradient">AI IDE</h1>
          <nav className="hidden md:flex space-x-2">
            {Object.entries(menuConfig).map(([id, menu]) => (
              <button
                key={id}
                ref={setButtonRef(id)}
                className="btn btn-ghost text-sm relative"
                onClick={() => setActiveMenu(activeMenu === id ? null : id)}
              >
                {menu.label}
                {activeMenu === id && (
                  <Menu
                    items={menu.items}
                    isOpen={true}
                    onClose={() => setActiveMenu(null)}
                    position={getMenuPosition(id)}
                  />
                )}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
