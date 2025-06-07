import { useEffect, useRef } from "react";

interface MenuItemBase {
  divider?: boolean;
}

interface ActionMenuItem extends MenuItemBase {
  label: string;
  shortcut?: string;
  onClick?: () => void;
  divider?: false;
}

interface DividerMenuItem extends MenuItemBase {
  divider: true;
}

export type MenuItem = ActionMenuItem | DividerMenuItem;

interface MenuProps {
  items: MenuItem[];
  isOpen: boolean;
  onClose: () => void;
  position?: { top: number; left: number };
}

export default function Menu({ items, isOpen, onClose, position }: MenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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
      className="fixed z-50 bg-white dark:bg-gray-800 shadow-lg rounded-md py-1 min-w-[200px]"
      style={{
        top: position?.top ?? 0,
        left: position?.left ?? 0,
      }}
    >
      {items.map((item, index) => (
        <div key={index}>
          {item.divider ? (
            <hr className="my-1 border-gray-200 dark:border-gray-700" />
          ) : (
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center group"
              onClick={() => {
                item.onClick?.();
                onClose();
              }}
            >
              <span className="text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">
                {item.label}
              </span>
              {item.shortcut && (
                <span className="ml-4 text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">
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
