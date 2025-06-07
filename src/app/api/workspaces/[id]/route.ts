import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import os from "os";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    console.log("Loading workspace:", params.id);

    // Get workspace info file path
    const workspacesDir = path.join(os.homedir(), ".ai-ide", "workspaces");
    const workspaceInfoPath = path.join(workspacesDir, `${params.id}.json`);

    console.log("Workspace info path:", workspaceInfoPath);

    // Check if workspace info file exists
    try {
      await fs.access(workspaceInfoPath);
    } catch (error) {
      console.error("Workspace not found:", error);
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Read workspace info
    const workspaceInfoContent = await fs.readFile(workspaceInfoPath, "utf-8");
    let workspaceInfo;

    try {
      workspaceInfo = JSON.parse(workspaceInfoContent);
    } catch (error) {
      console.error("Invalid workspace info JSON:", error);
      return NextResponse.json({ error: "Invalid workspace configuration" }, { status: 500 });
    }

    // Verify the workspace info has required fields
    if (!workspaceInfo.id || !workspaceInfo.path) {
      console.error("Invalid workspace info structure:", workspaceInfo);
      return NextResponse.json({ error: "Invalid workspace configuration" }, { status: 500 });
    }

    // Verify the actual workspace directory exists
    try {
      const stats = await fs.stat(workspaceInfo.path);
      if (!stats.isDirectory()) {
        return NextResponse.json({ error: "Invalid workspace path" }, { status: 400 });
      }
    } catch (error) {
      return NextResponse.json({ error: "Workspace directory not found" }, { status: 404 });
    }

    // Update last modified time
    workspaceInfo.modified = new Date().toISOString();
    await fs.writeFile(workspaceInfoPath, JSON.stringify(workspaceInfo, null, 2));

    console.log("Returning workspace info:", workspaceInfo);
    return NextResponse.json(workspaceInfo);
  } catch (error) {
    console.error("Error accessing workspace:", error);
    return NextResponse.json(
      { error: "Failed to access workspace", details: (error as Error).message },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Get workspace info file path
    const workspacesDir = path.join(os.homedir(), ".ai-ide", "workspaces");
    const workspaceInfoPath = path.join(workspacesDir, `${params.id}.json`);

    // Check if workspace info file exists
    try {
      await fs.access(workspaceInfoPath);
    } catch (error) {
      // If file doesn't exist, consider it already deleted
      return NextResponse.json({ success: true });
    }

    // Delete the workspace info file
    await fs.unlink(workspaceInfoPath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting workspace:", error);
    return NextResponse.json(
      { error: "Failed to delete workspace", details: (error as Error).message },
      { status: 500 },
    );
  }
}
