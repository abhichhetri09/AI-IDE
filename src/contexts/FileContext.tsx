"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface FileState {
  id: string;
  path: string;
  content: string;
  isDirty?: boolean;
}

interface FileContextType {
  files: FileState[];
  currentFile: FileState | null;
  openFile: (path: string) => Promise<void>;
  closeFile: (id: string) => void;
  setActiveFile: (id: string) => void;
  updateFileContent: (id: string, content: string) => void;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

function generateUniqueId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function FileProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<FileState[]>([]);
  const [currentFile, setCurrentFile] = useState<FileState | null>(null);

  const openFile = async (path: string) => {
    try {
      const response = await fetch(`/api/files/content?path=${encodeURIComponent(path)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to open file");
      }

      const newFile = {
        id: generateUniqueId(),
        path,
        content: data.content,
        isDirty: false,
      };

      setFiles((prev) => [...prev, newFile]);
      setCurrentFile(newFile);
    } catch (error) {
      console.error("Error opening file:", error);
    }
  };

  const closeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (currentFile?.id === id) {
      const remainingFiles = files.filter((f) => f.id !== id);
      setCurrentFile(remainingFiles.length > 0 ? remainingFiles[remainingFiles.length - 1] : null);
    }
  };

  const setActiveFile = (id: string) => {
    const file = files.find((f) => f.id === id);
    if (file) {
      setCurrentFile(file);
    }
  };

  const updateFileContent = (id: string, content: string) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, content, isDirty: true } : f)));
    if (currentFile?.id === id) {
      setCurrentFile((prev) => (prev ? { ...prev, content, isDirty: true } : null));
    }
  };

  return (
    <FileContext.Provider
      value={{
        files,
        currentFile,
        openFile,
        closeFile,
        setActiveFile,
        updateFileContent,
      }}
    >
      {children}
    </FileContext.Provider>
  );
}

export function useFile() {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error("useFile must be used within a FileProvider");
  }
  return context;
}
