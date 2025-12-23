# 🚀 StockVision AI - Quick Start Guide

## 📁 Project Structure

```
image-stock-research/
├── 📂 app/                      # Next.js App Router
│   ├── page.tsx                 # Main Dashboard
│   ├── layout.tsx               # Root Layout
│   ├── globals.css              # Global Styles
│   ├── analysis/                # Market Analysis Page
│   ├── discover/                # Niche Discovery Page
│   └── settings/                # Settings Page
│
├── 📂 backend/                  # Python FastAPI Backend
│   ├── main.py                  # API Server (Port 8001)
│   ├── requirements.txt         # Python Dependencies
│   └── research_cache.db        # SQLite Cache Database
│
├── 📂 components/               # React Components
│   ├── ui/                      # Shadcn UI Components
│   └── trend-chart.tsx          # Trend Visualization
│
├── 📂 lib/                      # Utilities
│   ├── data.ts                  # API Functions & Types
│   └── utils.ts                 # Helper Functions
│
├── 📂 public/                   # Static Assets
│
├── 📂 scripts/                  # Helper Scripts
│   ├── start.ps1                # Start All Services
│   └── stop.ps1                 # Stop All Services
│
├── package.json                 # Node Dependencies
├── README.md                    # Full Documentation
└── QUICKSTART.md                # This File
```

## 🚀 Quick Start

### Option 1: Using PowerShell Script
```powershell
# Start both Frontend and Backend
.\scripts\start.ps1

# Stop all services
.\scripts\stop.ps1
```

### Option 2: Manual Start

**Terminal 1 - Backend:**
```powershell
cd backend
python main.py
```

**Terminal 2 - Frontend:**
```powershell
npm run dev
```

## 🌐 Access Points

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://127.0.0.1:8001 |
| **API Docs** | http://127.0.0.1:8001/docs |

## 📊 Features Quick Reference

| Page | Description | URL |
|------|-------------|-----|
| Dashboard | Main research interface | `/` |
| Market Analysis | Multi-keyword comparison | `/analysis` |
| Niche Discovery | AI-powered niche finder | `/discover` |
| Settings | Configure data sources | `/settings` |

## 🔧 Common Commands

```powershell
# Install dependencies
npm install                      # Frontend
pip install -r backend/requirements.txt  # Backend

# Development
npm run dev                      # Start frontend dev server
python backend/main.py           # Start backend server

# Clear cache
# Go to Settings > Clear Cache in the UI
```

## 🆘 Troubleshooting

### Backend won't start
1. Check if port 8001 is in use: `netstat -ano | findstr :8001`
2. Kill the process: `Stop-Process -Id <PID> -Force`

### Frontend connection error
1. Ensure backend is running first
2. Check API at http://127.0.0.1:8001

### Google Trends Error 404
- This is normal - Google rate limits requests
- The app uses fallback data automatically
