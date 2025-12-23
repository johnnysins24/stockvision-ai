# StockVision AI - Stop All Services
# Run this script to stop all running services

Write-Host "============================================" -ForegroundColor Red
Write-Host "  🛑 Stopping StockVision AI Services" -ForegroundColor Red
Write-Host "============================================" -ForegroundColor Red
Write-Host ""

# Stop processes on port 8001 (Backend)
Write-Host "🔧 Stopping Backend (Port 8001)..." -ForegroundColor Yellow
try {
    $backend = Get-NetTCPConnection -LocalPort 8001 -ErrorAction SilentlyContinue
    if ($backend) {
        $backend | ForEach-Object { 
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
        }
        Write-Host "   ✅ Backend stopped" -ForegroundColor Green
    } else {
        Write-Host "   ℹ️  Backend was not running" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ℹ️  Backend was not running" -ForegroundColor Gray
}

# Stop processes on port 3000 (Frontend)
Write-Host "🎨 Stopping Frontend (Port 3000)..." -ForegroundColor Yellow
try {
    $frontend = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($frontend) {
        $frontend | ForEach-Object { 
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
        }
        Write-Host "   ✅ Frontend stopped" -ForegroundColor Green
    } else {
        Write-Host "   ℹ️  Frontend was not running" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ℹ️  Frontend was not running" -ForegroundColor Gray
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Red
Write-Host "  🛑 All services stopped" -ForegroundColor Red
Write-Host "============================================" -ForegroundColor Red
