import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const workspacesPath = path.join(process.cwd(), "workspaces");

    // Create workspaces directory if it doesn't exist
    try {
      await fs.access(workspacesPath);
    } catch (error) {
      await fs.mkdir(workspacesPath, { recursive: true });
    }

    // Get all workspace directories
    const entries = await fs.readdir(workspacesPath, { withFileTypes: true });
    const workspaces = await Promise.all(
      entries
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => {
          const workspacePath = path.join(workspacesPath, entry.name);
          const stats = await fs.stat(workspacePath);
          return {
            id: entry.name,
            path: workspacePath,
            created: stats.birthtime,
            modified: stats.mtime,
          };
        })
    );

    return NextResponse.json(workspaces);
  } catch (error) {
    console.error("Error listing workspaces:", error);
    return NextResponse.json(
      { error: "Failed to list workspaces" },
      { status: 500 }
    );
  }
} 