import { useFile } from "@/contexts/FileContext";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import TabBar from "./TabBar";
import { editor } from "monaco-editor";
import { Editor as MonacoEditor } from "@monaco-editor/react";
import { useMonaco } from "@monaco-editor/react";

export default function Editor() {
  const { currentFile, updateFileContent } = useFile();
  const { theme } = useTheme();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoInstance = useMonaco();
  const [editorValue, setEditorValue] = useState(currentFile?.content || "");

  // Update editor value when currentFile changes
  useEffect(() => {
    if (currentFile) {
      setEditorValue(currentFile.content);
    }
  }, [currentFile?.id]); // Only trigger when file ID changes

  useEffect(() => {
    if (monacoInstance) {
      // Define dark theme
      monacoInstance.editor.defineTheme("custom-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "comment", foreground: "6d7393" },
          { token: "keyword", foreground: "bb9af7" },
          { token: "string", foreground: "9ece6a" },
          { token: "number", foreground: "ff9e64" },
          { token: "type", foreground: "7aa2f7" },
          { token: "class", foreground: "7aa2f7" },
          { token: "function", foreground: "7dcfff" },
          { token: "variable", foreground: "c0caf5" },
          { token: "operator", foreground: "89ddff" },
        ],
        colors: {
          "editor.background": "#1a1b26",
          "editor.foreground": "#c0caf5",
          "editor.lineHighlightBackground": "#1f2937",
          "editor.selectionBackground": "#515c7e40",
          "editor.inactiveSelectionBackground": "#515c7e20",
          "editorCursor.foreground": "#c0caf5",
          "editorWhitespace.foreground": "#3b4261",
          "editorIndentGuide.background": "#2f334d",
          "editorIndentGuide.activeBackground": "#3b4261",
          "editor.selectionHighlightBackground": "#515c7e30",
          "editor.wordHighlightBackground": "#515c7e40",
          "editor.wordHighlightStrongBackground": "#515c7e40",
          "editor.findMatchBackground": "#515c7e40",
          "editor.findMatchHighlightBackground": "#515c7e30",
          "editor.lineHighlightBorder": "#1f2937",
          "editorLineNumber.foreground": "#3b4261",
          "editorLineNumber.activeForeground": "#737aa2",
          "editorBracketMatch.background": "#515c7e40",
          "editorBracketMatch.border": "#515c7e",
        },
      });

      // Define light theme
      monacoInstance.editor.defineTheme("custom-light", {
        base: "vs",
        inherit: true,
        rules: [
          { token: "comment", foreground: "6b7280" },
          { token: "keyword", foreground: "6366f1" },
          { token: "string", foreground: "059669" },
          { token: "number", foreground: "d97706" },
          { token: "type", foreground: "3b82f6" },
          { token: "class", foreground: "3b82f6" },
          { token: "function", foreground: "0ea5e9" },
          { token: "variable", foreground: "1e293b" },
          { token: "operator", foreground: "0ea5e9" },
        ],
        colors: {
          "editor.background": "#ffffff",
          "editor.foreground": "#1e293b",
          "editor.lineHighlightBackground": "#f1f5f9",
          "editor.selectionBackground": "#3b82f620",
          "editor.inactiveSelectionBackground": "#3b82f610",
          "editorCursor.foreground": "#1e293b",
          "editorWhitespace.foreground": "#94a3b8",
          "editorIndentGuide.background": "#e2e8f0",
          "editorIndentGuide.activeBackground": "#94a3b8",
          "editor.selectionHighlightBackground": "#3b82f615",
          "editor.wordHighlightBackground": "#3b82f620",
          "editor.wordHighlightStrongBackground": "#3b82f620",
          "editor.findMatchBackground": "#3b82f620",
          "editor.findMatchHighlightBackground": "#3b82f615",
          "editor.lineHighlightBorder": "#f1f5f9",
          "editorLineNumber.foreground": "#94a3b8",
          "editorLineNumber.activeForeground": "#64748b",
          "editorBracketMatch.background": "#3b82f620",
          "editorBracketMatch.border": "#3b82f640",
        },
      });
    }
  }, [monacoInstance]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        theme: theme === "dark" ? "custom-dark" : "custom-light",
      });
    }
  }, [theme]);

  const getLanguageFromPath = (path: string): string => {
    const extension = path.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "js":
        return "javascript";
      case "ts":
        return "typescript";
      case "jsx":
        return "javascript";
      case "tsx":
        return "typescript";
      case "css":
        return "css";
      case "html":
        return "html";
      case "json":
        return "json";
      case "md":
        return "markdown";
      case "py":
        return "python";
      case "java":
        return "java";
      case "cpp":
        return "cpp";
      case "c":
        return "c";
      case "go":
        return "go";
      case "rs":
        return "rust";
      case "php":
        return "php";
      case "rb":
        return "ruby";
      case "sh":
        return "shell";
      case "yaml":
      case "yml":
        return "yaml";
      case "xml":
        return "xml";
      case "sql":
        return "sql";
      default:
        return "plaintext";
    }
  };

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    editor.updateOptions({
      theme: theme === "dark" ? "custom-dark" : "custom-light",
      fontSize: 14,
      fontFamily: "'JetBrains Mono', Consolas, 'Courier New', monospace",
      minimap: {
        enabled: false,
      },
      scrollbar: {
        vertical: "visible",
        horizontal: "visible",
        verticalScrollbarSize: 12,
        horizontalScrollbarSize: 12,
      },
      lineNumbers: "on",
      roundedSelection: true,
      selectOnLineNumbers: true,
      automaticLayout: true,
      padding: { top: 8, bottom: 8 },
      cursorStyle: "line",
      cursorBlinking: "smooth",
      cursorSmoothCaretAnimation: "on",
      smoothScrolling: true,
      mouseWheelScrollSensitivity: 1,
      multiCursorModifier: "alt",
      renderWhitespace: "selection",
      bracketPairColorization: {
        enabled: true,
      },
      guides: {
        bracketPairs: true,
        indentation: true,
      },
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditorValue(value);
      if (currentFile) {
        updateFileContent(currentFile.id, value);
      }
    }
  };

  if (!currentFile) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)]">
          No file open
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <TabBar />
      <div className="flex-1 h-[calc(100%-2.25rem)]">
        <MonacoEditor
          key={currentFile.id}
          height="100%"
          width="100%"
          language={getLanguageFromPath(currentFile.path)}
          value={editorValue}
          onMount={handleEditorDidMount}
          onChange={handleEditorChange}
          theme={theme === "dark" ? "custom-dark" : "custom-light"}
          options={{
            readOnly: false,
            domReadOnly: false,
            contextmenu: true,
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', Consolas, 'Courier New', monospace",
            lineNumbers: "on",
            roundedSelection: true,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 8, bottom: 8 },
            cursorStyle: "line",
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            smoothScrolling: true,
            scrollBeyondLastColumn: 5,
            wordWrap: "on",
            wrappingStrategy: "advanced",
            links: true,
            mouseWheelScrollSensitivity: 1,
            multiCursorModifier: "alt",
            renderWhitespace: "selection",
            bracketPairColorization: {
              enabled: true,
            },
            guides: {
              bracketPairs: true,
              indentation: true,
            },
          }}
        />
      </div>
    </div>
  );
}
