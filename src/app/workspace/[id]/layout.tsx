import { ReactNode } from "react";
import { Metadata } from "next";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "AI IDE - Workspace",
  description: "A modern IDE with built-in AI capabilities",
};

interface WorkspaceLayoutProps {
  children: ReactNode;
  params: {
    id: string;
  };
}

export default function WorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  return (
    <div className="h-screen flex flex-col">
      <Toaster position="top-right" />
      {children}
    </div>
  );
}
