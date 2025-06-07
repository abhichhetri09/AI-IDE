import { useFile } from "@/contexts/FileContext";

export function useFileOperations() {
  const { files, currentFile, openFile: openFileFromContext, updateFileContent } = useFile();

  const createNewFile = () => {
    // This will be handled by the FileContext
    // Implementation will be added when needed
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

        const path = file.name;
        await openFileFromContext(path);
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

      // Create a new file with the same content but different path
      await openFileFromContext(newPath);
      if (currentFile) {
        updateFileContent(currentFile.id, currentFile.content);
      }

      // Save with new name
      const blob = new Blob([currentFile.content], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = newPath;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error saving file:", error);
    }
  };

  return {
    currentFile,
    files,
    createNewFile,
    openFile,
    saveFile,
    saveFileAs,
  };
}
