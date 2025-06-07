"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { initializeWorkspace, getWorkspaceConfig, getWorkspaceHandle } from "@/lib/workspace";

interface WorkspaceHandle {
  name: string;
  kind: string;
  timestamp: number;
}

interface Workspace {
  id: string;
  path: string;
  name?: string;
  description?: string;
  created: string;
  modified: string;
  lastAccessed?: string;
  type?: string;
  projectFiles?: string[];
  git?: {
    enabled: boolean;
    branch?: string;
    remote?: string;
  };
  settings?: {
    formatOnSave: boolean;
    indentSize: number;
    theme: string;
    language: string;
    excludePatterns?: string[];
  };
}

export default function WorkspaceManager() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<{
    status: "idle" | "importing" | "configuring";
    progress: number;
  }>({ status: "idle", progress: 0 });
  const [loadingAttempts, setLoadingAttempts] = useState<Set<string>>(new Set());
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState<boolean>(false);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      if (isLoadingWorkspace) return;
      setIsLoadingWorkspace(true);
      try {
        const response = await fetch("/api/workspaces");
        if (!response.ok) {
          throw new Error("Failed to fetch workspaces");
        }
        const data = await response.json();

        // Clean up invalid workspace handles
        const storedHandles: Record<string, WorkspaceHandle> = JSON.parse(
          localStorage.getItem("workspace_handles") || "{}",
        );
        const validHandles: Record<string, WorkspaceHandle> = {};

        // Initialize memory handles if not exists
        window._workspace_handles = window._workspace_handles || {};

        // Fetch additional workspace info and validate handles
        const workspacesWithConfig = await Promise.all(
          data.map(async (workspace: Workspace) => {
            try {
              // Check if we have a valid handle in memory
              let dirHandle = window._workspace_handles[workspace.id];

              // If no handle in memory, try to get a new one
              if (!dirHandle && storedHandles[workspace.id] && !loadingAttempts.has(workspace.id)) {
                try {
                  // Verify the workspace still exists on the server
                  const wsResponse = await fetch(`/api/workspaces/${workspace.id}`);
                  if (!wsResponse.ok) {
                    // If workspace doesn't exist, skip it
                    console.warn(`Workspace ${workspace.id} no longer exists on server`);
                    return null;
                  }

                  // Show directory picker with the stored name as guidance
                  toast.info(
                    `Please select the "${storedHandles[workspace.id].name}" folder again to restore access`,
                    { duration: 10000 }, // Show for 10 seconds
                  );
                  dirHandle = await window.showDirectoryPicker();

                  // Verify it's the correct directory
                  if (dirHandle.name !== storedHandles[workspace.id].name) {
                    toast.error("Selected directory does not match the workspace");
                    return null;
                  }

                  // Store the new handle
                  window._workspace_handles[workspace.id] = dirHandle;

                  // Update loading attempts outside of the effect
                  setLoadingAttempts((prev) => {
                    const newAttempts = new Set(prev);
                    newAttempts.add(workspace.id);
                    return newAttempts;
                  });
                } catch (error) {
                  if ((error as Error).name !== "AbortError") {
                    console.warn(`Failed to restore handle for workspace ${workspace.id}:`, error);

                    // If we failed to get a new handle, clean up this workspace
                    delete storedHandles[workspace.id];
                    delete window._workspace_handles[workspace.id];
                    localStorage.setItem("workspace_handles", JSON.stringify(storedHandles));
                  }
                  return null;
                }
              }

              if (dirHandle) {
                try {
                  // Verify we can still access the directory
                  const permission = await dirHandle.requestPermission({ mode: "readwrite" });
                  if (permission !== "granted") {
                    throw new Error("Permission denied");
                  }

                  const config = await getWorkspaceConfig(dirHandle);
                  if (config) {
                    // Store only necessary handle info
                    validHandles[workspace.id] = {
                      name: dirHandle.name,
                      kind: dirHandle.kind,
                      timestamp: Date.now(),
                    };

                    return {
                      ...workspace,
                      name: config.name || workspace.name,
                      description: config.description || workspace.description,
                      settings: config.settings,
                    };
                  }
                } catch (error) {
                  console.warn(
                    `Workspace ${workspace.id} directory is no longer accessible:`,
                    error,
                  );
                  delete window._workspace_handles[workspace.id];
                  return null;
                }
              } else if (!loadingAttempts.has(workspace.id)) {
                console.warn(`No handle found for workspace ${workspace.id}`);
              }
              return null;
            } catch (error) {
              console.warn("Failed to fetch workspace config:", error);
              return null;
            }
          }),
        );

        // Update localStorage with only valid handles
        localStorage.setItem("workspace_handles", JSON.stringify(validHandles));

        // Filter out null entries (invalid workspaces)
        const validWorkspaces = workspacesWithConfig.filter((w): w is Workspace => w !== null);

        // If no valid workspaces found, show a message
        if (validWorkspaces.length === 0 && data.length > 0) {
          toast.info("No valid workspaces found. Please import your projects again.", {
            duration: 5000,
          });

          // Clear localStorage and memory handles
          localStorage.removeItem("workspace_handles");
          window._workspace_handles = {};

          // Clear loading attempts after a short delay to prevent immediate re-trigger
          setTimeout(() => {
            setLoadingAttempts(new Set());
          }, 100);
        }

        setWorkspaces(validWorkspaces);
        setIsLoading(false);
      } catch (err) {
        setError("Failed to load workspaces");
        setIsLoading(false);
        toast.error("Failed to load workspaces. Please try refreshing the page.");
      } finally {
        setIsLoadingWorkspace(false);
      }
    };

    fetchWorkspaces();
  }, []); // Keep empty dependency array

  const createWorkspace = async () => {
    if (!workspaceName.trim()) return;

    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workspaceName.trim(),
          description: workspaceDescription.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create workspace");
      }

      const workspace = await response.json();
      setWorkspaces((prev) => [workspace, ...prev]);
      setIsOpen(false);
      setWorkspaceName("");
      setWorkspaceDescription("");

      router.push(`/workspace/${workspace.id}`);
      toast.success("Workspace created successfully!");
    } catch (error) {
      toast.error("Failed to create workspace");
      console.error("Error creating workspace:", error);
    }
  };

  const handleWorkspaceSelect = async (id: string) => {
    try {
      if (id === "default") {
        router.push(`/workspace/${id}`);
        return;
      }

      // Get the workspace from state
      const workspace = workspaces.find((w) => w.id === id);
      if (!workspace) {
        throw new Error("Workspace not found");
      }

      // Try to get directory handle
      const dirHandle = await getWorkspaceHandle(id);
      if (!dirHandle) {
        toast.error("Could not access workspace directory. Please select it again.");
        return;
      }

      router.push(`/workspace/${id}`);
    } catch (error) {
      toast.error("Failed to open workspace");
      console.error("Error opening workspace:", error);
    }
  };

  const handleOpenFolder = async () => {
    try {
      setImportProgress({ status: "importing", progress: 0 });

      // Use the File System Access API to select a directory
      const dirHandle = await window.showDirectoryPicker();

      setImportProgress({ status: "importing", progress: 30 });

      try {
        // Request permission to read the directory
        const permission = await dirHandle.requestPermission({ mode: "readwrite" });
        if (permission !== "granted") {
          throw new Error("Permission to read directory was denied");
        }

        setImportProgress({ status: "importing", progress: 50 });

        // Validate and register the workspace
        const response = await fetch("/api/workspaces/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: dirHandle.name,
            workspacePath: dirHandle.name,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to validate workspace");
        }

        const workspace = await response.json();
        setImportProgress({ status: "configuring", progress: 70 });

        // Initialize workspace with configuration
        await initializeWorkspace(
          dirHandle,
          workspace.name,
          workspace.type,
          workspace.projectFiles,
          workspace.git?.enabled
            ? {
                branch: workspace.git.branch,
                remote: workspace.git.remote,
              }
            : undefined,
        );

        // Store handle info
        const handles = JSON.parse(localStorage.getItem("workspace_handles") || "{}");
        handles[workspace.id] = {
          name: dirHandle.name,
          kind: dirHandle.kind,
          timestamp: Date.now(),
        };
        localStorage.setItem("workspace_handles", JSON.stringify(handles));

        // Store the actual handle in memory
        window._workspace_handles = window._workspace_handles || {};
        window._workspace_handles[workspace.id] = dirHandle;

        setImportProgress({ status: "configuring", progress: 100 });

        // Add the new workspace to state
        setWorkspaces((prev) => {
          // Remove any existing workspace with the same path
          const filtered = prev.filter((w) => w.path !== workspace.path);
          return [workspace, ...filtered];
        });

        router.push(`/workspace/${workspace.id}`);

        // Show appropriate success message based on project type
        if (workspace.type !== "unknown") {
          toast.success(
            `Detected ${workspace.type} project${workspace.git?.enabled ? " with Git" : ""}`,
          );
        } else {
          toast.success("Project opened successfully!");
        }
      } catch (error) {
        setImportProgress({ status: "idle", progress: 0 });
        toast.error(error instanceof Error ? error.message : "Failed to open folder");
        console.error("Error opening folder:", error);
      }
    } catch (error) {
      setImportProgress({ status: "idle", progress: 0 });
      if ((error as Error).name !== "AbortError") {
        toast.error("Failed to open folder dialog");
        console.error("Error opening folder dialog:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-[var(--error)] text-center">
          <svg
            className="w-12 h-12 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-lg font-medium mb-2">{error}</p>
        </div>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] text-[var(--text-primary)]">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Workspaces</h1>
            <p className="text-[var(--text-secondary)]">Manage your development projects</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleOpenFolder}
              variant="outline"
              className="text-[var(--text-primary)]"
              disabled={importProgress.status !== "idle"}
            >
              {importProgress.status === "idle" ? (
                <>
                  <svg
                    className="w-4 h-4 mr-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                  Import Project
                </>
              ) : (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-[var(--primary)] border-t-transparent mr-2" />
                  {importProgress.status === "importing" ? "Importing..." : "Configuring..."}
                </>
              )}
            </Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button variant="default" className="text-white">
                  <svg
                    className="w-4 h-4 mr-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  New Workspace
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-[var(--text-primary)]">
                    Create New Workspace
                  </DialogTitle>
                  <DialogDescription className="text-[var(--text-secondary)]">
                    Create a new workspace to start your project.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-[var(--text-primary)]">
                      Workspace Name
                    </Label>
                    <Input
                      id="name"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      placeholder="my-project"
                      className="bg-[var(--bg-dark)] text-[var(--text-primary)] border-[var(--border-color)]"
                      autoFocus
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description" className="text-[var(--text-primary)]">
                      Description (optional)
                    </Label>
                    <Textarea
                      id="description"
                      value={workspaceDescription}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setWorkspaceDescription(e.target.value)
                      }
                      placeholder="A brief description of your project"
                      className="bg-[var(--bg-dark)] text-[var(--text-primary)] border-[var(--border-color)]"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    className="text-[var(--text-primary)]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createWorkspace}
                    disabled={!workspaceName.trim()}
                    variant="default"
                    className="text-white"
                  >
                    Create
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Default Workspace Card */}
          <div
            className="p-6 rounded-lg border border-[var(--border-color)] bg-[var(--bg-darker)] hover:border-[var(--primary)] transition-colors cursor-pointer"
            onClick={() => handleWorkspaceSelect("default")}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-[var(--primary)]"
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
                <h3 className="text-lg font-medium">Default Workspace</h3>
              </div>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              Start with the default workspace configuration
            </p>
          </div>

          {/* Existing Workspaces */}
          {workspaces
            .filter((workspace) => workspace.id !== "default")
            .map((workspace) => (
              <div
                key={workspace.id}
                className="p-6 rounded-lg border border-[var(--border-color)] bg-[var(--bg-darker)] hover:border-[var(--primary)] transition-colors cursor-pointer"
                onClick={() => handleWorkspaceSelect(workspace.id)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-6 h-6 text-[var(--primary)]"
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
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium">{workspace.name || workspace.id}</h3>
                        {workspace.type && (
                          <span className="px-2 py-1 text-xs rounded-full bg-[var(--bg-darker)] border border-[var(--border-color)]">
                            {workspace.type}
                          </span>
                        )}
                        {workspace.git?.enabled && (
                          <span className="text-xs text-[var(--text-secondary)]">
                            {workspace.git.branch}{" "}
                            {workspace.git.remote && `(${workspace.git.remote})`}
                          </span>
                        )}
                      </div>
                      {workspace.description && (
                        <p className="text-sm text-[var(--text-secondary)]">
                          {workspace.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-[var(--text-secondary)]">
                  <p>
                    Last accessed:{" "}
                    {new Date(workspace.lastAccessed || workspace.modified).toLocaleDateString()}
                  </p>
                  {workspace.settings && (
                    <p className="mt-1">
                      Language: {workspace.settings.language} • Theme: {workspace.settings.theme}
                    </p>
                  )}
                  {workspace.projectFiles && workspace.projectFiles.length > 0 && (
                    <p className="mt-1">
                      Project files: {workspace.projectFiles.slice(0, 3).join(", ")}
                      {workspace.projectFiles.length > 3 && " ..."}
                    </p>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
