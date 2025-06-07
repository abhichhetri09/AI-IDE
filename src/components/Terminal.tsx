"use client";

import { useEffect, useRef } from "react";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { WebglAddon } from "@xterm/addon-webgl";
import { SearchAddon } from "@xterm/addon-search";
import { useTheme } from "@/hooks/useTheme";
import "xterm/css/xterm.css";

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

export default function Terminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { theme } = useTheme();

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

  useEffect(() => {
    let mounted = true;
    let resizeObserver: ResizeObserver | null = null;

    const initTerminal = async () => {
      if (!terminalRef.current || xtermRef.current || !mounted) return;

      try {
        // Wait for the container to be properly sized
        const { clientWidth, clientHeight } = terminalRef.current;
        if (clientWidth === 0 || clientHeight === 0) {
          requestAnimationFrame(initTerminal);
          return;
        }

        // Initialize xterm.js
        const term = new XTerm({
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 14,
          lineHeight: 1.2,
          cursorBlink: true,
          allowProposedApi: true,
          rows: Math.floor(clientHeight / 17), // Approximate row height
          cols: Math.floor(clientWidth / 9), // Approximate column width
          theme:
            theme === "dark"
              ? {
                  background: "#1a1b26",
                  foreground: "#c0caf5",
                  cursor: "#c0caf5",
                  selectionBackground: "#515c7e40",
                }
              : {
                  background: "#ffffff",
                  foreground: "#1e293b",
                  cursor: "#1e293b",
                  selectionBackground: "#3b82f620",
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
        term.onData((data) => {
          if (!mounted || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
          try {
            wsRef.current.send(JSON.stringify({ type: "input", data }));
          } catch (e) {
            console.warn("Error sending data:", e);
          }
        });

        // Handle terminal resize
        resizeObserver = new ResizeObserver(() => {
          if (!mounted || !fitAddonRef.current) return;
          requestAnimationFrame(() => {
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
          });
        });

        resizeObserver.observe(terminalRef.current);
      } catch (error) {
        console.error("Error initializing terminal:", error);
        cleanup();
      }
    };

    initTerminal();

    return () => {
      mounted = false;
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      cleanup();
    };
  }, [theme]);

  return (
    <div
      ref={terminalRef}
      className="h-full w-full" // Added w-full to ensure proper sizing
      style={{ minHeight: "100px", minWidth: "100px" }} // Added minimum dimensions
    />
  );
}
