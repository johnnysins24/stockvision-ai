# StockVision AI - Start All Services
# Run this script from the project root folder

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  🚀 Starting StockVision AI Services" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Get the script directory (project root)
$ProjectRoot = Split-Path -Parent $PSScriptRoot
if (-not $ProjectRoot) {
    $ProjectRoot = Get-Location
}

Write-Host "📁 Project Root: $ProjectRoot" -ForegroundColor Yellow
Write-Host ""

# Start Backend
Write-Host "🔧 Starting Backend (FastAPI)..." -ForegroundColor Green
$BackendPath = Join-Path $ProjectRoot "backend"

if (Test-Path (Join-Path $BackendPath "main.py")) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$BackendPath'; python main.py" -WindowStyle Normal
    Write-Host "   ✅ Backend started on http://127.0.0.1:8001" -ForegroundColor Green
} else {
    Write-Host "   ❌ Backend main.py not found!" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# Start Frontend
Write-Host "🎨 Starting Frontend (Next.js)..." -ForegroundColor Blue

if (Test-Path (Join-Path $ProjectRoot "package.json")) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectRoot'; npm run dev" -WindowStyle Normal
    Write-Host "   ✅ Frontend started on http://localhost:3000" -ForegroundColor Blue
} else {
    Write-Host "   ❌ package.json not found!" -ForegroundColor Red
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  🎉 All services started!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Dashboard:    http://localhost:3000" -ForegroundColor White
Write-Host "🔌 API:          http://127.0.0.1:8001" -ForegroundColor White
Write-Host "📖 API Docs:     http://127.0.0.1:8001/docs" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to open the dashboard..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Start-Process "http://localhost:3000"
