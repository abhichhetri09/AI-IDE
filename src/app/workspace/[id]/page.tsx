"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import WorkspaceLayout from "@/components/WorkspaceLayout";

interface Workspace {
  id: string;
  path: string;
  created: string;
  modified: string;
  name?: string;
}

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchWorkspace = async () => {
      try {
        if (params.id === "default") {
          if (isMounted) {
            setWorkspace({
              id: "default",
              path: "/",
              created: new Date().toISOString(),
              modified: new Date().toISOString(),
            });
            setIsLoading(false);
          }
          return;
        }

        console.log("Fetching workspace:", params.id);
        const response = await fetch(`/api/workspaces/${params.id}`);

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Workspace API error:", errorData);

          // If workspace not found or directory not found, clean up the workspace
          if (response.status === 404) {
            // Clean up workspace handles
            const handles = JSON.parse(localStorage.getItem("workspace_handles") || "{}");
            delete handles[params.id];
            localStorage.setItem("workspace_handles", JSON.stringify(handles));

            // Clean up memory handles
            if (window._workspace_handles) {
              delete window._workspace_handles[params.id];
            }
          }

          throw new Error(errorData.error || "Failed to fetch workspace");
        }

        const data = await response.json();
        console.log("Workspace data:", data);
        if (isMounted) {
          setWorkspace(data);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error loading workspace:", error);
        if (isMounted) {
          toast.error(error instanceof Error ? error.message : "Failed to load workspace");
          router.push("/");
        }
      }
    };

    fetchWorkspace();

    return () => {
      isMounted = false;
    };
  }, [params.id, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (!workspace) {
    return null;
  }

  return <WorkspaceLayout workspace={workspace} />;
}
