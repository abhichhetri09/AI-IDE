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
      monacoInstance.editor.defineTheme("custom-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [],
        colors: {
          "editor.background": "#1e1e1e",
        },
      });

      monacoInstance.editor.defineTheme("custom-light", {
        base: "vs",
        inherit: true,
        rules: [],
        colors: {
          "editor.background": "#ffffff",
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
      minimap: {
        enabled: false,
      },
      scrollbar: {
        vertical: "visible",
        horizontal: "visible",
      },
      lineNumbers: "on",
      roundedSelection: true,
      selectOnLineNumbers: true,
      automaticLayout: true,
      cursorStyle: "line",
      cursorBlinking: "blink",
      cursorSmoothCaretAnimation: "on",
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
        <div className="flex-1 flex items-center justify-center text-gray-400">No file open</div>
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
            lineNumbers: "on",
            roundedSelection: true,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 10 },
            cursorStyle: "line",
            cursorBlinking: "blink",
            cursorSmoothCaretAnimation: "on",
            smoothScrolling: true,
            scrollBeyondLastColumn: 5,
            wordWrap: "on",
            wrappingStrategy: "advanced",
            links: true,
            mouseWheelScrollSensitivity: 1,
            multiCursorModifier: "alt",
            renderWhitespace: "selection",
          }}
        />
      </div>
    </div>
  );
}
