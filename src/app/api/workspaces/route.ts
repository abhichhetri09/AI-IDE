import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import os from "os";

export async function GET() {
  try {
    const workspacesDir = path.join(os.homedir(), ".ai-ide", "workspaces");

    // Create workspaces directory if it doesn't exist
    try {
      await fs.access(workspacesDir);
    } catch {
      await fs.mkdir(workspacesDir, { recursive: true });
      return NextResponse.json([]);
    }

    // Read all workspace files
    const files = await fs.readdir(workspacesDir);
    const workspaces = [];
    const invalidWorkspaces = [];

    for (const file of files) {
      if (!file.endsWith(".json")) continue;

      try {
        const filePath = path.join(workspacesDir, file);
        const content = await fs.readFile(filePath, "utf-8");
        const workspace = JSON.parse(content);

        // Validate workspace structure
        if (!workspace.id || !workspace.path) {
          console.warn(`Invalid workspace structure in ${file}`);
          invalidWorkspaces.push(file);
          continue;
        }

        // Check if workspace directory exists
        try {
          await fs.access(workspace.path);
          workspaces.push(workspace);
        } catch {
          console.warn(`Workspace directory not found: ${workspace.path}`);
          invalidWorkspaces.push(file);
        }
      } catch (error) {
        console.error(`Error reading workspace file ${file}:`, error);
        invalidWorkspaces.push(file);
      }
    }

    // Clean up invalid workspace files
    for (const file of invalidWorkspaces) {
      try {
        await fs.unlink(path.join(workspacesDir, file));
        console.log(`Removed invalid workspace file: ${file}`);
      } catch (error) {
        console.error(`Failed to remove invalid workspace file ${file}:`, error);
      }
    }

    return NextResponse.json(workspaces);
  } catch (error) {
    console.error("Error listing workspaces:", error);
    return NextResponse.json({ error: "Failed to list workspaces" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json();

    // Create workspace directory in user's home directory
    const workspacesDir = path.join(os.homedir(), ".ai-ide", "workspaces");
    await fs.mkdir(workspacesDir, { recursive: true });

    const workspaceId = crypto.randomUUID();
    const workspacePath = path.join(workspacesDir, workspaceId);
    await fs.mkdir(workspacePath);

    // Create basic workspace structure
    await Promise.all([
      fs.mkdir(path.join(workspacePath, "src")),
      fs.mkdir(path.join(workspacePath, "public")),
      fs.writeFile(
        path.join(workspacePath, "README.md"),
        `# ${name}\n\nWelcome to your new workspace!`,
      ),
      fs.writeFile(
        path.join(workspacePath, ".gitignore"),
        "node_modules\n.next\n.env\n.env.local\n",
      ),
    ]);

    // Create workspace info file
    const workspaceInfo = {
      id: workspaceId,
      name,
      path: workspacePath,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
    };

    await fs.writeFile(
      path.join(workspacesDir, `${workspaceId}.json`),
      JSON.stringify(workspaceInfo, null, 2),
    );

    return NextResponse.json(workspaceInfo);
  } catch (error) {
    console.error("Error creating workspace:", error);
    return NextResponse.json({ error: "Failed to create workspace" }, { status: 500 });
  }
}
