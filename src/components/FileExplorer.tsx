"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useFile } from "@/contexts/FileContext";

interface FileItem {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileItem[];
  isOpen?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  item: FileItem;
  onClose: () => void;
  onNewFile: (path: string) => void;
  onNewFolder: (path: string) => void;
  onDelete: (path: string) => void;
  onRename: (oldPath: string, newName: string) => void;
}

interface FileExplorerProps {
  onFileSelect: (path: string) => void;
}

const ContextMenu = ({
  x,
  y,
  item,
  onClose,
  onNewFile,
  onNewFolder,
  onDelete,
  onRename,
}: ContextMenuProps) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(item.name);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute bg-[var(--bg-lighter)] border border-[var(--border-color)] rounded-md shadow-lg py-1 z-50"
      style={{ left: x, top: y }}
    >
      {isRenaming ? (
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onRename(item.path, newName);
              onClose();
            } else if (e.key === "Escape") {
              setIsRenaming(false);
            }
          }}
          className="block w-full px-4 py-1 text-sm bg-[var(--bg-darker)] text-[var(--text-primary)] focus:outline-none"
          autoFocus
        />
      ) : (
        <>
          {item.type === "directory" && (
            <>
              <button
                onClick={() => onNewFile(item.path)}
                className="block w-full px-4 py-1 text-left text-sm hover:bg-[var(--bg-darker)]"
              >
                New File
              </button>
              <button
                onClick={() => onNewFolder(item.path)}
                className="block w-full px-4 py-1 text-left text-sm hover:bg-[var(--bg-darker)]"
              >
                New Folder
              </button>
            </>
          )}
          <button
            onClick={() => setIsRenaming(true)}
            className="block w-full px-4 py-1 text-left text-sm hover:bg-[var(--bg-darker)]"
          >
            Rename
          </button>
          <button
            onClick={() => {
              onDelete(item.path);
              onClose();
            }}
            className="block w-full px-4 py-1 text-left text-sm text-red-500 hover:bg-[var(--bg-darker)]"
          >
            Delete
          </button>
        </>
      )}
    </div>
  );
};

export default function FileExplorer() {
  const { openFile } = useFile();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item: FileItem;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await fetch("/api/files");
      const data = await response.json();
      setFiles(data);
      setLoading(false);
    } catch (err) {
      setError("Failed to load files");
      setLoading(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, item: FileItem) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item,
    });
  };

  const handleNewFile = async (parentPath: string) => {
    const name = prompt("Enter file name:");
    if (!name) return;

    try {
      const response = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "file",
          parentPath,
          name,
        }),
      });

      if (!response.ok) throw new Error("Failed to create file");
      fetchFiles();
    } catch (err) {
      setError("Failed to create file");
    }
  };

  const handleNewFolder = async (parentPath: string) => {
    const name = prompt("Enter folder name:");
    if (!name) return;

    try {
      const response = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "directory",
          parentPath,
          name,
        }),
      });

      if (!response.ok) throw new Error("Failed to create folder");
      fetchFiles();
    } catch (err) {
      setError("Failed to create folder");
    }
  };

  const handleDelete = async (path: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const response = await fetch("/api/files", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });

      if (!response.ok) throw new Error("Failed to delete item");
      fetchFiles();
    } catch (err) {
      setError("Failed to delete item");
    }
  };

  const handleRename = async (oldPath: string, newName: string) => {
    try {
      const response = await fetch("/api/files", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPath,
          newName,
        }),
      });

      if (!response.ok) throw new Error("Failed to rename item");
      fetchFiles();
    } catch (err) {
      setError("Failed to rename item");
    }
  };

  const handleDrop = async (e: React.DragEvent, targetPath: string) => {
    e.preventDefault();
    setIsDragging(false);

    const sourcePath = e.dataTransfer.getData("text/plain");
    if (!sourcePath || sourcePath === targetPath) return;

    try {
      const response = await fetch("/api/files/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourcePath,
          targetPath,
        }),
      });

      if (!response.ok) throw new Error("Failed to move item");
      fetchFiles();
    } catch (err) {
      setError("Failed to move item");
    }
  };

  const toggleDirectory = (path: string) => {
    setFiles((prevFiles) => {
      const updateFiles = (items: FileItem[]): FileItem[] => {
        return items.map((item) => {
          if (item.path === path) {
            return { ...item, isOpen: !item.isOpen };
          }
          if (item.children) {
            return { ...item, children: updateFiles(item.children) };
          }
          return item;
        });
      };
      return updateFiles(prevFiles);
    });
  };

  const getFileIcon = (item: FileItem) => {
    if (item.type === "directory") {
      return item.isOpen ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
          />
        </svg>
      );
    }

    // File icons based on extension
    const extension = item.name.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "ts":
      case "tsx":
        return (
          <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 3h18v18H3V3m10.71 14.86c.66 0 1.2-.04 1.87-.36.27-.13.47-.29.74-.45l.67 1.3c-.8.6-1.84.9-3.08.9-2.62 0-4.04-1.69-4.04-4.04 0-2.31 1.29-4.17 3.7-4.17 2.35 0 3.35 1.87 3.35 3.77 0 .34-.04.6-.06.87h-5.17c.12 1.47 1.12 2.18 2.02 2.18M9.11 14.1h3.38c0-1.34-.76-2.18-1.69-2.18-1 0-1.62.87-1.69 2.18m-2.3-3.13h-.74V14c0 .92-.32 1.3-1.03 1.3-.56 0-.92-.28-1.27-.72l-.67 1.3c.54.6 1.2.91 2.02.91 1.47 0 2.62-.86 2.62-2.98v-2.84z" />
          </svg>
        );
      case "js":
      case "jsx":
        return (
          <svg className="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 3h18v18H3V3m4.73 15.04c.4.85 1.19 1.55 2.54 1.55 1.5 0 2.53-.8 2.53-2.55v-5.78h-1.7V17c0 .86-.35 1.08-.9 1.08-.58 0-.82-.4-1.09-.87l-1.38.83m5.98-.18c.5.98 1.51 1.73 3.09 1.73 1.6 0 2.8-.83 2.8-2.36 0-1.41-.81-2.04-2.25-2.66l-.42-.18c-.73-.31-1.04-.52-1.04-1.02 0-.41.31-.73.81-.73.48 0 .8.21 1.09.73l1.31-.87c-.55-.96-1.33-1.33-2.4-1.33-1.51 0-2.48.96-2.48 2.23 0 1.38.81 2.03 2.03 2.55l.42.18c.78.34 1.24.55 1.24 1.13 0 .48-.45.83-1.15.83-.83 0-1.31-.43-1.67-1.03l-1.38.8z" />
          </svg>
        );
      case "css":
        return (
          <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 3l-.65 3.34h13.59L17.5 8.5H3.92l-.66 3.33h13.59l-.76 3.81-5.48 1.81-4.75-1.81.33-1.64H2.85l-.79 4 7.85 3 9.05-3 1.2-6.03.24-1.21L21.94 3H5z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        );
    }
  };

  const handleFileClick = async (path: string) => {
    if (path) {
      await openFile(path);
    }
  };

  const renderFileTree = (items: FileItem[], level = 0) => {
    return items.map((item) => (
      <div
        key={item.path}
        style={{ paddingLeft: `${level * 16}px` }}
        onContextMenu={(e) => handleContextMenu(e, item)}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", item.path);
          setIsDragging(true);
        }}
        onDragOver={(e) => {
          if (item.type === "directory") {
            e.preventDefault();
            e.currentTarget.classList.add("bg-[var(--bg-darker)]");
          }
        }}
        onDragLeave={(e) => {
          e.currentTarget.classList.remove("bg-[var(--bg-darker)]");
        }}
        onDrop={(e) => {
          e.currentTarget.classList.remove("bg-[var(--bg-darker)]");
          if (item.type === "directory") {
            handleDrop(e, item.path);
          }
        }}
      >
        <button
          onClick={() =>
            item.type === "directory" ? toggleDirectory(item.path) : handleFileClick(item.path)
          }
          className={`
            flex items-center w-full px-2 py-1 text-sm
            hover:bg-[var(--bg-lighter)] rounded
            ${isDragging ? "cursor-move" : "cursor-pointer"}
            ${item.type === "file" ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}
          `}
        >
          <span className="mr-2">{getFileIcon(item)}</span>
          <span className="truncate">{item.name}</span>
        </button>
        {item.type === "directory" && item.isOpen && item.children && (
          <div className="mt-1">{renderFileTree(item.children, level + 1)}</div>
        )}
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-[var(--error)]">
        <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <p className="text-sm text-center">{error}</p>
        <button onClick={fetchFiles} className="mt-4 btn btn-primary text-sm">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="h-full overflow-y-auto p-2">{renderFileTree(files)}</div>
      {contextMenu &&
        createPortal(
          <ContextMenu
            {...contextMenu}
            onClose={() => setContextMenu(null)}
            onNewFile={handleNewFile}
            onNewFolder={handleNewFolder}
            onDelete={handleDelete}
            onRename={handleRename}
          />,
          document.body,
        )}
    </>
  );
}
