"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import LoadingSpinner from "./LoadingSpinner";

// We'll load xterm and its addons dynamically in useEffect
let XTerminal: any;
let FitAddon: any;
let WebLinksAddon: any;
let WebglAddon: any;
let SearchAddon: any;

declare global {
  interface Window {
    electronAPI?: {
      createTerminal: () => Promise<number>;
      onTerminalData: (callback: (event: any, data: string) => void) => void;
      writeTerminal: (pid: number, data: string) => void;
      resizeTerminal: (pid: number, cols: number, rows: number) => void;
    };
  }
}

interface TerminalProps {}

const TerminalComponent: React.FC<TerminalProps> = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<any>(null);
  const fitAddonRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);

  // Load xterm and addons
  useEffect(() => {
    const loadDeps = async () => {
      try {
        // Import xterm and its CSS
        const xterm = await import("xterm");
        XTerminal = xterm.Terminal;

        // Import CSS
        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = "https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.min.css";
        document.head.appendChild(style);

        // Import addons
        const fitAddon = await import("@xterm/addon-fit");
        FitAddon = fitAddon.FitAddon;

        const webLinksAddon = await import("@xterm/addon-web-links");
        WebLinksAddon = webLinksAddon.WebLinksAddon;

        const webglAddon = await import("@xterm/addon-webgl");
        WebglAddon = webglAddon.WebglAddon;

        const searchAddon = await import("@xterm/addon-search");
        SearchAddon = searchAddon.SearchAddon;

        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load terminal dependencies:", error);
      }
    };

    loadDeps();

    // Cleanup CSS
    return () => {
      const style = document.querySelector('link[href*="xterm.min.css"]');
      if (style) {
        style.remove();
      }
    };
  }, []);

  // Cleanup function
  const cleanup = () => {
    if (xtermRef.current) {
      try {
        xtermRef.current.dispose();
      } catch (e) {
        console.warn("Error disposing terminal:", e);
      }
      xtermRef.current = null;
    }

    if (wsRef.current) {
      try {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.close();
        }
      } catch (e) {
        console.warn("Error closing WebSocket:", e);
      }
      wsRef.current = null;
    }
  };

  // Initialize terminal after dependencies are loaded
  useEffect(() => {
    let mounted = true;
    let resizeObserver: ResizeObserver | null = null;

    const initTerminal = async () => {
      if (!terminalRef.current || xtermRef.current || !mounted || !XTerminal) return;

      try {
        // Wait for the container to be properly sized
        const { clientWidth, clientHeight } = terminalRef.current;
        if (clientWidth === 0 || clientHeight === 0) {
          requestAnimationFrame(initTerminal);
          return;
        }

        // Initialize xterm.js
        const term = new XTerminal({
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 14,
          lineHeight: 1.2,
          cursorBlink: true,
          allowProposedApi: true,
          rows: Math.floor((clientHeight - 20) / 17), // Account for padding
          cols: Math.floor((clientWidth - 20) / 9), // Account for padding
          theme:
            theme === "dark"
              ? {
                  background: "#1a1b26",
                  foreground: "#c0caf5",
                  cursor: "#c0caf5",
                  selectionBackground: "#515c7e40",
                  black: "#15161e",
                  red: "#f7768e",
                  green: "#9ece6a",
                  yellow: "#e0af68",
                  blue: "#7aa2f7",
                  magenta: "#bb9af7",
                  cyan: "#7dcfff",
                  white: "#a9b1d6",
                  brightBlack: "#414868",
                  brightRed: "#f7768e",
                  brightGreen: "#9ece6a",
                  brightYellow: "#e0af68",
                  brightBlue: "#7aa2f7",
                  brightMagenta: "#bb9af7",
                  brightCyan: "#7dcfff",
                  brightWhite: "#c0caf5",
                }
              : {
                  background: "#ffffff",
                  foreground: "#1e293b",
                  cursor: "#1e293b",
                  selectionBackground: "#3b82f620",
                  black: "#1e293b",
                  red: "#ef4444",
                  green: "#22c55e",
                  yellow: "#f59e0b",
                  blue: "#3b82f6",
                  magenta: "#d946ef",
                  cyan: "#06b6d4",
                  white: "#e2e8f0",
                  brightBlack: "#475569",
                  brightRed: "#ef4444",
                  brightGreen: "#22c55e",
                  brightYellow: "#f59e0b",
                  brightBlue: "#3b82f6",
                  brightMagenta: "#d946ef",
                  brightCyan: "#06b6d4",
                  brightWhite: "#f8fafc",
                },
        });

        // Add addons
        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();
        const searchAddon = new SearchAddon();

        term.loadAddon(fitAddon);
        term.loadAddon(webLinksAddon);
        term.loadAddon(searchAddon);

        try {
          const webglAddon = new WebglAddon();
          term.loadAddon(webglAddon);
          webglAddon.onContextLoss(() => {
            webglAddon.dispose();
          });
        } catch (e) {
          console.warn("WebGL addon could not be loaded", e);
        }

        // Open terminal in container
        if (!mounted) return;
        term.open(terminalRef.current);

        // Ensure the terminal is properly sized
        await new Promise((resolve) => setTimeout(resolve, 0));
        if (!mounted) return;
        fitAddon.fit();

        // Store references
        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        // Initialize WebSocket connection
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const ws = new WebSocket(
          `${protocol}//${window.location.hostname}:${window.location.port}/api/terminal/ws`,
        );
        wsRef.current = ws;

        ws.onopen = () => {
          if (!mounted) return;
          term.write("\x1b[1;32mConnected to terminal server.\x1b[0m\r\n");
        };

        ws.onmessage = (event) => {
          if (!mounted) return;
          try {
            const message = JSON.parse(event.data);
            if (message.type === "output") {
              term.write(message.data);
            }
          } catch (e) {
            console.warn("Error processing message:", e);
          }
        };

        ws.onerror = () => {
          if (!mounted) return;
          term.write("\x1b[1;31mError connecting to terminal server.\x1b[0m\r\n");
        };

        ws.onclose = () => {
          if (!mounted) return;
          term.write("\x1b[1;31mDisconnected from terminal server.\x1b[0m\r\n");
        };
        // Handle terminal input
        term.onData((data: string) => {
          if (!mounted || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
          try {
            wsRef.current.send(JSON.stringify({ type: "input", data }));
          } catch (e) {
            console.warn("Error sending data:", e);
          }
        });

        // Handle terminal resize with debounce
        let resizeTimeout: NodeJS.Timeout;
        resizeObserver = new ResizeObserver(() => {
          if (!mounted || !fitAddonRef.current) return;

          clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(() => {
            if (!mounted) return;
            try {
              fitAddonRef.current?.fit();
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(
                  JSON.stringify({
                    type: "resize",
                    cols: term.cols,
                    rows: term.rows,
                  }),
                );
              }
            } catch (e) {
              console.warn("Error handling resize:", e);
            }
          }, 50); // Debounce resize events
        });

        resizeObserver.observe(terminalRef.current);
      } catch (error) {
        console.error("Error initializing terminal:", error);
        cleanup();
      }
    };

    if (!isLoading) {
      initTerminal();
    }

    return () => {
      mounted = false;
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      cleanup();
    };
  }, [theme, isLoading]);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[var(--bg-darker)]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div ref={terminalRef} className="h-full w-full p-2.5 overflow-hidden bg-[var(--bg-darker)]" />
  );
};

export default TerminalComponent;
