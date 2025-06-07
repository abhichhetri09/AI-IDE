import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  TextDocumentSyncKind,
  InitializeResult,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";
import { Position, CompletionItem, Diagnostic } from "vscode-languageserver-types";

// Create a connection for the server
const connection = createConnection(ProposedFeatures.all);

// Create a text document manager
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialize((params: InitializeParams): InitializeResult => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      // Enable completion support
      completionProvider: {
        resolveProvider: true,
        triggerCharacters: ["."],
      },
      // Enable hover support
      hoverProvider: true,
      // Enable document formatting
      documentFormattingProvider: true,
      // Enable code actions
      codeActionProvider: true,
      // Enable diagnostics
      diagnosticProvider: {
        interFileDependencies: false,
        workspaceDiagnostics: false,
      },
    },
  };
});

// Handle document changes
documents.onDidChangeContent(async (change) => {
  validateTextDocument(change.document);
});

// Implement basic TypeScript validation
async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  const text = textDocument.getText();
  const diagnostics: Diagnostic[] = [];

  // Basic TypeScript syntax validation
  // This is a simplified example - in a real implementation,
  // you would use the TypeScript compiler API for proper validation
  const lines = text.split(/\r?\n/g);

  lines.forEach((line, i) => {
    // Example: Check for missing semicolons
    if (
      line.trim().length > 0 &&
      !line.trim().endsWith(";") &&
      !line.trim().endsWith("{") &&
      !line.trim().endsWith("}")
    ) {
      diagnostics.push({
        severity: 2, // Warning
        range: {
          start: { line: i, character: 0 },
          end: { line: i, character: line.length },
        },
        message: "Missing semicolon",
        source: "ts-language-server",
      });
    }
  });

  // Send the diagnostics to the client
  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

// Handle completion requests
connection.onCompletion(async (params): Promise<CompletionItem[]> => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return [];

  const position = params.position;
  const text = document.getText();
  const lines = text.split(/\r?\n/g);
  const line = lines[position.line];
  const char = line[position.character - 1];

  // Basic completion items
  // In a real implementation, you would analyze the code context
  // and provide relevant completions
  if (char === ".") {
    return [
      {
        label: "log",
        kind: 2, // Method
        detail: "console.log(message: any): void",
        documentation: "Logs a message to the console",
      },
      {
        label: "error",
        kind: 2, // Method
        detail: "console.error(message: any): void",
        documentation: "Logs an error message to the console",
      },
    ];
  }

  return [];
});

// Handle hover requests
connection.onHover(async (params) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return null;

  const position = params.position;
  const text = document.getText();
  const lines = text.split(/\r?\n/g);
  const line = lines[position.line];
  const word = getWordAtPosition(line, position.character);

  // Basic hover information
  // In a real implementation, you would analyze the code context
  // and provide relevant documentation
  if (word === "console") {
    return {
      contents: {
        kind: "markdown",
        value:
          "```typescript\ninterface Console {\n  log(message?: any, ...optionalParams: any[]): void;\n  error(message?: any, ...optionalParams: any[]): void;\n}\n```",
      },
    };
  }

  return null;
});

function getWordAtPosition(line: string, character: number): string {
  const wordRegex = /[a-zA-Z_$][a-zA-Z0-9_$]*/g;
  let match;
  while ((match = wordRegex.exec(line)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    if (character >= start && character <= end) {
      return match[0];
    }
  }
  return "";
}

// Listen on the text document manager
documents.listen(connection);

// Listen on the connection
connection.listen();
