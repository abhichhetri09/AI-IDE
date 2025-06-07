"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useFile } from "@/hooks/useFile";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  getWorkspaceHandle,
  listWorkspaceFiles,
  createWorkspaceFile,
  createWorkspaceDirectory,
  deleteWorkspaceEntry,
} from "@/lib/workspace";

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
  onDelete: (path: string) => void;
  onRename: (oldPath: string, newName: string) => void;
}

interface FileExplorerProps {
  workspaceId: string;
}

interface CreateDialogProps {
  type: "file" | "folder";
  parentPath: string;
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

const ContextMenu = ({ x, y, item, onClose, onDelete, onRename }: ContextMenuProps) => {
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

const CreateDialog = ({ type, parentPath, isOpen, onClose, onCreate }: CreateDialogProps) => {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim());
      setName("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New {type === "file" ? "File" : "Folder"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === "file" ? "filename.txt" : "folder-name"}
              autoFocus
            />
            {parentPath && (
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Will be created in: {parentPath}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function FileExplorer({ workspaceId }: FileExplorerProps) {
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
  const router = useRouter();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createDialogType, setCreateDialogType] = useState<"file" | "folder">("file");
  const [createDialogParentPath, setCreateDialogParentPath] = useState("");

  useEffect(() => {
    fetchFiles();
  }, [workspaceId]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const dirHandle = await getWorkspaceHandle(workspaceId);
      if (!dirHandle) {
        throw new Error("Could not access workspace directory. Please select it again.");
      }

      const files = await listWorkspaceFiles(dirHandle);
      if (!files || files.length === 0) {
        setFiles([]);
        setError("This workspace is empty. Create a new file to get started.");
      } else {
        setFiles(files);
        setError(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load files";
      setError(errorMessage);
      setFiles([]);

      // If it's a permission error, show a more helpful message
      if (errorMessage.includes("permission") || errorMessage.includes("access")) {
        toast.error("Permission denied. Please select the workspace folder again.", {
          action: {
            label: "Select Folder",
            onClick: () => router.push(`/workspace/${workspaceId}`),
          },
        });
      }
    } finally {
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

  const handleDelete = async (path: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const dirHandle = await getWorkspaceHandle(workspaceId);
      if (!dirHandle) {
        throw new Error("Could not access workspace directory");
      }

      await deleteWorkspaceEntry(dirHandle, path);
      fetchFiles();
    } catch (err) {
      toast.error("Failed to delete item");
    }
  };

  const handleRename = async (oldPath: string, newName: string) => {
    try {
      const dirHandle = await getWorkspaceHandle(workspaceId);
      if (!dirHandle) {
        throw new Error("Could not access workspace directory");
      }

      // Get the parent path and create the new path
      const parts = oldPath.split("/");
      const oldName = parts.pop()!;
      const parentPath = parts.join("/");
      const newPath = parentPath ? `${parentPath}/${newName}` : newName;

      // Get the source item
      let currentDir = dirHandle;
      for (const part of parts) {
        if (!part) continue;
        currentDir = await currentDir.getDirectoryHandle(part);
      }

      const sourceItem = contextMenu?.item;
      if (!sourceItem) return;

      if (sourceItem.type === "file") {
        // For files, read content and create new file
        const fileHandle = await currentDir.getFileHandle(oldName);
        const file = await fileHandle.getFile();
        const content = await file.text();
        await createWorkspaceFile(dirHandle, newPath, content);
      } else {
        // For directories, create new directory and copy contents
        await createWorkspaceDirectory(dirHandle, newPath);

        const copyContents = async (sourceDir: FileSystemDirectoryHandle, targetPath: string) => {
          for await (const entry of sourceDir.values()) {
            const entryPath = `${targetPath}/${entry.name}`;
            if (entry.kind === "file") {
              const fileHandle = await sourceDir.getFileHandle(entry.name);
              const file = await fileHandle.getFile();
              const content = await file.text();
              await createWorkspaceFile(dirHandle, entryPath, content);
            } else {
              await createWorkspaceDirectory(dirHandle, entryPath);
              await copyContents(entry, entryPath);
            }
          }
        };

        const sourceDir = await currentDir.getDirectoryHandle(oldName);
        await copyContents(sourceDir, newPath);
      }

      // Delete the old item
      await deleteWorkspaceEntry(dirHandle, oldPath);
      fetchFiles();
    } catch (err) {
      toast.error("Failed to rename item");
    }
  };

  const handleDrop = async (e: React.DragEvent, targetPath: string) => {
    e.preventDefault();
    setIsDragging(false);

    const sourcePath = e.dataTransfer.getData("text/plain");
    if (!sourcePath || sourcePath === targetPath) return;

    try {
      const dirHandle = await getWorkspaceHandle(workspaceId);
      if (!dirHandle) {
        throw new Error("Could not access workspace directory");
      }

      // Get source and target paths
      const sourceParts = sourcePath.split("/");
      const sourceName = sourceParts.pop()!;
      const sourceParentPath = sourceParts.join("/");

      const targetParts = targetPath.split("/");
      const targetName = targetParts.pop()!;
      let newPath = targetPath;

      // If target is a directory, move inside it
      const targetItem = files.find((item) => item.path === targetPath);
      if (targetItem?.type === "directory") {
        newPath = `${targetPath}/${sourceName}`;
      } else {
        // If target is a file, move to its parent directory
        newPath = `${targetParts.join("/")}/${sourceName}`;
      }

      // Navigate to source directory
      let sourceDir = dirHandle;
      for (const part of sourceParts) {
        if (!part) continue;
        sourceDir = await sourceDir.getDirectoryHandle(part);
      }

      // Get the source item
      const sourceItem = await (sourceName.includes(".")
        ? sourceDir.getFileHandle(sourceName)
        : sourceDir.getDirectoryHandle(sourceName));

      if (sourceItem.kind === "file") {
        // For files, read content and create new file
        const file = await (sourceItem as FileSystemFileHandle).getFile();
        const content = await file.text();
        await createWorkspaceFile(dirHandle, newPath, content);
      } else {
        // For directories, create new directory and copy contents
        await createWorkspaceDirectory(dirHandle, newPath);

        const copyContents = async (sourceDir: FileSystemDirectoryHandle, targetPath: string) => {
          for await (const entry of sourceDir.values()) {
            const entryPath = `${targetPath}/${entry.name}`;
            if (entry.kind === "file") {
              const fileHandle = await sourceDir.getFileHandle(entry.name);
              const file = await fileHandle.getFile();
              const content = await file.text();
              await createWorkspaceFile(dirHandle, entryPath, content);
            } else {
              await createWorkspaceDirectory(dirHandle, entryPath);
              await copyContents(entry, entryPath);
            }
          }
        };

        await copyContents(sourceItem as FileSystemDirectoryHandle, newPath);
      }

      // Delete the source item
      await deleteWorkspaceEntry(dirHandle, sourcePath);
      fetchFiles();
    } catch (err) {
      toast.error("Failed to move item");
    }
  };

  const handleFileClick = async (path: string) => {
    try {
      if (path) {
        const content = await openFile(workspaceId, path);
        // You might want to do something with the content here
        // For example, open it in an editor
      }
    } catch (err) {
      toast.error("Failed to open file");
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
        <svg
          className="w-4 h-4 text-[var(--text-secondary)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
      ) : (
        <svg
          className="w-4 h-4 text-[var(--text-secondary)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
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
          <svg className="w-4 h-4 text-[var(--primary)]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 3h18v18H3V3m10.71 14.86c.66 0 1.2-.04 1.87-.36.27-.13.47-.29.74-.45l.67 1.3c-.8.6-1.84.9-3.08.9-2.62 0-4.04-1.69-4.04-4.04 0-2.31 1.29-4.17 3.7-4.17 2.35 0 3.35 1.87 3.35 3.77 0 .34-.04.6-.06.87h-5.17c.12 1.47 1.12 2.18 2.02 2.18M9.11 14.1h3.38c0-1.34-.76-2.18-1.69-2.18-1 0-1.62.87-1.69 2.18m-2.3-3.13h-.74V14c0 .92-.32 1.3-1.03 1.3-.56 0-.92-.28-1.27-.72l-.67 1.3c.54.6 1.2.91 2.02.91 1.47 0 2.62-.86 2.62-2.98v-2.84z" />
          </svg>
        );
      case "js":
      case "jsx":
        return (
          <svg className="w-4 h-4 text-[var(--warning)]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 3h18v18H3V3m4.73 15.04c.4.85 1.19 1.55 2.54 1.55 1.5 0 2.53-.8 2.53-2.55v-5.78h-1.7V17c0 .86-.35 1.08-.9 1.08-.58 0-.82-.4-1.09-.87l-1.38.83m5.98-.18c.5.98 1.51 1.73 3.09 1.73 1.6 0 2.8-.83 2.8-2.36 0-1.41-.81-2.04-2.25-2.66l-.42-.18c-.73-.31-1.04-.52-1.04-1.02 0-.41.31-.73.81-.73.48 0 .8.21 1.09.73l1.31-.87c-.55-.96-1.33-1.33-2.4-1.33-1.51 0-2.48.96-2.48 2.23 0 1.38.81 2.03 2.03 2.55l.42.18c.78.34 1.24.55 1.24 1.13 0 .48-.45.83-1.15.83-.83 0-1.31-.43-1.67-1.03l-1.38.8z" />
          </svg>
        );
      case "css":
        return (
          <svg className="w-4 h-4 text-[var(--info)]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 3l-.65 3.34h13.59L17.5 8.5H3.92l-.66 3.33h13.59l-.76 3.81-5.48 1.81-4.75-1.81.33-1.64H2.85l-.79 4 7.85 3 9.05-3 1.2-6.03.24-1.21L21.94 3H5z" />
          </svg>
        );
      default:
        return (
          <svg
            className="w-4 h-4 text-[var(--text-secondary)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
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

  const renderFileTree = (items: FileItem[], level = 0) => {
    return items.map((item) => (
      <div key={item.path} style={{ paddingLeft: `${level * 16}px` }}>
        <div
          className={`flex items-center py-1 px-2 hover:bg-[var(--bg-lighter)] cursor-pointer group ${
            item.isOpen ? "bg-[var(--bg-lighter)]" : ""
          }`}
          onClick={() =>
            item.type === "directory" ? toggleDirectory(item.path) : handleFileClick(item.path)
          }
          onContextMenu={(e) => handleContextMenu(e, item)}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add("bg-[var(--bg-lighter)]");
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove("bg-[var(--bg-lighter)]");
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove("bg-[var(--bg-lighter)]");
            handleDrop(e, item.path);
          }}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", item.path);
            setIsDragging(true);
          }}
          onDragEnd={() => setIsDragging(false)}
        >
          <span className="mr-2 flex-shrink-0">{getFileIcon(item)}</span>
          <span className="text-sm text-[var(--text-primary)] truncate flex-1">{item.name}</span>
        </div>
        {item.type === "directory" && item.isOpen && item.children && (
          <div>{renderFileTree(item.children, level + 1)}</div>
        )}
      </div>
    ));
  };

  return (
    <div className="h-full flex flex-col">
      {/* File Tree */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-[var(--primary)] border-t-transparent" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <p className="text-[var(--error)] mb-4">{error}</p>
            <Button
              variant="outline"
              onClick={fetchFiles}
              className="hover:text-[var(--primary)] hover:border-[var(--primary)]"
            >
              Try Again
            </Button>
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <p className="text-[var(--text-secondary)] mb-4">No files found</p>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogType("file");
                setCreateDialogParentPath("");
                setCreateDialogOpen(true);
              }}
              className="hover:text-[var(--primary)] hover:border-[var(--primary)]"
            >
              Create File
            </Button>
          </div>
        ) : (
          <div className="py-1">{renderFileTree(files)}</div>
        )}
      </div>

      {contextMenu &&
        createPortal(
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            item={contextMenu.item}
            onClose={() => setContextMenu(null)}
            onDelete={handleDelete}
            onRename={handleRename}
          />,
          document.body,
        )}

      <CreateDialog
        type={createDialogType}
        parentPath={createDialogParentPath}
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={async (name) => {
          const dirHandle = await getWorkspaceHandle(workspaceId);
          if (!dirHandle) return;

          const path = createDialogParentPath ? `${createDialogParentPath}/${name}` : name;

          try {
            if (createDialogType === "file") {
              await createWorkspaceFile(dirHandle, path);
            } else {
              await createWorkspaceDirectory(dirHandle, path);
            }
            await fetchFiles();
            toast.success(
              `${createDialogType === "file" ? "File" : "Folder"} created successfully`,
            );
          } catch (err) {
            toast.error(`Failed to create ${createDialogType}`);
          }
        }}
      />
    </div>
  );
}
