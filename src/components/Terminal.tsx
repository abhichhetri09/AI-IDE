"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { SearchAddon } from "@xterm/addon-search";
import { WebglAddon } from "@xterm/addon-webgl";
import { SerializeAddon } from "@xterm/addon-serialize";

interface CommandResult {
  output: string;
  error?: string;
}

export default function Terminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const searchAddonRef = useRef<SearchAddon | null>(null);
  const webglAddonRef = useRef<WebglAddon | null>(null);
  const serializeAddonRef = useRef<SerializeAddon | null>(null);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentCommand, setCurrentCommand] = useState("");
  const [isTerminalReady, setIsTerminalReady] = useState(false);
  const [currentDirectory, setCurrentDirectory] = useState(process.cwd());

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current || xtermRef.current || typeof window === "undefined") return;

    const initializeTerminal = async () => {
      try {
        const term = new XTerm({
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 14,
          theme: {
            background: "var(--bg-darker)",
            foreground: "var(--text-primary)",
            cursor: "var(--text-primary)",
            selectionBackground: "var(--selection)",
            selectionForeground: "var(--text-primary)",
          },
          cursorBlink: true,
          cursorStyle: "bar",
          allowTransparency: true,
          scrollback: 10000,
          allowProposedApi: true,
        });

        xtermRef.current = term;

        // Initialize addons
        const fitAddon = new FitAddon();
        const searchAddon = new SearchAddon();
        const webLinksAddon = new WebLinksAddon();
        const serializeAddon = new SerializeAddon();

        term.loadAddon(fitAddon);
        term.loadAddon(searchAddon);
        term.loadAddon(webLinksAddon);
        term.loadAddon(serializeAddon);

        fitAddonRef.current = fitAddon;
        searchAddonRef.current = searchAddon;
        serializeAddonRef.current = serializeAddon;

        // Open terminal in container
        if (terminalRef.current) {
          term.open(terminalRef.current);
        }

        // Wait for next frame to ensure terminal is rendered
        requestAnimationFrame(() => {
          if (fitAddonRef.current) {
            try {
              fitAddonRef.current.fit();
              setIsTerminalReady(true);
            } catch (err) {
              console.warn("Failed to fit terminal:", err);
            }
          }

          // Try to load WebGL addon after terminal is ready
          try {
            const webglAddon = new WebglAddon();
            term.loadAddon(webglAddon);
            webglAddonRef.current = webglAddon;
          } catch (err) {
            console.warn("WebGL addon could not be loaded:", err);
          }
        });

        // Write initial prompt
        term.write(`${currentDirectory}> `);

        // Handle data input
        term.onData((data) => {
          if (data === "\r") {
            // Enter key pressed
            const command = currentCommand.trim();
            if (command) {
              // Add command to history
              setCommandHistory((prev) => [...prev, command]);
              setHistoryIndex(-1);
              setCurrentCommand("");

              // Execute command
              term.writeln("");
              executeCommand(command, term);
            } else {
              // Empty command, just show new prompt
              term.write("\r\n" + currentDirectory + "> ");
            }
          } else if (data === "\u007F") {
            // Backspace key pressed
            if (currentCommand.length > 0) {
              term.write("\b \b");
              setCurrentCommand((prev) => prev.slice(0, -1));
            }
          } else if (data === "\u001B[A") {
            // Up arrow key pressed
            if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
              const newIndex = historyIndex + 1;
              const command = commandHistory[commandHistory.length - 1 - newIndex];
              clearCurrentLine(term);
              term.write(command);
              setHistoryIndex(newIndex);
              setCurrentCommand(command);
            }
          } else if (data === "\u001B[B") {
            // Down arrow key pressed
            if (historyIndex > 0) {
              const newIndex = historyIndex - 1;
              const command = commandHistory[commandHistory.length - 1 - newIndex];
              clearCurrentLine(term);
              term.write(command);
              setHistoryIndex(newIndex);
              setCurrentCommand(command);
            } else if (historyIndex === 0) {
              clearCurrentLine(term);
              setHistoryIndex(-1);
              setCurrentCommand("");
            }
          } else if (data === "\u0003") {
            // Ctrl+C pressed
            term.writeln("^C");
            term.write(currentDirectory + "> ");
            setCurrentCommand("");
          } else if (data >= " " || data === "\t") {
            // Printable characters
            term.write(data);
            setCurrentCommand((prev) => prev + data);
          }
        });

        return () => {
          term.dispose();
        };
      } catch (error) {
        console.error("Failed to initialize terminal:", error);
      }
    };

    initializeTerminal();
  }, [commandHistory, currentCommand, historyIndex, currentDirectory]);

  // Handle window resize
  useEffect(() => {
    if (!isTerminalReady) return;

    const handleResize = () => {
      if (fitAddonRef.current) {
        try {
          fitAddonRef.current.fit();
        } catch (err) {
          console.warn("Failed to fit terminal:", err);
        }
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [isTerminalReady]);

  // Handle search
  useEffect(() => {
    if (isSearchVisible && searchAddonRef.current && searchTerm) {
      searchAddonRef.current.findNext(searchTerm);
    }
  }, [searchTerm, isSearchVisible]);

  const clearCurrentLine = (term: XTerm) => {
    term.write("\r" + currentDirectory + "> ");
    for (let i = 0; i < currentCommand.length; i++) {
      term.write(" ");
    }
    term.write("\r" + currentDirectory + "> ");
  };

  const executeCommand = async (command: string, term: XTerm) => {
    try {
      const response = await fetch("/api/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, cwd: currentDirectory }),
      });

      if (!response.ok) {
        throw new Error("Failed to execute command");
      }

      const result: CommandResult = await response.json();

      // Handle cd commands to update current directory
      if (command.trim().startsWith("cd ")) {
        const newPath = command.trim().slice(3);
        // Let the server handle the actual path resolution
        const cdResponse = await fetch("/api/terminal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command: "pwd", cwd: newPath }),
        });

        if (cdResponse.ok) {
          const { output } = await cdResponse.json();
          setCurrentDirectory(output.trim());
        }
      }

      // Write output
      if (result.output) {
        term.writeln(result.output);
      }

      // Write error if any
      if (result.error) {
        term.writeln("\x1b[31m" + result.error + "\x1b[0m");
      }

      // Write new prompt
      term.write(currentDirectory + "> ");
    } catch (err) {
      term.writeln(
        "\x1b[31mError: " + (err instanceof Error ? err.message : "Unknown error") + "\x1b[0m",
      );
      term.write(currentDirectory + "> ");
    }
  };

  const handleClear = () => {
    if (xtermRef.current) {
      xtermRef.current.clear();
      xtermRef.current.write(currentDirectory + "> ");
    }
  };

  const handleSave = () => {
    if (xtermRef.current && serializeAddonRef.current) {
      const content = serializeAddonRef.current.serialize();
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "terminal-output.txt";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="relative h-full w-full bg-[var(--bg-darker)]">
      <div className="flex items-center justify-between p-2 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="px-2 py-1 rounded text-sm bg-[var(--bg-lighter)] hover:bg-[var(--bg-lightest)]"
          >
            Clear
          </button>
          <button
            onClick={handleSave}
            className="px-2 py-1 rounded text-sm bg-[var(--bg-lighter)] hover:bg-[var(--bg-lightest)]"
          >
            Save Output
          </button>
          <button
            onClick={() => setIsSearchVisible(!isSearchVisible)}
            className="px-2 py-1 rounded text-sm bg-[var(--bg-lighter)] hover:bg-[var(--bg-lightest)]"
          >
            Search
          </button>
        </div>
        {isSearchVisible && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="px-2 py-1 rounded text-sm bg-[var(--bg-darker)] border border-[var(--border-color)]"
            />
            <button
              onClick={() => searchAddonRef.current?.findNext(searchTerm)}
              className="px-2 py-1 rounded text-sm bg-[var(--bg-lighter)] hover:bg-[var(--bg-lightest)]"
            >
              Next
            </button>
            <button
              onClick={() => searchAddonRef.current?.findPrevious(searchTerm)}
              className="px-2 py-1 rounded text-sm bg-[var(--bg-lighter)] hover:bg-[var(--bg-lightest)]"
            >
              Previous
            </button>
          </div>
        )}
      </div>
      <div ref={terminalRef} className="h-full w-full" />
    </div>
  );
}
