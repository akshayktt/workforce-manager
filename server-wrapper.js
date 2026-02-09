#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");

console.log("[Server Wrapper] Starting server...");

const server = spawn("npx", ["tsx", "server/index.ts"], {
  cwd: path.resolve(__dirname),
  stdio: "inherit",
  shell: process.platform === "win32",
});

server.on("close", (code, signal) => {
  console.log(`[Server Wrapper] Server exited with code ${code}, signal ${signal}`);
  process.exit(code || 0);
});

server.on("error", (error) => {
  console.error("[Server Wrapper] Server error:", error);
  process.exit(1);
});

// Handle process signals
["SIGTERM", "SIGINT"].forEach((signal) => {
  process.on(signal, () => {
    console.log(`[Server Wrapper] Received ${signal}, forwarding to server...`);
    server.kill(signal);
  });
});
