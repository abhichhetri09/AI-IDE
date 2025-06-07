import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import os from "os";

export async function POST(req: Request) {
  try {
    const { name, path: folderPath } = await req.json();

    // Create a unique ID for the workspace
    const workspaceId = crypto.randomUUID();

    // Store the workspace info
    const workspacesDir = path.join(os.homedir(), ".ai-ide", "workspaces");
    await fs.mkdir(workspacesDir, { recursive: true });

    const workspaceInfoPath = path.join(workspacesDir, `${workspaceId}.json`);
    const workspaceInfo = {
      id: workspaceId,
      name,
      path: folderPath,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
    };

    await fs.writeFile(workspaceInfoPath, JSON.stringify(workspaceInfo, null, 2));

    return NextResponse.json(workspaceInfo);
  } catch (error) {
    console.error("Error opening workspace:", error);
    return NextResponse.json({ error: "Failed to open workspace" }, { status: 500 });
  }
}
