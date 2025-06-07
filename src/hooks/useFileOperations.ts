import { useState } from "react";

interface FileState {
  path: string;
  content: string;
}

export function useFileOperations() {
  const [currentFile, setCurrentFile] = useState<FileState | null>(null);
  const [files, setFiles] = useState<FileState[]>([]);

  const createNewFile = () => {
    const newFile: FileState = {
      path: "untitled",
      content: "",
    };
    setFiles([...files, newFile]);
    setCurrentFile(newFile);
  };

  const openFile = async () => {
    try {
      // Create a file input element
      const input = document.createElement("input");
      input.type = "file";

      // Handle file selection
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const content = await file.text();
        const newFile: FileState = {
          path: file.name,
          content,
        };

        setFiles([...files, newFile]);
        setCurrentFile(newFile);
      };

      // Trigger file picker
      input.click();
    } catch (error) {
      console.error("Error opening file:", error);
    }
  };

  const saveFile = async () => {
    if (!currentFile) return;

    try {
      // Create blob and download link
      const blob = new Blob([currentFile.content], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = currentFile.path;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error saving file:", error);
    }
  };

  const saveFileAs = async () => {
    if (!currentFile) return;

    try {
      // For now, we'll just prompt for a new filename
      const newPath = window.prompt("Enter file name:", currentFile.path);
      if (!newPath) return;

      const newFile: FileState = {
        ...currentFile,
        path: newPath,
      };

      setCurrentFile(newFile);
      setFiles(files.map((f) => (f.path === currentFile.path ? newFile : f)));

      // Save with new name
      const blob = new Blob([newFile.content], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = newFile.path;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error saving file:", error);
    }
  };

  const updateCurrentFile = (content: string) => {
    if (!currentFile) return;
    const updatedFile = { ...currentFile, content };
    setCurrentFile(updatedFile);
    setFiles(files.map((f) => (f.path === currentFile.path ? updatedFile : f)));
  };

  return {
    currentFile,
    files,
    createNewFile,
    openFile,
    saveFile,
    saveFileAs,
    updateCurrentFile,
  };
}
