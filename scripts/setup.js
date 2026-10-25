const fs = require("fs");
const path = require("path");
const { execSync, spawnSync } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const BACKEND_DIR = path.join(ROOT_DIR, "backend");
const FRONTEND_DIR = path.join(ROOT_DIR, "frontend");

console.log("==================================================");
console.log("  DueWise — Windows Setup & Initialization        ");
console.log("==================================================\n");

// 1. Check Node.js & npm
console.log("[1/6] Checking Node.js and npm prerequisites...");
try {
  const nodeVersion = process.version;
  const npmVersion = execSync("npm -v", { encoding: "utf8" }).trim();
  console.log(`  ✓ Node.js ${nodeVersion}`);
  console.log(`  ✓ npm v${npmVersion}`);
} catch (e) {
  console.error("  ✗ Error detecting Node.js or npm:", e.message);
  process.exit(1);
}

// 2. Check Python
console.log("\n[2/6] Checking Python 3.13+ prerequisite...");
let pythonCmd = "python";
try {
  const pyVer = execSync(`${pythonCmd} --version`, { encoding: "utf8" }).trim();
  console.log(`  ✓ Found: ${pyVer}`);
} catch {
  try {
    pythonCmd = "py";
    const pyVer = execSync(`${pythonCmd} --version`, { encoding: "utf8" }).trim();
    console.log(`  ✓ Found via py launcher: ${pyVer}`);
  } catch {
    console.error("  ✗ Python not found in PATH. Please install Python 3.13 from python.org.");
    process.exit(1);
  }
}

// 3. Virtual Environment Setup
console.log("\n[3/6] Setting up Python virtual environment...");
const venvDir = path.join(BACKEND_DIR, ".venv");
const isWin = process.platform === "win32";
const venvPython = isWin
  ? path.join(venvDir, "Scripts", "python.exe")
  : path.join(venvDir, "bin", "python");

if (!fs.existsSync(venvPython)) {
  console.log("  Creating .venv in backend/...");
  const venvRes = spawnSync(pythonCmd, ["-m", "venv", path.join("backend", ".venv")], {
    cwd: ROOT_DIR,
    stdio: "inherit",
    shell: true,
  });
  if (venvRes.status !== 0) {
    console.error("  ✗ Failed to create virtual environment.");
    process.exit(1);
  }
  console.log("  ✓ Virtual environment created.");
} else {
  console.log("  ✓ Virtual environment already exists.");
}

// 4. Install backend dependencies
console.log("\n[4/6] Installing backend dependencies...");
const pipRes = spawnSync(venvPython, ["-m", "pip", "install", "-r", "requirements.txt"], {
  cwd: BACKEND_DIR,
  stdio: "inherit",
  shell: true,
});
if (pipRes.status !== 0) {
  console.error("  ✗ Failed to install backend dependencies.");
  process.exit(1);
}
console.log("  ✓ Backend dependencies installed.");

// 5. Install frontend dependencies
console.log("\n[5/6] Installing frontend dependencies...");
const npmRes = spawnSync("npm", ["install"], {
  cwd: FRONTEND_DIR,
  stdio: "inherit",
  shell: true,
});
if (npmRes.status !== 0) {
  console.error("  ✗ Failed to install frontend dependencies.");
  process.exit(1);
}
console.log("  ✓ Frontend dependencies installed.");

// 6. Directories & Environment Configuration
console.log("\n[6/6] Verifying storage directories and environment files...");
const dataDir = path.join(BACKEND_DIR, "data");
const storageDir = path.join(BACKEND_DIR, "storage");
fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(storageDir, { recursive: true });
console.log("  ✓ backend/data and backend/storage confirmed.");

// backend/.env preservation
const backendEnv = path.join(BACKEND_DIR, ".env");
const backendEnvExample = path.join(BACKEND_DIR, ".env.example");
if (!fs.existsSync(backendEnv) && fs.existsSync(backendEnvExample)) {
  fs.copyFileSync(backendEnvExample, backendEnv);
  console.log("  ✓ Created backend/.env from .env.example (Demo Mode default).");
} else if (fs.existsSync(backendEnv)) {
  console.log("  ✓ Preserved existing backend/.env file.");
}

// frontend/.env.local
const frontendEnv = path.join(FRONTEND_DIR, ".env.local");
const frontendEnvExample = path.join(FRONTEND_DIR, ".env.example");
if (!fs.existsSync(frontendEnv) && fs.existsSync(frontendEnvExample)) {
  fs.copyFileSync(frontendEnvExample, frontendEnv);
  console.log("  ✓ Created frontend/.env.local.");
} else {
  console.log("  ✓ Preserved existing frontend/.env.local.");
}

console.log("\n==================================================");
console.log("  Setup complete! Run the app with:               ");
console.log("    npm run dev                                   ");
console.log("                                                  ");
console.log("  FastAPI:  http://localhost:8000                 ");
console.log("  Next.js:  http://localhost:3000                 ");
console.log("==================================================\n");
