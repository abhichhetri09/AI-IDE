import { useState } from "react";
import { getWorkspaceHandle } from "@/lib/workspace";

interface UseFileReturn {
  openFile: (workspaceId: string, path: string) => Promise<string>;
  saveFile: (workspaceId: string, path: string, content: string) => Promise<void>;
  currentFile: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useFile(): UseFileReturn {
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openFile = async (workspaceId: string, path: string): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const dirHandle = await getWorkspaceHandle(workspaceId);
      if (!dirHandle) {
        throw new Error("Could not access workspace directory");
      }

      // Navigate to the file through the directory structure
      const parts = path.split("/");
      const fileName = parts.pop()!;
      let currentDir = dirHandle;

      for (const part of parts) {
        if (!part) continue;
        currentDir = await currentDir.getDirectoryHandle(part);
      }

      // Get the file handle and read its content
      const fileHandle = await currentDir.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      const content = await file.text();

      setCurrentFile(path);
      setIsLoading(false);
      return content;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to open file";
      setError(message);
      setIsLoading(false);
      throw error;
    }
  };

  const saveFile = async (workspaceId: string, path: string, content: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const dirHandle = await getWorkspaceHandle(workspaceId);
      if (!dirHandle) {
        throw new Error("Could not access workspace directory");
      }

      // Navigate to the file through the directory structure
      const parts = path.split("/");
      const fileName = parts.pop()!;
      let currentDir = dirHandle;

      for (const part of parts) {
        if (!part) continue;
        currentDir = await currentDir.getDirectoryHandle(part, { create: true });
      }

      // Get the file handle and write the content
      const fileHandle = await currentDir.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();

      setIsLoading(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save file";
      setError(message);
      setIsLoading(false);
      throw error;
    }
  };

  return {
    openFile,
    saveFile,
    currentFile,
    isLoading,
    error,
  };
}
