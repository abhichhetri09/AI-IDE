import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";

interface CompileOptions {
  code: string;
  language: string;
  filename: string;
  workingDirectory: string;
}

interface CompileResult {
  success: boolean;
  output: string;
  error?: string;
}

export class CompilerService {
  private static async executeCommand(
    command: string,
    args: string[],
    cwd: string,
  ): Promise<CompileResult> {
    return new Promise((resolve) => {
      const process = spawn(command, args, { cwd });
      let output = "";
      let error = "";

      process.stdout.on("data", (data) => {
        output += data.toString();
      });

      process.stderr.on("data", (data) => {
        error += data.toString();
      });

      process.on("close", (code) => {
        resolve({
          success: code === 0,
          output: output || error,
          error: code !== 0 ? error : undefined,
        });
      });
    });
  }

  private static getCompilationCommand(
    language: string,
    filename: string,
  ): { command: string; args: string[] } {
    switch (language) {
      case "python":
        return { command: "python3", args: [filename] };
      case "javascript":
        return { command: "node", args: [filename] };
      case "typescript":
        return { command: "npx", args: ["ts-node", filename] };
      case "java": {
        const className = path.basename(filename, ".java");
        return { command: "javac", args: [filename] };
      }
      case "cpp":
        return { command: "g++", args: [filename, "-o", `${filename}.out`] };
      case "c":
        return { command: "gcc", args: [filename, "-o", `${filename}.out`] };
      case "go":
        return { command: "go", args: ["run", filename] };
      case "rust":
        return { command: "rustc", args: [filename] };
      case "php":
        return { command: "php", args: [filename] };
      case "ruby":
        return { command: "ruby", args: [filename] };
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }

  private static getExecutionCommand(
    language: string,
    filename: string,
  ): { command: string; args: string[] } | null {
    switch (language) {
      case "java": {
        const className = path.basename(filename, ".java");
        return { command: "java", args: [className] };
      }
      case "cpp":
      case "c":
        return { command: `./${filename}.out`, args: [] };
      case "rust": {
        const executableName = path.basename(filename, ".rs");
        return { command: `./${executableName}`, args: [] };
      }
      default:
        return null; // No separate execution needed
    }
  }

  public static async compileAndRun({
    code,
    language,
    filename,
    workingDirectory,
  }: CompileOptions): Promise<CompileResult> {
    try {
      // Create a temporary file with the code
      const filePath = path.join(workingDirectory, filename);
      await fs.writeFile(filePath, code);

      // Get compilation command
      const compileCmd = this.getCompilationCommand(language, filename);

      // Compile the code
      const compileResult = await this.executeCommand(
        compileCmd.command,
        compileCmd.args,
        workingDirectory,
      );

      if (!compileResult.success) {
        return compileResult;
      }

      // Check if separate execution is needed
      const execCmd = this.getExecutionCommand(language, filename);
      if (execCmd) {
        const execResult = await this.executeCommand(
          execCmd.command,
          execCmd.args,
          workingDirectory,
        );
        return execResult;
      }

      return compileResult;
    } catch (error) {
      return {
        success: false,
        output: "",
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }
}
