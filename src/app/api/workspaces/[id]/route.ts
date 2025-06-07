import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Get workspace path from the workspace ID
    const workspacePath = path.join(process.cwd(), "workspaces", params.id);

    // Check if workspace directory exists
    try {
      await fs.access(workspacePath);
    } catch (error) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Get workspace info
    const stats = await fs.stat(workspacePath);
    const isDirectory = stats.isDirectory();

    if (!isDirectory) {
      return NextResponse.json({ error: "Invalid workspace path" }, { status: 400 });
    }

    // Return workspace info
    return NextResponse.json({
      id: params.id,
      path: workspacePath,
      created: stats.birthtime,
      modified: stats.mtime,
    });
  } catch (error) {
    console.error("Error accessing workspace:", error);
    return NextResponse.json({ error: "Failed to access workspace" }, { status: 500 });
  }
}
