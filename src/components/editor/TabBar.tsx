import { useFile } from "@/contexts/FileContext";
import { X } from "lucide-react";
import path from "path";

export default function TabBar() {
  const { files, currentFile, closeFile, setActiveFile } = useFile();

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="flex h-9 bg-[var(--bg-darker)] border-b border-[var(--border-color)]">
      <div className="flex-1 flex overflow-x-auto">
        {files.map((file) => {
          const isActive = currentFile?.id === file.id;
          const fileName = path.basename(file.path);

          return (
            <div
              key={file.id}
              className={`
                group flex items-center min-w-[120px] max-w-[200px] px-3 
                border-r border-[var(--border-color)] cursor-pointer transition-all
                ${
                  isActive
                    ? "bg-[var(--bg-lighter)] border-b-2 border-b-[var(--primary)]"
                    : "hover:bg-[var(--bg-lighter)] hover:border-b-2 hover:border-b-[var(--border-color)]"
                }
              `}
              onClick={() => setActiveFile(file.id)}
            >
              <span
                className={`
                  flex-1 truncate text-sm font-medium py-1.5
                  ${
                    isActive
                      ? "text-[var(--text-primary)] opacity-100"
                      : "text-[var(--text-secondary)] opacity-75 group-hover:opacity-90 group-hover:text-[var(--text-primary)]"
                  }
                `}
              >
                {fileName}
                {file.isDirty && <span className="ml-1 text-[var(--primary)]">●</span>}
              </span>
              <button
                className="opacity-0 group-hover:opacity-100 ml-2 p-1 hover:bg-[var(--bg-lightest)] rounded transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  closeFile(file.id);
                }}
              >
                <X
                  size={14}
                  className="text-[var(--text-secondary)] hover:text-[var(--error)] transition-colors"
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
