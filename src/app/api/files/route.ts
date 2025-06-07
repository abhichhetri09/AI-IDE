import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

interface FileSystemItem {
  name: string;
  path: string;
  type: string;
  isOpen: boolean;
  children?: FileSystemItem[];
}

async function getDirectoryContents(dirPath: string): Promise<FileSystemItem[]> {
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    const contents = await Promise.all(
      items.map(async (item) => {
        const itemPath = path.join(dirPath, item.name);
        const stats = await fs.stat(itemPath);
        const result = {
          name: item.name,
          path: itemPath.replace(/\\/g, "/"),
          type: item.isDirectory() ? "directory" : "file",
          isOpen: false,
        };

        if (item.isDirectory()) {
          const children = await getDirectoryContents(itemPath);
          return { ...result, children };
        }

        return result;
      }),
    );

    return contents.sort((a, b) => {
      // Directories first, then files
      if (a.type === "directory" && b.type === "file") return -1;
      if (a.type === "file" && b.type === "directory") return 1;
      // Then alphabetically
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error("Error reading directory:", error);
    return [];
  }
}

export async function GET() {
  try {
    const workspaceRoot = process.cwd();
    const files = await getDirectoryContents(workspaceRoot);
    return NextResponse.json(files);
  } catch (error) {
    console.error("Error in GET /api/files:", error);
    return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { type, parentPath, name } = await request.json();
    const newPath = path.join(parentPath, name);

    if (type === "directory") {
      await fs.mkdir(newPath, { recursive: true });
    } else {
      await fs.writeFile(newPath, "");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in POST /api/files:", error);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { path: itemPath } = await request.json();

    const stats = await fs.stat(itemPath);
    if (stats.isDirectory()) {
      await fs.rm(itemPath, { recursive: true });
    } else {
      await fs.unlink(itemPath);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/files:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { oldPath, newName } = await request.json();
    const newPath = path.join(path.dirname(oldPath), newName);

    await fs.rename(oldPath, newPath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in PATCH /api/files:", error);
    return NextResponse.json({ error: "Failed to rename item" }, { status: 500 });
  }
}
