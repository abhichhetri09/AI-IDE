"use client";

import { useState } from "react";

interface Tab {
  id: string;
  title: string;
  path: string;
  isDirty?: boolean;
  language?: string;
}

export default function TabBar() {
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: "1",
      title: "index.tsx",
      path: "/src/app/page.tsx",
      language: "typescript",
    },
    {
      id: "2",
      title: "styles.css",
      path: "/src/app/globals.css",
      language: "css",
      isDirty: true,
    },
  ]);
  const [activeTab, setActiveTab] = useState<string>(tabs[0].id);

  const handleCloseTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTabs(tabs.filter((tab) => tab.id !== tabId));
    if (activeTab === tabId) {
      setActiveTab(tabs[0].id);
    }
  };

  const getLanguageIcon = (language?: string) => {
    switch (language) {
      case "typescript":
        return (
          <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3,3h18v18H3V3z M13.666,12.451h-2.118V19H9.841v-6.549H7.767V11h5.899V12.451z M13.998,18.626v-1.751c0,0,1.05,0.8,2.305,0.8c1.256,0,1.592-0.55,1.592-0.975c0-1.425-4.147-1.399-4.147-4.462c0-1.925,1.4-2.75,3.225-2.75c1.825,0,2.775,0.65,2.775,0.65v1.725c0,0-1-0.625-2.25-0.625s-1.7,0.475-1.7,0.975c0,1.374,4.147,1.25,4.147,4.359C19.945,18.025,18.52,19,16.57,19C14.623,19,13.998,18.626,13.998,18.626z" />
          </svg>
        );
      case "css":
        return (
          <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4.192 3.143h15.615l-1.42 16.034-6.404 1.812-6.369-1.813L4.192 3.143zM16.9 6.424l-9.8-.002.158 1.949 7.529.002-.189 2.02H9.66l.179 1.913h4.597l-.272 2.62-2.164.598-2.197-.603-.141-1.569h-1.94l.216 2.867L12 17.484l3.995-1.137.905-9.923z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        );
    }
  };

  return (
    <div className="h-9 bg-[var(--bg-darker)] border-b border-[var(--border-color)] flex items-center">
      <div className="flex-1 flex items-center overflow-x-auto px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center h-8 px-3 border-t-2 
              ${
                activeTab === tab.id
                  ? "border-[var(--primary)] bg-[var(--bg-lighter)]"
                  : "border-transparent hover:border-[var(--border-color)]"
              }
              ${tab.isDirty ? "font-semibold" : ""}
            `}
          >
            <span className="mr-2">{getLanguageIcon(tab.language)}</span>
            <span className="truncate max-w-xs">{tab.title}</span>
            {tab.isDirty && <span className="ml-2 text-[var(--primary)]">●</span>}
            <button
              onClick={(e) => handleCloseTab(tab.id, e)}
              className="ml-2 p-0.5 hover:bg-[var(--bg-darker)] rounded opacity-60 hover:opacity-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </button>
        ))}
      </div>
    </div>
  );
}
