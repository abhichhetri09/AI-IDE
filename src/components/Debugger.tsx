"use client";

import { useState, useEffect, useRef } from "react";
import { useMonaco } from "@monaco-editor/react";

interface Breakpoint {
  id: string;
  lineNumber: number;
  column: number;
  enabled: boolean;
  condition?: string;
  hitCount?: number;
}

interface Variable {
  name: string;
  value: any;
  type: string;
  scope: string;
}

interface CallStackFrame {
  id: string;
  name: string;
  line: number;
  column: number;
  source: string;
}

interface DebuggerProps {
  workspaceId: string;
}

export default function Debugger({ workspaceId }: DebuggerProps) {
  const monaco = useMonaco();
  const [isDebugging, setIsDebugging] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [breakpoints, setBreakpoints] = useState<Breakpoint[]>([]);
  const [variables, setVariables] = useState<Variable[]>([]);
  const [callStack, setCallStack] = useState<CallStackFrame[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!monaco) return;

    // Set up Monaco editor debug decorations
    const decorations = breakpoints.map((bp) => ({
      range: new monaco.Range(bp.lineNumber, 1, bp.lineNumber, 1),
      options: {
        isWholeLine: true,
        className: bp.enabled ? "debug-breakpoint-active" : "debug-breakpoint-disabled",
        glyphMarginClassName: bp.enabled
          ? "debug-breakpoint-glyph-active"
          : "debug-breakpoint-glyph-disabled",
      },
    }));

    // Add decorations to editor
    monaco.editor.getModels()[0]?.deltaDecorations([], decorations);
  }, [monaco, breakpoints]);

  const startDebugging = async () => {
    try {
      setIsDebugging(true);
      setError(null);
      // In a real implementation, you would:
      // 1. Start a debug session
      // 2. Connect to the debug adapter
      // 3. Configure initial breakpoints
    } catch (err) {
      setError("Failed to start debugging session");
      setIsDebugging(false);
    }
  };

  const stopDebugging = async () => {
    try {
      setIsDebugging(false);
      setIsPaused(false);
      setVariables([]);
      setCallStack([]);
      setSelectedFrame(null);
      setError(null);
      // In a real implementation, you would:
      // 1. Stop the debug session
      // 2. Clean up resources
    } catch (err) {
      setError("Failed to stop debugging session");
    }
  };

  const toggleBreakpoint = async (lineNumber: number) => {
    const existingBp = breakpoints.find((bp) => bp.lineNumber === lineNumber);

    if (existingBp) {
      // Toggle existing breakpoint
      setBreakpoints(
        breakpoints.map((bp) => (bp.id === existingBp.id ? { ...bp, enabled: !bp.enabled } : bp)),
      );
    } else {
      // Add new breakpoint
      const newBreakpoint: Breakpoint = {
        id: Math.random().toString(36).substr(2, 9),
        lineNumber,
        column: 1,
        enabled: true,
      };
      setBreakpoints([...breakpoints, newBreakpoint]);
    }
  };

  const removeBreakpoint = (id: string) => {
    setBreakpoints(breakpoints.filter((bp) => bp.id !== id));
  };

  const setBreakpointCondition = (id: string, condition: string) => {
    setBreakpoints(breakpoints.map((bp) => (bp.id === id ? { ...bp, condition } : bp)));
  };

  const continue_ = async () => {
    try {
      setIsPaused(false);
      // In a real implementation, you would:
      // 1. Send continue command to debug adapter
      // 2. Wait for next breakpoint hit
    } catch (err) {
      setError("Failed to continue execution");
    }
  };

  const stepOver = async () => {
    try {
      // In a real implementation, you would:
      // 1. Send step over command to debug adapter
      // 2. Update UI with new position
    } catch (err) {
      setError("Failed to step over");
    }
  };

  const stepInto = async () => {
    try {
      // In a real implementation, you would:
      // 1. Send step into command to debug adapter
      // 2. Update UI with new position
    } catch (err) {
      setError("Failed to step into");
    }
  };

  const stepOut = async () => {
    try {
      // In a real implementation, you would:
      // 1. Send step out command to debug adapter
      // 2. Update UI with new position
    } catch (err) {
      setError("Failed to step out");
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Debug Controls */}
      <div className="flex items-center space-x-2 p-4 border-b border-[var(--border-color)]">
        <button
          onClick={isDebugging ? stopDebugging : startDebugging}
          className={`px-3 py-1 rounded text-sm ${
            isDebugging
              ? "bg-red-500 hover:bg-red-600"
              : "bg-[var(--primary)] hover:bg-[var(--primary-darker)]"
          } text-white`}
        >
          {isDebugging ? "Stop" : "Start"} Debugging
        </button>

        {isDebugging && (
          <>
            <button
              onClick={continue_}
              disabled={!isPaused}
              className="p-1 hover:bg-[var(--bg-lighter)] rounded disabled:opacity-50"
              title="Continue (F5)"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
            <button
              onClick={stepOver}
              disabled={!isPaused}
              className="p-1 hover:bg-[var(--bg-lighter)] rounded disabled:opacity-50"
              title="Step Over (F10)"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 5V2L8 6l4 4V7c3.31 0 6 2.69 6 6 0 2.97-2.17 5.43-5 5.91v2.02c3.95-.49 7-3.85 7-7.93 0-4.42-3.58-8-8-8z" />
              </svg>
            </button>
            <button
              onClick={stepInto}
              disabled={!isPaused}
              className="p-1 hover:bg-[var(--bg-lighter)] rounded disabled:opacity-50"
              title="Step Into (F11)"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 5V2L8 6l4 4V7c3.31 0 6 2.69 6 6 0 .79-.15 1.56-.44 2.25l1.61 1.61c.37-.87.61-1.84.61-2.86 0-4.42-3.58-8-8-8zM7 13c0-.79.15-1.56.44-2.25L5.83 9.14c-.37.87-.61 1.84-.61 2.86 0 4.42 3.58 8 8 8v3l4-4-4-4v3c-3.31 0-6-2.69-6-6z" />
              </svg>
            </button>
            <button
              onClick={stepOut}
              disabled={!isPaused}
              className="p-1 hover:bg-[var(--bg-lighter)] rounded disabled:opacity-50"
              title="Step Out (Shift+F11)"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 5V2L8 6l4 4V7c3.31 0 6 2.69 6 6 0 2.97-2.17 5.43-5 5.91v2.02c3.95-.49 7-3.85 7-7.93 0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-2.97 2.17-5.43 5-5.91V5.07C7.05 5.56 4 8.92 4 13c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
              </svg>
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="p-4 text-sm text-[var(--error)] bg-[var(--error-bg)] border-b border-[var(--border-color)]">
          {error}
        </div>
      )}

      <div className="flex-1 flex">
        {/* Left Panel: Breakpoints & Call Stack */}
        <div className="w-64 border-r border-[var(--border-color)] flex flex-col">
          {/* Breakpoints */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 text-sm font-medium border-b border-[var(--border-color)]">
              Breakpoints
            </div>
            <div className="p-2">
              {breakpoints.map((bp) => (
                <div key={bp.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={bp.enabled}
                      onChange={() => toggleBreakpoint(bp.lineNumber)}
                      className="mr-2"
                    />
                    <span className="text-sm">Line {bp.lineNumber}</span>
                  </div>
                  <button
                    onClick={() => removeBreakpoint(bp.id)}
                    className="text-[var(--text-secondary)] hover:text-[var(--error)]"
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
                </div>
              ))}
            </div>
          </div>

          {/* Call Stack */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 text-sm font-medium border-b border-[var(--border-color)]">
              Call Stack
            </div>
            <div className="p-2">
              {callStack.map((frame) => (
                <div
                  key={frame.id}
                  className={`py-1 px-2 text-sm cursor-pointer rounded ${
                    selectedFrame === frame.id
                      ? "bg-[var(--bg-lighter)]"
                      : "hover:bg-[var(--bg-lighter)]"
                  }`}
                  onClick={() => setSelectedFrame(frame.id)}
                >
                  <div className="font-medium">{frame.name}</div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    {frame.source}:{frame.line}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Variables */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2 text-sm font-medium border-b border-[var(--border-color)]">
            Variables
          </div>
          <div className="p-2">
            {variables.map((variable) => (
              <div key={variable.name} className="py-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{variable.name}</span>
                  <span className="text-[var(--text-secondary)]">{variable.type}</span>
                </div>
                <div className="text-xs text-[var(--text-secondary)]">{variable.scope}</div>
                <div className="mt-1 p-2 bg-[var(--bg-darker)] rounded font-mono text-xs">
                  {JSON.stringify(variable.value, null, 2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
