# DueWise Windows Development Runner
Write-Host "Starting DueWise..." -ForegroundColor Cyan
Write-Host "FastAPI Backend: http://localhost:8000" -ForegroundColor Green
Write-Host "Next.js Frontend: http://localhost:3000" -ForegroundColor Green

# Start FastAPI backend job
$backendJob = Start-Process -FilePath "backend\.venv\Scripts\python.exe" -ArgumentList "-m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000" -WorkingDirectory "backend" -PassThru

# Start Next.js frontend job
$frontendJob = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WorkingDirectory "frontend" -PassThru

Write-Host "`nBoth services are running. Press Ctrl+C in this terminal to stop them." -ForegroundColor Yellow

try {
    Wait-Process -Id $backendJob.Id, $frontendJob.Id
} finally {
    Stop-Process -Id $backendJob.Id -ErrorAction SilentlyContinue
    Stop-Process -Id $frontendJob.Id -ErrorAction SilentlyContinue
    Write-Host "`nServices stopped." -ForegroundColor Red
}
