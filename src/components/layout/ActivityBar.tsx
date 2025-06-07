"use client";

interface ActivityBarProps {
  activePanel: string;
  onPanelChange: (panel: string) => void;
}

export default function ActivityBar({ activePanel, onPanelChange }: ActivityBarProps) {
  const activityItems = [
    {
      id: "explorer",
      label: "Explorer",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
      ),
    },
    {
      id: "search",
      label: "Search",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      ),
    },
    {
      id: "git",
      label: "Source Control",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3v2h2V3H3zm0 8h2V9H3v2zm0 8h2v-2H3v2zm4-4h14v-2H7v2zm0-8h14V5H7v2zm0 4h14V9H7v2z"
          />
        </svg>
      ),
    },
    {
      id: "debug",
      label: "Run and Debug",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: "extensions",
      label: "Extensions",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-12 bg-[var(--bg-darker)] border-r border-[var(--border-color)] flex flex-col items-center py-2">
      {activityItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onPanelChange(item.id)}
          className={`
            p-2 mb-2 rounded transition-colors relative group
            text-[var(--text-secondary)] hover:text-[var(--text-primary)]
            hover:bg-[var(--bg-lighter)]
            ${activePanel === item.id ? "text-[var(--text-primary)] bg-[var(--bg-lighter)]" : ""}
          `}
          title={item.label}
        >
          {item.icon}
          {/* Indicator bar */}
          {activePanel === item.id && (
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--primary)]" />
          )}
          {/* Tooltip */}
          <div className="absolute left-14 top-1/2 -translate-y-1/2 px-2 py-1 bg-[var(--bg-darker)] rounded text-xs whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            {item.label}
          </div>
        </button>
      ))}

      <div className="flex-1" />

      {/* Bottom items */}
      <button
        className="p-2 mb-2 rounded transition-colors relative group text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-lighter)]"
        title="Account"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        {/* Tooltip */}
        <div className="absolute left-14 top-1/2 -translate-y-1/2 px-2 py-1 bg-[var(--bg-darker)] rounded text-xs whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
          Account Settings
        </div>
      </button>
    </div>
  );
}
