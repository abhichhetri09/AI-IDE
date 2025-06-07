import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    const { sourcePath, targetPath } = await request.json();
    const sourceStats = await fs.stat(sourcePath);
    const targetStats = await fs.stat(targetPath);

    if (!targetStats.isDirectory()) {
      return NextResponse.json({ error: "Target must be a directory" }, { status: 400 });
    }

    const fileName = path.basename(sourcePath);
    const newPath = path.join(targetPath, fileName);

    if (sourcePath === newPath) {
      return NextResponse.json({ error: "Source and target are the same" }, { status: 400 });
    }

    await fs.rename(sourcePath, newPath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in POST /api/files/move:", error);
    return NextResponse.json({ error: "Failed to move item" }, { status: 500 });
  }
}
