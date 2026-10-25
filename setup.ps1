# DueWise Windows Setup Script
Write-Host "Setting up DueWise..." -ForegroundColor Cyan

# Check Python
$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) {
    $py = Get-Command py -ErrorAction SilentlyContinue
}
if (-not $py) {
    Write-Error "Python 3.13 not found in PATH."
    exit 1
}

# Create virtual environment if needed
if (-not (Test-Path "backend\.venv\Scripts\python.exe")) {
    Write-Host "Creating Python virtual environment in backend\.venv..." -ForegroundColor Yellow
    & $py.Source -m venv backend\.venv
}

# Install backend dependencies
Write-Host "Installing Python packages..." -ForegroundColor Yellow
& "backend\.venv\Scripts\python.exe" -m pip install -r backend\requirements.txt

# Create directories
New-Item -ItemType Directory -Force -Path "backend\data" | Out-Null
New-Item -ItemType Directory -Force -Path "backend\storage" | Out-Null

# Setup backend .env if missing
if (-not (Test-Path "backend\.env")) {
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "Created backend\.env (Demo Mode enabled by default)." -ForegroundColor Green
}

# Setup frontend dependencies
Write-Host "Installing frontend packages..." -ForegroundColor Yellow
Push-Location frontend
npm install
if (-not (Test-Path ".env.local")) {
    Copy-Item ".env.example" ".env.local"
}
Pop-Location

Write-Host "`nSetup complete! Run './run-dev.ps1' or 'npm run dev' to start." -ForegroundColor Green
