import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";

// Common project files that indicate the root of a project
const PROJECT_FILES = [
  "package.json",
  "cargo.toml",
  "go.mod",
  "requirements.txt",
  "composer.json",
  "build.gradle",
  "pom.xml",
  ".git",
  ".svn",
  ".hg",
  ".project",
  ".idea",
  ".vscode",
];

async function detectProjectType(dirPath: string): Promise<{
  type: string;
  hasGit: boolean;
  projectFiles: string[];
}> {
  try {
    const files = await fs.readdir(dirPath);
    const projectFiles = files.filter((file) => PROJECT_FILES.includes(file.toLowerCase()));

    let type = "unknown";
    const hasGit = files.includes(".git");

    // Detect project type based on files
    if (files.includes("package.json")) {
      const pkgContent = await fs.readFile(path.join(dirPath, "package.json"), "utf-8");
      const pkg = JSON.parse(pkgContent);
      type = pkg.type === "module" ? "nodejs-esm" : "nodejs";
    } else if (files.includes("cargo.toml")) {
      type = "rust";
    } else if (files.includes("go.mod")) {
      type = "go";
    } else if (files.includes("requirements.txt")) {
      type = "python";
    }

    return { type, hasGit, projectFiles };
  } catch (error) {
    console.warn("Error detecting project type:", error);
    return { type: "unknown", hasGit: false, projectFiles: [] };
  }
}

async function getGitInfo(dirPath: string): Promise<{
  branch?: string;
  remote?: string;
} | null> {
  try {
    const gitDir = path.join(dirPath, ".git");
    const gitConfig = await fs.readFile(path.join(gitDir, "config"), "utf-8");
    const headContent = await fs.readFile(path.join(gitDir, "HEAD"), "utf-8");

    const remote = gitConfig.match(/url = (.+)/)?.[1];
    const branch = headContent.match(/ref: refs\/heads\/(.+)/)?.[1];

    return { remote, branch };
  } catch (error) {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { workspacePath, name } = await request.json();

    // Get the absolute path of the workspace
    let absolutePath;
    if (path.isAbsolute(workspacePath)) {
      absolutePath = workspacePath;
    } else {
      // If not absolute, assume it's relative to the user's home directory
      absolutePath = path.join(os.homedir(), workspacePath);
    }

    // Normalize path for consistent comparison
    absolutePath = path.normalize(absolutePath);

    // Verify the path exists and is a directory
    try {
      const stats = await fs.stat(absolutePath);
      if (!stats.isDirectory()) {
        return NextResponse.json({ error: "Path is not a directory" }, { status: 400 });
      }
    } catch (error) {
      return NextResponse.json({ error: "Invalid directory path" }, { status: 400 });
    }

    // Create workspaces directory if it doesn't exist
    const workspacesDir = path.join(os.homedir(), ".ai-ide", "workspaces");
    await fs.mkdir(workspacesDir, { recursive: true });

    // Check if this path is already registered
    const files = await fs.readdir(workspacesDir);
    for (const file of files) {
      if (!file.endsWith(".json")) continue;

      try {
        const content = await fs.readFile(path.join(workspacesDir, file), "utf-8");
        const workspace = JSON.parse(content);

        // Compare normalized paths
        const normalizedWorkspacePath = path.normalize(workspace.path);
        if (normalizedWorkspacePath === absolutePath) {
          // Update last accessed time
          workspace.lastAccessed = new Date().toISOString();
          await fs.writeFile(path.join(workspacesDir, file), JSON.stringify(workspace, null, 2));
          return NextResponse.json(workspace);
        }
      } catch (error) {
        console.warn(`Error reading workspace file ${file}:`, error);
      }
    }

    // Detect project type and git info
    const { type, hasGit, projectFiles } = await detectProjectType(absolutePath);
    const gitInfo = hasGit ? await getGitInfo(absolutePath) : null;

    // Create new workspace entry
    const workspaceId = uuidv4();
    const workspace = {
      id: workspaceId,
      path: absolutePath,
      name: name || path.basename(absolutePath),
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      type,
      projectFiles,
      git: gitInfo
        ? {
            enabled: true,
            branch: gitInfo.branch,
            remote: gitInfo.remote,
          }
        : undefined,
      settings: {
        formatOnSave: true,
        indentSize: 2,
        theme: "dark",
        language: type === "unknown" ? "plaintext" : type,
        excludePatterns: [
          "**/node_modules/**",
          "**/dist/**",
          "**/build/**",
          "**/.git/**",
          "**/target/**",
        ],
      },
    };

    // Save workspace info
    await fs.writeFile(
      path.join(workspacesDir, `${workspaceId}.json`),
      JSON.stringify(workspace, null, 2),
    );

    return NextResponse.json(workspace);
  } catch (error) {
    console.error("Error validating workspace:", error);
    return NextResponse.json({ error: "Failed to validate workspace" }, { status: 500 });
  }
}
