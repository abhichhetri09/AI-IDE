import React, { useState, useEffect, useCallback } from "react";
import Fuse from "fuse.js";
import { Search, File, ArrowRight } from "lucide-react";
import { useFile } from "@/contexts/FileContext";
import { motion, AnimatePresence } from "framer-motion";
import type { FuseResultMatch } from "fuse.js";

interface FileData {
  path: string;
  content?: string;
}

interface SearchResult {
  item: FileData;
  matches?: readonly FuseResultMatch[];
}

interface SearchPanelProps {
  workspaceId: string;
}

export default function SearchPanel({ workspaceId }: SearchPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { openFile, files } = useFile();
  const [fuse, setFuse] = useState<Fuse<FileData>>();

  useEffect(() => {
    // Initialize Fuse with the current files
    const fuseInstance = new Fuse<FileData>(
      files.map((f: { path: string }) => ({ path: f.path })),
      {
        keys: ["path"],
        threshold: 0.4,
        distance: 100,
        includeMatches: true,
      },
    );
    setFuse(fuseInstance);
  }, [files]);

  const handleSearch = useCallback(
    (value: string) => {
      setSearchTerm(value);
      if (!value.trim() || !fuse) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      const searchResults = fuse.search(value);
      setResults(searchResults as SearchResult[]);
      setIsLoading(false);
    },
    [fuse],
  );

  const handleResultClick = async (path: string) => {
    await openFile(path);
    setSearchTerm("");
    setResults([]);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-dark)] border-r border-[var(--border-color)]">
      <div className="p-4 border-b border-[var(--border-color)]">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search files... (Ctrl+P)"
            className="w-full pl-9 pr-4 py-2 bg-[var(--bg-darker)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] border border-[var(--border-color)] transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {isLoading ? (
            <div className="p-4 text-sm text-[var(--text-secondary)]">Searching...</div>
          ) : results.length > 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {results.map((result, index) => (
                <motion.div
                  key={result.item.path}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleResultClick(result.item.path)}
                  className="p-3 hover:bg-[var(--bg-lighter)] cursor-pointer flex items-center gap-2 group transition-colors"
                >
                  <File className="h-4 w-4 text-[var(--text-secondary)]" />
                  <span className="flex-1 text-sm truncate text-[var(--text-primary)]">
                    {result.item.path}
                  </span>
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]" />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            searchTerm && (
              <div className="p-4 text-sm text-[var(--text-secondary)]">No results found</div>
            )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
