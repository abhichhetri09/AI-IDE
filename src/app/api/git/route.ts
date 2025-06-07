import { NextResponse } from "next/server";
import simpleGit from "simple-git";
import path from "path";

const git = simpleGit();

export async function GET() {
  try {
    const status = await git.status();
    return NextResponse.json(status);
  } catch (error) {
    console.error("Git status error:", error);
    return NextResponse.json({ error: "Failed to get Git status" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { action, path: filePath, message } = await request.json();

    switch (action) {
      case "stage":
        await git.add(filePath);
        break;
      case "unstage":
        await git.reset([filePath]);
        break;
      case "commit":
        if (!message) {
          return NextResponse.json({ error: "Commit message is required" }, { status: 400 });
        }
        await git.commit(message);
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const status = await git.status();
    return NextResponse.json({ message: "Operation successful", status });
  } catch (error) {
    console.error("Git operation error:", error);
    return NextResponse.json({ error: "Failed to perform Git operation" }, { status: 500 });
  }
}
