# 🚀 StockVision AI - Image Stock Market Research Tool

<div align="center">
  <img src="https://img.shields.io/badge/version-2.0.0-blue.svg" alt="Version" />
  <img src="https://img.shields.io/badge/Next.js-15-black.svg" alt="Next.js" />
  <img src="https://img.shields.io/badge/FastAPI-Python-green.svg" alt="FastAPI" />
  <img src="https://img.shields.io/badge/license-MIT-yellow.svg" alt="License" />
</div>

## 📋 Overview

StockVision AI is an intelligent market research tool for stock photographers and content creators. It analyzes demand and supply across multiple stock photography platforms to identify lucrative market opportunities.

## ✨ Features

### 🔍 Multi-Source Market Analysis
- **Adobe Stock** - Premium market leader (40% weight)
- **Shutterstock** - High volume platform (35% weight)
- **Pexels** - Free stock platform (15% weight)
- **Unsplash** - Free premium photos (10% weight)

### 📊 Statistical Scoring
- **Opportunity Score**: Demand/Supply ratio × 10,000
- **Blue Ocean Detection**: Score ≥ 1,000 (Low competition, high opportunity)
- **Red Ocean Warning**: Score < 300 (High competition, saturated market)

### 📈 Trend Forecasting
- Google Trends integration for demand analysis
- 7-day Prophet-style predictions with confidence intervals
- Historical trend data (12 months)
- Trend direction detection (Rising/Stable/Falling)

### 💡 Niche Discovery
- AI-powered niche recommendations
- 10 categories with 100+ keyword suggestions
- Statistical tier scoring (S/A/B/C/D)
- Weighted scoring algorithm:
  - Opportunity (40%)
  - Growth Potential (25%)
  - Competition Index (20%)
  - Market Gap (15%)

### 🛠️ Additional Features
- Batch keyword processing (comma-separated)
- Smart caching with 24-hour expiry
- CSV export functionality
- Search history tracking
- Watchlist with localStorage persistence
- Real-time notifications (Blue Ocean/Red Ocean alerts)

## 🖥️ Screenshots

### Dashboard
- Clean, modern dark mode interface
- Real-time keyword analysis
- Interactive trend charts

### Market Analysis
- Multi-keyword comparison
- Sparkline trend visualization
- Sortable data table

### Niche Discovery
- Category-based filtering
- Tier-ranked recommendations
- Score breakdown details

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- pip (Python package manager)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/stockvision-ai.git
cd stockvision-ai
```

2. **Install Frontend dependencies**
```bash
npm install
```

3. **Install Backend dependencies**
```bash
cd backend
pip install -r requirements.txt
```

4. **Start the Backend**
```bash
cd backend
python main.py
```

5. **Start the Frontend** (new terminal)
```bash
npm run dev
```

6. **Open your browser**
```
http://localhost:3000
```

## 📁 Project Structure

```
stockvision-ai/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Main dashboard
│   ├── analysis/          # Market Analysis page
│   ├── discover/          # Niche Discovery page
│   └── settings/          # Settings page
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   └── trend-chart.tsx   # Trend visualization
├── lib/                  # Utilities
│   └── data.ts          # API functions & types
├── backend/             # Python FastAPI backend
│   ├── main.py         # API server
│   ├── requirements.txt # Python dependencies
│   └── research_cache.db # SQLite cache
└── public/             # Static assets
```

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/analyze` | GET | Analyze keyword with multi-source data |
| `/trending` | GET | Get trending keywords |
| `/discover` | GET | Discover high-potential niches |
| `/export` | GET | Export all cached data as CSV |
| `/history` | GET | Get search history |
| `/sources` | GET | Get data sources configuration |
| `/cache` | DELETE | Clear all cached data |

## 🛡️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Shadcn UI** - Premium component library
- **Recharts** - Chart visualization
- **Framer Motion** - Smooth animations
- **Sonner** - Toast notifications
- **Axios** - HTTP client

### Backend
- **FastAPI** - High-performance Python API
- **Uvicorn** - ASGI server
- **PyTrends** - Google Trends API
- **BeautifulSoup4** - Web scraping
- **SQLite** - Lightweight database

## 📊 Scoring Algorithm

### Opportunity Score
```
Score = (Demand / Supply) × 10,000
```

### Niche Score (Weighted)
```
Final Score = 
  (Opportunity × 0.40) +
  (Growth × 0.25) +
  (Competition × 0.20) +
  (MarketGap × 0.15)
```

### Tier Classification
| Tier | Score Range | Recommendation |
|------|-------------|----------------|
| S | 75+ | Highly Recommended |
| A | 60-74 | Recommended |
| B | 45-59 | Worth Exploring |
| C | 30-44 | Moderate Potential |
| D | 0-29 | Low Priority |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Google Trends for demand data
- Adobe Stock, Shutterstock, Pexels, Unsplash for supply insights
- Shadcn UI for beautiful components
- Vercel for Next.js

---

<div align="center">
  Made with ❤️ by StockVision Team
</div>
# Project
# Project
# Project
# stockvision-ai
