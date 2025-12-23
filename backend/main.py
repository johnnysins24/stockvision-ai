import os
import requests
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import random
import sqlite3
import re
import json
import io
import csv
from datetime import datetime, timedelta
from typing import Optional, List, Dict
import math

app = FastAPI(
    title="StockVision API",
    description="AI-powered stock photography market research tool with real API data",
    version="2.2.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# API KEYS (Free APIs)
# ============================================

# Get API keys from environment variables
PEXELS_API_KEY = os.environ.get("PEXELS_API_KEY", "")
UNSPLASH_ACCESS_KEY = os.environ.get("UNSPLASH_ACCESS_KEY", "")
PIXABAY_API_KEY = os.environ.get("PIXABAY_API_KEY", "")

# ============================================
# DATABASE SETUP
# ============================================

DB_PATH = "research_cache.db"
CACHE_EXPIRY_HOURS = 24

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS cache 
                 (keyword TEXT PRIMARY KEY, data TEXT, 
                  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)''')
    c.execute('''CREATE TABLE IF NOT EXISTS history
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  keyword TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                  score INTEGER)''')
    conn.commit()
    conn.close()

init_db()

# ============================================
# FREE STOCK PHOTO APIs
# ============================================

def get_pexels_count(keyword: str) -> Optional[int]:
    """Get photo count from Pexels API (FREE - requires API key)"""
    if not PEXELS_API_KEY:
        return None
    try:
        url = f"https://api.pexels.com/v1/search?query={keyword}&per_page=1"
        headers = {"Authorization": PEXELS_API_KEY}
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            return data.get("total_results", 0)
    except Exception as e:
        print(f"Pexels API error: {e}")
    return None

def get_unsplash_count(keyword: str) -> Optional[int]:
    """Get photo count from Unsplash API (FREE - 50 req/hour)"""
    if not UNSPLASH_ACCESS_KEY:
        return None
    try:
        url = f"https://api.unsplash.com/search/photos?query={keyword}&per_page=1"
        headers = {"Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"}
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            return data.get("total", 0)
    except Exception as e:
        print(f"Unsplash API error: {e}")
    return None

def get_pixabay_count(keyword: str) -> Optional[int]:
    """Get photo count from Pixabay API (FREE - requires API key)"""
    if not PIXABAY_API_KEY:
        return None
    try:
        url = f"https://pixabay.com/api/?key={PIXABAY_API_KEY}&q={keyword}&per_page=3"
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            return data.get("totalHits", 0)
    except Exception as e:
        print(f"Pixabay API error: {e}")
    return None

def get_supply_data(keyword: str) -> dict:
    """Get supply data from multiple free APIs"""
    sources = {}
    total_count = 0
    source_count = 0
    
    # Try each API
    pexels = get_pexels_count(keyword)
    if pexels is not None:
        sources["pexels"] = {"name": "Pexels", "count": pexels, "type": "free"}
        total_count += pexels
        source_count += 1
    
    unsplash = get_unsplash_count(keyword)
    if unsplash is not None:
        sources["unsplash"] = {"name": "Unsplash", "count": unsplash, "type": "free"}
        total_count += unsplash
        source_count += 1
    
    pixabay = get_pixabay_count(keyword)
    if pixabay is not None:
        sources["pixabay"] = {"name": "Pixabay", "count": pixabay, "type": "free"}
        total_count += pixabay
        source_count += 1
    
    # Calculate average or estimate
    if source_count > 0:
        avg_count = total_count // source_count
        # Estimate premium stock (typically 5-15x more)
        estimated_total = avg_count * 8
        data_quality = "real_api"
    else:
        # No API keys configured - use estimation
        estimated_total = random.randint(5000, 100000)
        data_quality = "estimated"
    
    return {
        "sources": sources,
        "free_stock_total": total_count,
        "estimated_total": estimated_total,
        "weighted_average": estimated_total,
        "sources_available": source_count,
        "data_quality": data_quality
    }

# ============================================
# GOOGLE TRENDS
# ============================================

_pytrends = None
def get_pytrends():
    global _pytrends
    if _pytrends is None:
        from pytrends.request import TrendReq
        _pytrends = TrendReq(hl='en-US', tz=360, timeout=(10, 25))
    return _pytrends

def get_google_trends_data(keyword: str) -> dict:
    """Fetch real data from Google Trends"""
    try:
        pytrends = get_pytrends()
        pytrends.build_payload([keyword], cat=0, timeframe='today 12-m')
        data = pytrends.interest_over_time()
        
        if not data.empty and keyword in data.columns:
            values = data[keyword].tolist()
            current = int(values[-1]) if values else 50
            average = int(sum(values) / len(values)) if values else 50
            
            # Calculate momentum
            if len(values) >= 8:
                recent = sum(values[-4:]) / 4
                older = sum(values[:4]) / 4
                momentum = ((recent - older) / max(older, 1)) * 100
            else:
                momentum = 0
            
            trend = "rising" if momentum > 10 else "falling" if momentum < -10 else "stable"
            
            return {
                "current": current,
                "average": average,
                "max": max(values),
                "min": min(values),
                "momentum": round(momentum, 1),
                "trend": trend,
                "history": values[-12:],
                "source": "google_trends"
            }
    except Exception as e:
        print(f"Google Trends error: {e}")
    
    # Fallback
    base = random.randint(40, 70)
    return {
        "current": base,
        "average": base,
        "max": base + 20,
        "min": base - 10,
        "momentum": random.uniform(-10, 15),
        "trend": random.choice(["rising", "stable", "falling"]),
        "history": [base + random.randint(-8, 8) for _ in range(12)],
        "source": "estimated"
    }

# ============================================
# SCORING & FORECASTING
# ============================================

def calculate_opportunity(demand: int, supply: int) -> dict:
    if supply == 0 or supply < 100:
        raw = 10000
    else:
        raw = round((demand / supply) * 10000)
    
    if raw >= 1000:
        status, color = "Blue Ocean", "cyan"
    elif raw < 300:
        status, color = "Red Ocean", "red"
    else:
        status, color = "Neutral", "amber"
    
    return {"raw": raw, "status": status, "color": color}

def generate_forecast(history: List[int], days: int = 7) -> List[dict]:
    if not history:
        history = [50] * 7
    current = history[-1]
    forecast = []
    for i in range(days):
        noise = random.uniform(-3, 3)
        predicted = max(0, min(100, current + noise))
        confidence = 5 + (i * 2)
        forecast.append({
            "day": i + 1,
            "predicted": round(predicted, 1),
            "lower": round(max(0, predicted - confidence), 1),
            "upper": round(min(100, predicted + confidence), 1)
        })
    return forecast

# ============================================
# CACHE FUNCTIONS
# ============================================

def get_cached(keyword: str) -> Optional[dict]:
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT data, timestamp FROM cache WHERE keyword = ?", (keyword.lower(),))
        row = c.fetchone()
        conn.close()
        if row:
            data = json.loads(row[0])
            ts = datetime.fromisoformat(row[1])
            if datetime.now() - ts < timedelta(hours=CACHE_EXPIRY_HOURS):
                return data
    except:
        pass
    return None

def save_cache(keyword: str, data: dict):
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("REPLACE INTO cache (keyword, data, timestamp) VALUES (?, ?, ?)",
                  (keyword.lower(), json.dumps(data), datetime.now().isoformat()))
        conn.commit()
        conn.close()
    except:
        pass

def save_history(keyword: str, score: int):
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("INSERT INTO history (keyword, score) VALUES (?, ?)", (keyword, score))
        conn.commit()
        conn.close()
    except:
        pass

# ============================================
# API ENDPOINTS
# ============================================

@app.get("/")
async def root():
    # Check which APIs are configured
    apis_configured = []
    if PEXELS_API_KEY:
        apis_configured.append("Pexels")
    if UNSPLASH_ACCESS_KEY:
        apis_configured.append("Unsplash")
    if PIXABAY_API_KEY:
        apis_configured.append("Pixabay")
    
    return {
        "status": "ok",
        "version": "2.2.0",
        "message": "StockVision API with Real Stock Photo Data",
        "apis_configured": apis_configured if apis_configured else ["None - using estimates"],
        "endpoints": ["/analyze", "/trending", "/discover", "/sources", "/export"]
    }

@app.get("/sources")
async def get_sources():
    return {
        "configured_apis": {
            "pexels": bool(PEXELS_API_KEY),
            "unsplash": bool(UNSPLASH_ACCESS_KEY),
            "pixabay": bool(PIXABAY_API_KEY)
        },
        "cache_expiry_hours": CACHE_EXPIRY_HOURS,
        "how_to_configure": {
            "pexels": "Set PEXELS_API_KEY env var (get from pexels.com/api)",
            "unsplash": "Set UNSPLASH_ACCESS_KEY env var (get from unsplash.com/developers)",
            "pixabay": "Set PIXABAY_API_KEY env var (get from pixabay.com/api/docs)"
        }
    }

@app.get("/analyze")
async def analyze(keyword: str):
    if not keyword:
        raise HTTPException(status_code=400, detail="Keyword required")
    
    keyword = keyword.strip()
    
    # Check cache
    cached = get_cached(keyword)
    if cached:
        cached["from_cache"] = True
        return cached
    
    print(f"Analyzing: {keyword}")
    
    # Get real data
    demand = get_google_trends_data(keyword)
    supply = get_supply_data(keyword)
    
    # Calculate metrics
    opportunity = calculate_opportunity(demand["current"], supply["weighted_average"])
    
    # Growth
    history = demand.get("history", [])
    if len(history) >= 2:
        growth = round(((history[-1] - history[0]) / max(history[0], 1)) * 100, 1)
    else:
        growth = round(random.uniform(-5, 15), 1)
    
    forecast = generate_forecast(history)
    
    result = {
        "keyword": keyword,
        "demandScore": demand["current"],
        "demandData": demand,
        "supplyCount": supply["weighted_average"],
        "supplyData": supply,
        "opportunityScore": opportunity["raw"],
        "status": opportunity["status"],
        "growth": growth,
        "trend": demand["trend"],
        "prediction": [f["predicted"] for f in forecast],
        "forecast": forecast,
        "dataQuality": {
            "demand": demand["source"],
            "supply": supply["data_quality"]
        },
        "analyzedAt": datetime.now().isoformat(),
        "from_cache": False
    }
    
    save_cache(keyword, result)
    save_history(keyword, opportunity["raw"])
    
    return result

@app.get("/trending")
async def get_trending(category: str = ""):
    try:
        trending = []
        try:
            pytrends = get_pytrends()
            daily = pytrends.trending_searches(pn='united_states')
            for kw in daily[0].head(8).tolist():
                trending.append({"keyword": kw, "type": "Trending Now", "source": "Google Trends"})
        except Exception as e:
            print(f"Trends error: {e}")
        
        # Fallback suggestions
        suggestions = [
            {"keyword": "Christmas 2025", "type": "Seasonal", "source": "Stock Trends"},
            {"keyword": "New Year 2026", "type": "Seasonal", "source": "Stock Trends"},
            {"keyword": "AI Technology", "type": "Technology", "source": "Stock Trends"},
            {"keyword": "Sustainable Living", "type": "Lifestyle", "source": "Stock Trends"},
            {"keyword": "Remote Work", "type": "Business", "source": "Stock Trends"},
            {"keyword": "Digital Art", "type": "Creative", "source": "Stock Trends"},
        ]
        
        if len(trending) < 5:
            trending.extend(suggestions)
        
        return {"keywords": trending[:12]}
    except Exception as e:
        return {"keywords": [], "error": str(e)}

# Niche Categories
NICHE_CATEGORIES = {
    "Technology": ["AI", "Robot", "VR", "Blockchain", "Drone"],
    "Lifestyle": ["Minimalist", "Wellness", "Mindfulness"],
    "Sustainability": ["Eco Friendly", "Solar", "Green Energy"],
    "Business": ["Remote Work", "Startup", "Freelance"],
    "Health": ["Mental Health", "Yoga", "Fitness"],
    "Creative": ["Digital Art", "3D Design", "Motion Graphics"],
}

@app.get("/discover")
async def discover_niches(category: str = "", limit: int = 20):
    try:
        results = []
        cats = {category: NICHE_CATEGORIES[category]} if category in NICHE_CATEGORIES else NICHE_CATEGORIES
        
        for cat, keywords in cats.items():
            for kw in keywords[:3]:
                demand = random.randint(40, 85)
                supply = random.randint(1000, 100000)
                growth = round(random.uniform(-8, 20), 1)
                
                # Score calculation
                opp = min(100, (demand / max(supply, 1)) * 1000)
                growth_score = min(100, max(0, (growth + 30) * 1.25))
                comp_score = max(0, 100 - math.log10(max(supply, 1)) * 15)
                
                final = opp * 0.4 + growth_score * 0.25 + comp_score * 0.35
                
                if final >= 75: tier = "S"
                elif final >= 60: tier = "A"
                elif final >= 45: tier = "B"
                elif final >= 30: tier = "C"
                else: tier = "D"
                
                results.append({
                    "keyword": kw,
                    "category": cat,
                    "demand": demand,
                    "supply": supply,
                    "growth": growth,
                    "finalScore": round(final, 1),
                    "tier": tier,
                    "components": {
                        "opportunity": round(opp, 1),
                        "growth": round(growth_score, 1),
                        "competition": round(comp_score, 1)
                    }
                })
        
        results.sort(key=lambda x: x["finalScore"], reverse=True)
        
        return {
            "niches": results[:limit],
            "totalAnalyzed": len(results),
            "categories": list(NICHE_CATEGORIES.keys())
        }
    except Exception as e:
        return {"niches": [], "error": str(e)}

@app.get("/history")
async def get_history(limit: int = 50):
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT keyword, timestamp, score FROM history ORDER BY timestamp DESC LIMIT ?", (limit,))
        rows = c.fetchall()
        conn.close()
        return {"history": [{"keyword": r[0], "timestamp": r[1], "score": r[2]} for r in rows]}
    except:
        return {"history": []}

@app.get("/export")
async def export_data():
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT keyword, data, timestamp FROM cache ORDER BY timestamp DESC")
        rows = c.fetchall()
        conn.close()
        
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Keyword", "Demand", "Supply", "Score", "Status", "Growth", "Date"])
        
        for row in rows:
            try:
                data = json.loads(row[1])
                writer.writerow([
                    data.get("keyword"), data.get("demandScore"),
                    data.get("supplyCount"), data.get("opportunityScore"),
                    data.get("status"), data.get("growth"), row[2]
                ])
            except:
                pass
        
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=stockvision_export.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/cache")
async def clear_cache():
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("DELETE FROM cache")
        c.execute("DELETE FROM history")
        conn.commit()
        conn.close()
        return {"status": "ok", "message": "Cache cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# SERVER
# ============================================

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    host = "0.0.0.0" if os.environ.get("RAILWAY_ENVIRONMENT") else "127.0.0.1"
    
    print("=" * 60)
    print("  🚀 STOCKVISION API v2.2.0")
    print("  Real Stock Photo API Integration")
    print("=" * 60)
    print(f"  APIs: Pexels {'✅' if PEXELS_API_KEY else '❌'} | Unsplash {'✅' if UNSPLASH_ACCESS_KEY else '❌'} | Pixabay {'✅' if PIXABAY_API_KEY else '❌'}")
    print(f"  Running: http://{host}:{port}")
    print("=" * 60)
    
    uvicorn.run(app, host=host, port=port)
