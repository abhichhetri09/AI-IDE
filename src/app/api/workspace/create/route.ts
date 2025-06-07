import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import os from "os";

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

    return NextResponse.json({
      id: workspaceId,
      name,
      path: workspacePath,
    });
  } catch (error) {
    console.error("Error creating workspace:", error);
    return NextResponse.json({ error: "Failed to create workspace" }, { status: 500 });
  }
}
