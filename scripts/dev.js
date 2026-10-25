const path = require("path");
const { spawn } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const BACKEND_DIR = path.join(ROOT_DIR, "backend");
const FRONTEND_DIR = path.join(ROOT_DIR, "frontend");

const isWin = process.platform === "win32";
const venvPython = isWin
  ? path.join(BACKEND_DIR, ".venv", "Scripts", "python.exe")
  : path.join(BACKEND_DIR, ".venv", "bin", "python");

console.log("==================================================");
console.log("  Launching DueWise Full-Stack App...             ");
console.log("==================================================");
console.log("  FastAPI:  http://localhost:8000");
console.log("  Next.js:  http://localhost:3000\n");

// 1. Launch FastAPI backend
const backend = spawn(
  venvPython,
  ["-m", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"],
  {
    cwd: BACKEND_DIR,
    stdio: "inherit",
    shell: true,
  }
);

// 2. Launch Next.js frontend
const npmCmd = isWin ? "npm.cmd" : "npm";
const frontend = spawn(npmCmd, ["run", "dev"], {
  cwd: FRONTEND_DIR,
  stdio: "inherit",
  shell: true,
});

function cleanup() {
  console.log("\nShutting down services...");
  try {
    backend.kill();
  } catch {}
  try {
    frontend.kill();
  } catch {}
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
