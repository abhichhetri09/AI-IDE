import { WebSocket, WebSocketServer } from "ws";
import { spawn } from "child_process";
import os from "os";
import { headers } from "next/headers";

const wss = new WebSocketServer({ noServer: true });

const shells = {
  win32: { shell: "powershell.exe", args: [] },
  linux: { shell: "bash", args: [] },
  darwin: { shell: "bash", args: [] },
};

function initWebSocket(socket: WebSocket) {
  const platform = os.platform();
  const { shell, args } = shells[platform as keyof typeof shells];

  // Spawn shell process
  const proc = spawn(shell, args, {
    env: process.env,
    cwd: process.env.HOME || process.env.USERPROFILE,
  });

  // Handle incoming data from client
  socket.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString());
      if (message.type === "input") {
        proc.stdin.write(message.data);
      } else if (message.type === "resize") {
        // Handle resize if your shell supports it
        // For PowerShell, this might not have an effect
        process.stdout.write(`\x1b[8;${message.rows};${message.cols}t`);
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
  });

  // Send shell output to client
  proc.stdout.on("data", (data) => {
    if (socket.readyState === socket.OPEN) {
      socket.send(JSON.stringify({ type: "output", data: data.toString() }));
    }
  });

  proc.stderr.on("data", (data) => {
    if (socket.readyState === socket.OPEN) {
      socket.send(JSON.stringify({ type: "output", data: data.toString() }));
    }
  });

  // Clean up on close
  socket.on("close", () => {
    proc.kill();
  });

  proc.on("exit", () => {
    if (socket.readyState === socket.OPEN) {
      socket.close();
    }
  });
}

export function GET(req: Request) {
  const headersList = headers();
  const upgrade = headersList.get("upgrade");

  if (!upgrade || upgrade.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  try {
    // @ts-ignore - Next.js types don't include socket
    const socket = req.socket;

    // Create WebSocket connection
    wss.handleUpgrade(req, socket, Buffer.alloc(0), (ws) => {
      wss.emit("connection", ws);
      initWebSocket(ws);
    });

    // Return empty response to let Next.js know we're handling the upgrade
    return new Response(null, { status: 101 });
  } catch (error) {
    console.error("WebSocket setup error:", error);
    return new Response("WebSocket setup failed", { status: 500 });
  }
}
