import { useEffect, useRef } from "react";

export interface MenuItem {
  label?: string;
  shortcut?: string;
  onClick?: () => void;
  divider?: boolean;
}

interface MenuProps {
  items: MenuItem[];
  isOpen: boolean;
  onClose: () => void;
  position?: { top: number; left: number };
}

export default function Menu({ items, isOpen, onClose, position }: MenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Adjust menu position to stay within viewport
  useEffect(() => {
    if (!menuRef.current || !position) return;

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Check if menu extends beyond right edge
    if (position.left + rect.width > viewportWidth) {
      menu.style.left = `${viewportWidth - rect.width - 8}px`;
    } else {
      menu.style.left = `${position.left}px`;
    }

    // Check if menu extends beyond bottom edge
    if (position.top + rect.height > viewportHeight) {
      menu.style.top = `${position.top - rect.height}px`;
    } else {
      menu.style.top = `${position.top}px`;
    }
  }, [position, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-[var(--bg-darker)] border border-[var(--border-color)] shadow-lg rounded-md py-1 min-w-[200px]"
      style={{
        top: position?.top ?? 0,
        left: position?.left ?? 0,
      }}
    >
      {items.map((item, index) => (
        <div key={index}>
          {item.divider ? (
            <hr className="my-1 border-[var(--border-color)]" />
          ) : (
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--bg-lighter)] text-[var(--text-primary)] flex justify-between items-center group transition-colors"
              onClick={() => {
                item.onClick?.();
                onClose();
              }}
            >
              <span>{item.label}</span>
              {item.shortcut && (
                <span className="ml-4 text-xs text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                  {item.shortcut}
                </span>
              )}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
