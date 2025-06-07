"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import WorkspaceLayout from "@/components/WorkspaceLayout";

interface Workspace {
  id: string;
  path: string;
  created: string;
  modified: string;
}

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        if (params.id === "default") {
          setWorkspace({
            id: "default",
            path: "/",
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
          });
          setIsLoading(false);
          return;
        }

        const response = await fetch(`/api/workspaces/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch workspace");
        }

        const data = await response.json();
        setWorkspace(data);
        setIsLoading(false);
      } catch (error) {
        toast.error("Failed to load workspace");
        router.push("/");
      }
    };

    fetchWorkspace();
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
