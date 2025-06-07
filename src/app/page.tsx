"use client";

import dynamic from "next/dynamic";
import Layout from "@/components/layout/Layout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useState } from "react";

// Dynamically import components that use browser APIs
const Editor = dynamic(() => import("@/components/editor/Editor"), {
  ssr: false,
  loading: () => <LoadingSpinner />,
});

const AIChatPanel = dynamic(() => import("@/components/AIChatPanel"), {
  ssr: false,
  loading: () => <LoadingSpinner />,
});

export default function Home() {
  const [chatWidth, setChatWidth] = useState(300);

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <Layout>
        <div className="h-full w-full flex">
          {/* Main content area */}
          <div className="flex-1 h-full">
            {/* Editor */}
            <ErrorBoundary>
              <div className="h-full w-full">
                <Editor />
              </div>
            </ErrorBoundary>
          </div>

          {/* AI Chat Panel (resizable) */}
          <div
            className="relative border-l border-[var(--border-color)] h-full"
            style={{ width: chatWidth }}
          >
            <div
              className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[var(--primary)]"
              onMouseDown={(e) => {
                const startX = e.clientX;
                const startWidth = chatWidth;

                const handleMouseMove = (e: MouseEvent) => {
                  const delta = startX - e.clientX;
                  setChatWidth(Math.max(200, Math.min(800, startWidth + delta)));
                };

                const handleMouseUp = () => {
                  document.removeEventListener("mousemove", handleMouseMove);
                  document.removeEventListener("mouseup", handleMouseUp);
                };

                document.addEventListener("mousemove", handleMouseMove);
                document.addEventListener("mouseup", handleMouseUp);
              }}
            />
            <ErrorBoundary>
              <AIChatPanel />
            </ErrorBoundary>
          </div>
        </div>
      </Layout>
    </main>
  );
}
