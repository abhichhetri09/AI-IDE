import { toast } from "sonner";

/**
 * Gets the directory handle for a workspace
 */
export async function getWorkspaceHandle(
  workspaceId: string,
): Promise<FileSystemDirectoryHandle | null> {
  try {
    // Check if workspace exists on server first
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}`);
      if (!response.ok) {
        await cleanupWorkspace(workspaceId);
        return null;
      }
    } catch (error) {
      console.error("Error checking workspace existence:", error);
      return null;
    }

    // Check in-memory cache first
    if (window._workspace_handles?.[workspaceId]) {
      // Verify we still have access
      try {
        const handle = window._workspace_handles[workspaceId];
        const permission = await handle.requestPermission({ mode: "readwrite" });
        if (permission === "granted") {
          return handle;
        }
      } catch (error) {
        console.warn("Lost access to workspace directory, requesting new permission");
        delete window._workspace_handles[workspaceId];
      }
    }

    // Check localStorage for the path
    const handles = JSON.parse(localStorage.getItem("workspace_handles") || "{}");
    const savedHandle = handles[workspaceId];

    if (!savedHandle) {
      console.warn("No saved handle found for workspace:", workspaceId);
      await cleanupWorkspace(workspaceId);
      return null;
    }

    try {
      // Show directory picker with guidance
      const message = `Please select the "${savedHandle.name}" folder to restore access`;
      toast.info(message, { duration: 10000 });

      // Request new directory handle
      const dirHandle = await window.showDirectoryPicker();

      // Verify it's the correct directory by name
      if (dirHandle.name !== savedHandle.name) {
        toast.error("Selected directory does not match the workspace");
        await cleanupWorkspace(workspaceId);
        return null;
      }

      // Request permission
      const permission = await dirHandle.requestPermission({ mode: "readwrite" });
      if (permission !== "granted") {
        toast.error("Permission denied for workspace directory");
        await cleanupWorkspace(workspaceId);
        return null;
      }

      // Update caches
      window._workspace_handles = window._workspace_handles || {};
      window._workspace_handles[workspaceId] = dirHandle;

      // Update localStorage with new timestamp
      handles[workspaceId] = {
        name: dirHandle.name,
        kind: dirHandle.kind,
        timestamp: Date.now(),
      };
      localStorage.setItem("workspace_handles", JSON.stringify(handles));

      return dirHandle;
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Error getting workspace handle:", error);
        await cleanupWorkspace(workspaceId);
      }
      return null;
    }
  } catch (error) {
    console.error("Error in getWorkspaceHandle:", error);
    return null;
  }
}

/**
 * Lists all files in a workspace directory
 */
export async function listWorkspaceFiles(
  dirHandle: FileSystemDirectoryHandle,
  path = "",
): Promise<any[]> {
  const entries = [];

  try {
    for await (const entry of dirHandle.values()) {
      const entryPath = path ? `${path}/${entry.name}` : entry.name;

      if (entry.kind === "file") {
        entries.push({
          name: entry.name,
          path: entryPath,
          type: "file",
        });
      } else if (entry.kind === "directory") {
        const subEntries = await listWorkspaceFiles(entry, entryPath);
        entries.push({
          name: entry.name,
          path: entryPath,
          type: "directory",
          children: subEntries,
        });
      }
    }
  } catch (error) {
    console.error("Error listing workspace files:", error);
  }

  return entries;
}

/**
 * Creates a new file in the workspace
 */
export async function createWorkspaceFile(
  dirHandle: FileSystemDirectoryHandle,
  path: string,
  content = "",
): Promise<void> {
  try {
    const parts = path.split("/");
    const fileName = parts.pop()!;
    let currentDir = dirHandle;

    // Create parent directories if they don't exist
    for (const part of parts) {
      if (!part) continue;
      currentDir = await currentDir.getDirectoryHandle(part, { create: true });
    }

    // Create the file
    const fileHandle = await currentDir.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  } catch (error) {
    console.error("Error creating workspace file:", error);
    throw error;
  }
}

/**
 * Creates a new directory in the workspace
 */
export async function createWorkspaceDirectory(
  dirHandle: FileSystemDirectoryHandle,
  path: string,
): Promise<void> {
  try {
    const parts = path.split("/");
    let currentDir = dirHandle;

    for (const part of parts) {
      if (!part) continue;
      currentDir = await currentDir.getDirectoryHandle(part, { create: true });
    }
  } catch (error) {
    console.error("Error creating workspace directory:", error);
    throw error;
  }
}

/**
 * Deletes a file or directory in the workspace
 */
export async function deleteWorkspaceEntry(
  dirHandle: FileSystemDirectoryHandle,
  path: string,
): Promise<void> {
  try {
    const parts = path.split("/");
    const entryName = parts.pop()!;
    let currentDir = dirHandle;

    // Navigate to parent directory
    for (const part of parts) {
      if (!part) continue;
      currentDir = await currentDir.getDirectoryHandle(part);
    }

    // Delete the entry
    await currentDir.removeEntry(entryName, { recursive: true });
  } catch (error) {
    console.error("Error deleting workspace entry:", error);
    throw error;
  }
}

export interface WorkspaceConfig {
  name: string;
  description?: string;
  created: string;
  modified: string;
  lastAccessed: string;
  type: string;
  projectFiles: string[];
  git?: {
    enabled: boolean;
    branch?: string;
    remote?: string;
  };
  settings: {
    formatOnSave: boolean;
    indentSize: number;
    theme: string;
    language: string;
    excludePatterns: string[];
  };
  recentFiles: string[];
}

/**
 * Initializes a new workspace with default configuration
 */
export async function initializeWorkspace(
  dirHandle: FileSystemDirectoryHandle,
  name: string,
  type: string = "unknown",
  projectFiles: string[] = [],
  gitInfo?: { branch?: string; remote?: string },
): Promise<void> {
  try {
    // Create the .ai-ide config directory
    const configDir = await dirHandle.getDirectoryHandle(".ai-ide", { create: true });

    // Create default config
    const config: WorkspaceConfig = {
      name,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      type,
      projectFiles,
      git: gitInfo
        ? {
            enabled: true,
            ...gitInfo,
          }
        : undefined,
      settings: {
        formatOnSave: true,
        indentSize: type === "python" ? 4 : 2,
        theme: "dark",
        language: type === "unknown" ? "plaintext" : type,
        excludePatterns: [
          "**/node_modules/**",
          "**/dist/**",
          "**/build/**",
          "**/.git/**",
          "**/target/**",
          "**/__pycache__/**",
          "**/.pytest_cache/**",
          "**/vendor/**",
          "**/.idea/**",
          "**/.vscode/**",
        ],
      },
      recentFiles: [],
    };

    // Save config
    const configFile = await configDir.getFileHandle("workspace.json", { create: true });
    const writable = await configFile.createWritable();
    await writable.write(JSON.stringify(config, null, 2));
    await writable.close();

    // Create additional workspace structure based on project type
    if (type === "unknown") {
      // Create basic structure for new projects
      await createBasicStructure(dirHandle);
    }
  } catch (error) {
    console.error("Error initializing workspace:", error);
    throw error;
  }
}

async function createBasicStructure(dirHandle: FileSystemDirectoryHandle) {
  try {
    // Create basic directories
    await dirHandle.getDirectoryHandle("src", { create: true });
    await dirHandle.getDirectoryHandle("docs", { create: true });

    // Create README if it doesn't exist
    try {
      await dirHandle.getFileHandle("README.md");
    } catch {
      const readmeFile = await dirHandle.getFileHandle("README.md", { create: true });
      const writable = await readmeFile.createWritable();
      await writable.write("# Project Name\n\nAdd your project description here.\n");
      await writable.close();
    }

    // Create .gitignore if it doesn't exist
    try {
      await dirHandle.getFileHandle(".gitignore");
    } catch {
      const gitignoreFile = await dirHandle.getFileHandle(".gitignore", { create: true });
      const writable = await gitignoreFile.createWritable();
      await writable.write(
        "# Dependencies\nnode_modules/\n\n# Build\ndist/\nbuild/\n\n# Environment\n.env\n.env.local\n\n# IDE\n.vscode/\n.idea/\n",
      );
      await writable.close();
    }
  } catch (error) {
    console.warn("Error creating basic structure:", error);
  }
}

/**
 * Gets workspace configuration
 */
export async function getWorkspaceConfig(
  dirHandle: FileSystemDirectoryHandle,
): Promise<WorkspaceConfig | null> {
  try {
    // Get the .ai-ide config directory
    const configDir = await dirHandle.getDirectoryHandle(".ai-ide");

    // Read config file
    const configFile = await configDir.getFileHandle("workspace.json");
    const file = await configFile.getFile();
    const content = await file.text();

    return JSON.parse(content);
  } catch (error) {
    console.warn("Failed to read workspace config:", error);
    return null;
  }
}

/**
 * Cleans up an invalid workspace
 */
export async function cleanupWorkspace(workspaceId: string): Promise<void> {
  try {
    // Clean up handles in localStorage
    const handles = JSON.parse(localStorage.getItem("workspace_handles") || "{}");
    delete handles[workspaceId];
    localStorage.setItem("workspace_handles", JSON.stringify(handles));

    // Clean up memory handles
    if (window._workspace_handles) {
      delete window._workspace_handles[workspaceId];
    }

    // Try to remove the workspace file from the server
    try {
      await fetch(`/api/workspaces/${workspaceId}`, { method: "DELETE" });
    } catch (error) {
      console.warn("Failed to delete workspace file from server:", error);
    }
  } catch (error) {
    console.error("Error cleaning up workspace:", error);
  }
}
