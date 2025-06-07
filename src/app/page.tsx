"use client";

import Layout from "@/components/layout/Layout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import WorkspaceManager from "@/components/WorkspaceManager";

export default function Home() {
  return (
    <Layout>
      <div className="h-full w-full flex items-center justify-center">
        <ErrorBoundary>
          <WorkspaceManager />
        </ErrorBoundary>
      </div>
    </Layout>
  );
}
