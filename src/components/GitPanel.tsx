"use client";

import { useState, useEffect } from "react";

interface GitFile {
  path: string;
  status: string;
  staged: boolean;
}

interface GitStatus {
  files: {
    modified: string[];
    not_added: string[];
    staged: string[];
    deleted: string[];
  };
  current: string;
  error?: string;
}

interface GitResponse {
  error?: string;
  message?: string;
  status?: GitStatus;
}

interface GitPanelProps {
  workspaceId: string;
}

export default function GitPanel({ workspaceId }: GitPanelProps) {
  const [files, setFiles] = useState<GitFile[]>([]);
  const [branch, setBranch] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commitMessage, setCommitMessage] = useState("");

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/git");
      const data: GitResponse = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to get Git status");

      if (data.status) {
        const files: GitFile[] = [
          ...data.status.files.modified.map((path) => ({
            path,
            status: "Modified",
            staged: false,
          })),
          ...data.status.files.not_added.map((path) => ({
            path,
            status: "Untracked",
            staged: false,
          })),
          ...data.status.files.staged.map((path) => ({ path, status: "Staged", staged: true })),
          ...data.status.files.deleted.map((path) => ({ path, status: "Deleted", staged: false })),
        ];

        setFiles(files);
        setBranch(data.status.current || "");
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get Git status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const performGitAction = async (action: string, path: string) => {
    try {
      const response = await fetch("/api/git", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, path }),
      });

      const data: GitResponse = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to perform Git operation");

      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} file`);
    }
  };

  const stageFile = (path: string) => performGitAction("stage", path);
  const unstageFile = (path: string) => performGitAction("unstage", path);

  const commit = async () => {
    if (!commitMessage.trim()) return;

    try {
      const response = await fetch("/api/git", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "commit",
          message: commitMessage,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to commit changes");

      setCommitMessage("");
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to commit changes");
    }
  };

  const getFileIcon = (status: string) => {
    switch (status) {
      case "Modified":
        return "M";
      case "Untracked":
        return "U";
      case "Staged":
        return "S";
      case "Deleted":
        return "D";
      default:
        return "?";
    }
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
        <button
          onClick={fetchStatus}
          className="mt-4 px-3 py-1 text-sm bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-darker)]"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-[var(--text-primary)]">Current Branch:</span>
          <span className="text-sm text-[var(--text-secondary)]">{branch}</span>
        </div>
        <button
          onClick={fetchStatus}
          className="p-1 hover:bg-[var(--bg-lighter)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-2">
        {files.map((file) => (
          <div
            key={file.path}
            className="flex items-center justify-between p-2 hover:bg-[var(--bg-lighter)] rounded group"
          >
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-[var(--text-secondary)]">
                {getFileIcon(file.status)}
              </span>
              <span className="text-sm text-[var(--text-primary)] truncate">{file.path}</span>
            </div>
            <button
              onClick={() => (file.staged ? unstageFile(file.path) : stageFile(file.path))}
              className="opacity-0 group-hover:opacity-100 text-xs px-2 py-1 bg-[var(--bg-darker)] hover:bg-[var(--bg-lightest)] text-[var(--text-primary)] rounded transition-colors"
            >
              {file.staged ? "Unstage" : "Stage"}
            </button>
          </div>
        ))}
      </div>

      {/* Commit Section */}
      <div className="p-4 border-t border-[var(--border-color)]">
        <textarea
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="Commit message..."
          className="w-full px-3 py-2 text-sm bg-[var(--bg-dark)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] resize-none"
          rows={3}
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={commit}
            disabled={!commitMessage.trim()}
            className="px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Commit Changes
          </button>
        </div>
      </div>
    </div>
  );
}
