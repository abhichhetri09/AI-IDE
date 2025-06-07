import { useFile } from "@/contexts/FileContext";
import { X } from "lucide-react";
import path from "path";

export default function TabBar() {
  const { files, currentFile, closeFile, setActiveFile } = useFile();

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="flex h-9 bg-[#1e1e1e] border-b border-[#333]">
      <div className="flex-1 flex overflow-x-auto">
        {files.map((file) => {
          const isActive = currentFile?.id === file.id;
          const fileName = path.basename(file.path);

          return (
            <div
              key={file.id}
              className={`
                group flex items-center min-w-[120px] max-w-[200px] px-3 py-1 
                border-r border-[#333] cursor-pointer
                ${isActive ? "bg-[#2d2d2d]" : "hover:bg-[#2d2d2d]"}
              `}
              onClick={() => setActiveFile(file.id)}
            >
              <span className="flex-1 truncate text-sm text-gray-300">
                {fileName}
                {file.isDirty && "*"}
              </span>
              <button
                className="opacity-0 group-hover:opacity-100 ml-2 p-1 hover:bg-[#3d3d3d] rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  closeFile(file.id);
                }}
              >
                <X size={14} className="text-gray-400" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
