import { NextResponse } from "next/server";
import { spawn } from "child_process";
import { platform } from "os";

// Get the appropriate shell for the platform
const getShell = () => {
  switch (platform()) {
    case "win32":
      return {
        shell: "powershell.exe",
        args: ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command"],
      };
    case "darwin":
      return { shell: "/bin/zsh", args: ["-c"] };
    default:
      return { shell: "/bin/bash", args: ["-c"] };
  }
};

// Validate command for basic security
const validateCommand = (command: string) => {
  // List of dangerous commands that should be blocked
  const dangerousCommands = [
    "rm -rf",
    "deltree",
    "format",
    ":(){:|:&};:",
    "dd",
    "> /dev/sda",
    "mkfs",
    "> /dev/null",
    "chmod -R 777 /",
    "mv /* /dev/null",
  ];

  // Check for dangerous commands
  if (dangerousCommands.some((cmd) => command.toLowerCase().includes(cmd.toLowerCase()))) {
    throw new Error("Command not allowed for security reasons");
  }

  return command;
};

export async function POST(request: Request) {
  try {
    const { command, cwd } = await request.json();

    // Validate input
    if (!command || typeof command !== "string") {
      return NextResponse.json({ error: "Invalid command" }, { status: 400 });
    }

    // Validate command for security
    try {
      validateCommand(command);
    } catch (error) {
      return NextResponse.json(
        { error: "Command not allowed for security reasons" },
        { status: 403 },
      );
    }

    // Get shell configuration
    const { shell, args } = getShell();

    // Create a promise to handle the command execution
    const result = await new Promise<{ output: string; error?: string }>((resolve, reject) => {
      try {
        // Spawn the shell process
        const proc = spawn(shell, [...args, command], {
          cwd: cwd || process.cwd(),
          shell: true,
        });

        let output = "";
        let errorOutput = "";

        // Handle stdout data
        proc.stdout.on("data", (data) => {
          output += data.toString();
        });

        // Handle stderr data
        proc.stderr.on("data", (data) => {
          errorOutput += data.toString();
        });

        // Handle process completion
        proc.on("close", (code) => {
          if (code === 0) {
            resolve({ output: output || errorOutput });
          } else {
            resolve({
              output: errorOutput || output,
              error: `Process exited with code ${code}`,
            });
          }
        });

        // Handle process errors
        proc.on("error", (error) => {
          reject(error);
        });

        // Set a timeout
        const timeout = setTimeout(() => {
          proc.kill();
          reject(new Error("Command execution timed out"));
        }, 30000); // 30 seconds timeout

        // Clear timeout when process ends
        proc.on("close", () => {
          clearTimeout(timeout);
        });
      } catch (error) {
        reject(error);
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in POST /api/terminal:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to execute command",
        output: "",
      },
      { status: 500 },
    );
  }
}
