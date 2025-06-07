import { NextResponse } from "next/server";
import { CompilerService } from "@/lib/compiler";
import path from "path";
import os from "os";
import fs from "fs/promises";

export async function POST(request: Request) {
  try {
    const { code, language } = await request.json();

    // Validate input
    if (!code || !language) {
      return NextResponse.json({ error: "Code and language are required" }, { status: 400 });
    }

    // Create a temporary directory for compilation
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ai-ide-"));

    // Generate a filename based on language
    const filename = `main.${getFileExtension(language)}`;

    // Compile and run the code
    const result = await CompilerService.compileAndRun({
      code,
      language,
      filename,
      workingDirectory: tempDir,
    });

    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Compilation failed" }, { status: 400 });
    }

    return NextResponse.json({ output: result.output });
  } catch (error) {
    console.error("Compilation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function getFileExtension(language: string): string {
  switch (language) {
    case "python":
      return "py";
    case "javascript":
      return "js";
    case "typescript":
      return "ts";
    case "java":
      return "java";
    case "cpp":
      return "cpp";
    case "c":
      return "c";
    case "go":
      return "go";
    case "rust":
      return "rs";
    case "php":
      return "php";
    case "ruby":
      return "rb";
    default:
      return "txt";
  }
}
