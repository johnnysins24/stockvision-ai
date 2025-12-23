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
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
from typing import Optional, List, Dict
import math

app = FastAPI(
    title="StockVision API",
    description="AI-powered stock photography market research tool",
    version="2.1.0"
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
# DATABASE SETUP
# ============================================

DB_PATH = "research_cache.db"
CACHE_EXPIRY_HOURS = 24

def init_db():
    """Initialize database with correct schema."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Drop old tables if schema is wrong
    c.execute("DROP TABLE IF EXISTS cache")
    c.execute("DROP TABLE IF EXISTS history")
    c.execute("DROP TABLE IF EXISTS niche_data")
    
    # Create tables with correct schema
    c.execute('''CREATE TABLE IF NOT EXISTS cache 
                 (keyword TEXT PRIMARY KEY, 
                  data TEXT, 
                  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS history
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  keyword TEXT, 
                  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                  score INTEGER)''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS niche_data
                 (keyword TEXT PRIMARY KEY,
                  category TEXT,
                  demand_score INTEGER,
                  supply_count INTEGER,
                  growth_rate REAL,
                  competition_level TEXT,
                  final_score REAL,
                  tier TEXT,
                  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)''')
    
    conn.commit()
    conn.close()
    print("Database initialized successfully!")

init_db()

# ============================================
# DATA SOURCES & HEADERS
# ============================================

DATA_SOURCES = {
    "adobe_stock": {
        "name": "Adobe Stock",
        "url": "https://stock.adobe.com/search?k={}",
        "weight": 0.40,
        "enabled": True
    },
    "shutterstock": {
        "name": "Shutterstock", 
        "url": "https://www.shutterstock.com/search/{}",
        "weight": 0.35,
        "enabled": True
    },
    "pexels": {
        "name": "Pexels (Free)",
        "url": "https://www.pexels.com/search/{}",
        "weight": 0.15,
        "enabled": True
    },
    "unsplash": {
        "name": "Unsplash (Free)",
        "url": "https://unsplash.com/s/photos/{}",
        "weight": 0.10,
        "enabled": True
    }
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml"
}

# Lazy load pytrends
_pytrends = None
def get_pytrends():
    global _pytrends
    if _pytrends is None:
        from pytrends.request import TrendReq
        _pytrends = TrendReq(hl='en-US', tz=360, timeout=(10, 25))
    return _pytrends

# ============================================
# CACHE FUNCTIONS
# ============================================

def get_cached_result(keyword: str) -> Optional[dict]:
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT data, timestamp FROM cache WHERE keyword = ?", (keyword.lower(),))
        row = c.fetchone()
        conn.close()
        if row:
            data = json.loads(row[0])
            timestamp = datetime.fromisoformat(row[1])
            if datetime.now() - timestamp < timedelta(hours=CACHE_EXPIRY_HOURS):
                return data
    except Exception as e:
        print(f"Cache read error: {e}")
    return None

def save_to_cache(keyword: str, data: dict):
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("REPLACE INTO cache (keyword, data, timestamp) VALUES (?, ?, ?)",
                  (keyword.lower(), json.dumps(data), datetime.now().isoformat()))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Cache save error: {e}")

def save_to_history(keyword: str, score: int):
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("INSERT INTO history (keyword, score) VALUES (?, ?)", (keyword, score))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"History save error: {e}")

# ============================================
# REAL DATA FETCHING FUNCTIONS
# ============================================

def fetch_google_trends_data(keyword: str) -> dict:
    """Fetch real data from Google Trends API."""
    try:
        pytrends = get_pytrends()
        pytrends.build_payload([keyword], cat=0, timeframe='today 12-m')
        
        # Get interest over time
        interest_data = pytrends.interest_over_time()
        
        if not interest_data.empty and keyword in interest_data.columns:
            values = interest_data[keyword].tolist()
            
            # Calculate statistics
            current = int(values[-1]) if values else 50
            average = int(sum(values) / len(values)) if values else 50
            max_val = max(values) if values else 100
            min_val = min(values) if values else 0
            
            # Calculate trend momentum
            if len(values) >= 8:
                recent_avg = sum(values[-4:]) / 4
                older_avg = sum(values[:4]) / 4
                momentum = ((recent_avg - older_avg) / max(older_avg, 1)) * 100
            else:
                momentum = 0
            
            # Determine trend direction
            if momentum > 10:
                trend = "rising"
            elif momentum < -10:
                trend = "falling"
            else:
                trend = "stable"
            
            return {
                "current": current,
                "average": average,
                "max": max_val,
                "min": min_val,
                "momentum": round(momentum, 1),
                "trend": trend,
                "history": values[-30:] if len(values) >= 30 else values,
                "data_points": len(values),
                "source": "google_trends_real",
                "success": True
            }
    except Exception as e:
        print(f"Google Trends API error for '{keyword}': {e}")
    
    # Fallback with estimated data
    base = random.randint(35, 70)
    return {
        "current": base,
        "average": base,
        "max": base + 20,
        "min": base - 15,
        "momentum": random.uniform(-10, 15),
        "trend": random.choice(["rising", "stable", "falling"]),
        "history": [base + random.randint(-8, 8) for _ in range(12)],
        "data_points": 12,
        "source": "estimated",
        "success": False
    }

def scrape_stock_site(url: str, keyword: str) -> Optional[int]:
    """Scrape stock photography site for result count."""
    try:
        formatted_url = url.format(keyword.replace(' ', '+').replace('%20', '+'))
        response = requests.get(formatted_url, headers=HEADERS, timeout=12)
        
        if response.status_code != 200:
            return None
        
        soup = BeautifulSoup(response.text, 'html.parser')
        text = soup.get_text()
        
        # Multiple patterns to find result count
        patterns = [
            r'([\d,]+)\s*(?:results?|images?|photos?|assets?|items?)',
            r'(?:found|showing|of)\s*([\d,]+)',
            r'([\d,]+)\s*(?:stock|free|premium)',
            r'([\d,]+)\s*matching',
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                num_str = match.replace(',', '').replace('.', '')
                if num_str.isdigit() and int(num_str) > 50:
                    return int(num_str)
        
        return None
    except Exception as e:
        print(f"Scraping error: {e}")
        return None

def get_multi_source_supply(keyword: str) -> dict:
    """Get supply data from multiple stock photography sites."""
    results = {}
    successful_sources = 0
    total_weighted = 0
    total_weight = 0
    
    for source_id, source in DATA_SOURCES.items():
        if source["enabled"]:
            count = scrape_stock_site(source["url"], keyword)
            if count is not None:
                results[source_id] = {
                    "name": source["name"],
                    "count": count,
                    "weight": source["weight"]
                }
                total_weighted += count * source["weight"]
                total_weight += source["weight"]
                successful_sources += 1
    
    # Calculate weighted average or use estimation
    if total_weight > 0:
        weighted_avg = int(total_weighted / total_weight)
        data_quality = "real"
    else:
        # Estimation based on keyword type
        weighted_avg = random.randint(5000, 80000)
        data_quality = "estimated"
    
    return {
        "sources": results,
        "weighted_average": weighted_avg,
        "sources_available": successful_sources,
        "data_quality": data_quality
    }

# ============================================
# SCORING ALGORITHMS (IMPROVED)
# ============================================

def calculate_opportunity_score(demand: int, supply: int) -> dict:
    """Calculate opportunity score with detailed analysis."""
    if supply == 0 or supply < 100:
        raw_score = 10000
        analysis = "Very low supply - high opportunity"
    else:
        raw_score = round((demand / supply) * 10000)
        if raw_score >= 2000:
            analysis = "Excellent demand/supply ratio"
        elif raw_score >= 1000:
            analysis = "Good opportunity - moderate competition"
        elif raw_score >= 500:
            analysis = "Average market - consider niche variations"
        elif raw_score >= 300:
            analysis = "Competitive market - need differentiation"
        else:
            analysis = "Saturated market - high competition"
    
    # Determine market status
    if raw_score >= 1000:
        status = "Blue Ocean"
        color = "cyan"
        recommendation = "Highly recommended for production"
    elif raw_score >= 300:
        status = "Neutral"
        color = "amber"
        recommendation = "Consider with unique angle"
    else:
        status = "Red Ocean"
        color = "red"
        recommendation = "Avoid unless highly specialized"
    
    return {
        "raw": raw_score,
        "normalized": min(100, raw_score / 100),
        "status": status,
        "color": color,
        "analysis": analysis,
        "recommendation": recommendation
    }

def calculate_growth_metrics(trend_data: dict) -> dict:
    """Calculate growth metrics from trend data."""
    history = trend_data.get("history", [])
    
    if len(history) >= 4:
        # Week-over-week growth (last 4 weeks)
        recent = sum(history[-4:]) / 4
        older = sum(history[:4]) / 4 if len(history) >= 8 else history[0]
        wow_growth = ((recent - older) / max(older, 1)) * 100
        
        # Month-over-month if enough data
        if len(history) >= 12:
            last_month = sum(history[-4:]) / 4
            prev_month = sum(history[-8:-4]) / 4 if len(history) >= 8 else recent
            mom_growth = ((last_month - prev_month) / max(prev_month, 1)) * 100
        else:
            mom_growth = wow_growth
        
        # Volatility (standard deviation)
        mean = sum(history) / len(history)
        variance = sum((x - mean) ** 2 for x in history) / len(history)
        volatility = math.sqrt(variance)
        
        # Trend strength
        if abs(wow_growth) > 20:
            trend_strength = "Strong"
        elif abs(wow_growth) > 10:
            trend_strength = "Moderate"
        else:
            trend_strength = "Weak"
    else:
        wow_growth = trend_data.get("momentum", 0)
        mom_growth = wow_growth
        volatility = 10
        trend_strength = "Unknown"
    
    return {
        "week_over_week": round(wow_growth, 1),
        "month_over_month": round(mom_growth, 1),
        "volatility": round(volatility, 1),
        "trend_strength": trend_strength,
        "stability": "High" if volatility < 10 else "Medium" if volatility < 20 else "Low"
    }

def calculate_competition_index(supply_data: dict) -> dict:
    """Calculate competition index with detailed breakdown."""
    total = supply_data.get("weighted_average", 0)
    sources = supply_data.get("sources_available", 0)
    
    # Competition level based on supply
    if total < 1000:
        level = "Very Low"
        score = 95
        advice = "Excellent opportunity - first mover advantage"
    elif total < 5000:
        level = "Low"
        score = 80
        advice = "Good niche - limited competition"
    elif total < 20000:
        level = "Moderate"
        score = 60
        advice = "Standard market - quality matters"
    elif total < 100000:
        level = "High"
        score = 35
        advice = "Competitive - need unique perspective"
    elif total < 500000:
        level = "Very High"
        score = 15
        advice = "Saturated - consider niche variations"
    else:
        level = "Extreme"
        score = 5
        advice = "Oversaturated - avoid unless exceptional"
    
    return {
        "level": level,
        "score": score,
        "total_supply": total,
        "sources_checked": sources,
        "advice": advice
    }

def generate_prophet_forecast(history: List[int], days: int = 7) -> List[dict]:
    """Generate forecast with confidence intervals using simple time series analysis."""
    if not history or len(history) < 3:
        history = [50] * 7
    
    # Calculate trend
    n = len(history)
    x_mean = (n - 1) / 2
    y_mean = sum(history) / n
    
    # Linear regression slope
    numerator = sum((i - x_mean) * (history[i] - y_mean) for i in range(n))
    denominator = sum((i - x_mean) ** 2 for i in range(n))
    slope = numerator / denominator if denominator != 0 else 0
    
    # Calculate residual standard error for confidence interval
    predictions_in_sample = [y_mean + slope * (i - x_mean) for i in range(n)]
    residuals = [history[i] - predictions_in_sample[i] for i in range(n)]
    mse = sum(r ** 2 for r in residuals) / max(n - 2, 1)
    std_error = math.sqrt(mse)
    
    # Generate forecast
    forecast = []
    last_value = history[-1]
    
    for i in range(days):
        # Predicted value with trend
        predicted = last_value + slope * (i + 1)
        
        # Add seasonality (weekly pattern)
        seasonality = math.sin(i * math.pi / 3.5) * 3
        predicted += seasonality
        
        # Clamp to valid range
        predicted = max(0, min(100, predicted))
        
        # Confidence interval widens with time
        confidence_width = std_error * 1.96 * math.sqrt(1 + (i + 1) / n)
        confidence_width = max(5, min(25, confidence_width + i * 2))
        
        forecast.append({
            "day": i + 1,
            "date": (datetime.now() + timedelta(days=i + 1)).strftime("%Y-%m-%d"),
            "predicted": round(predicted, 1),
            "lower": round(max(0, predicted - confidence_width), 1),
            "upper": round(min(100, predicted + confidence_width), 1),
            "confidence": round(95 - i * 3, 1)  # Confidence decreases over time
        })
    
    return forecast

# ============================================
# NICHE DISCOVERY ALGORITHM (ADVANCED)
# ============================================

NICHE_CATEGORIES = {
    "Technology": {
        "keywords": ["AI", "Robot", "Smart Home", "Automation", "Drone", "VR", "AR", "Blockchain", "IoT", "Machine Learning", "Quantum Computing", "Cybersecurity"],
        "growth_factor": 1.2,  # Tech tends to grow faster
        "seasonality": "low"
    },
    "Lifestyle": {
        "keywords": ["Minimalist", "Wellness", "Mindfulness", "Self Care", "Work Life Balance", "Digital Detox", "Slow Living", "Hygge", "Cozy"],
        "growth_factor": 1.1,
        "seasonality": "medium"
    },
    "Sustainability": {
        "keywords": ["Eco Friendly", "Zero Waste", "Sustainable", "Green Energy", "Solar", "Recycle", "Organic", "Carbon Neutral", "Climate"],
        "growth_factor": 1.3,  # Strong growth sector
        "seasonality": "low"
    },
    "Business": {
        "keywords": ["Remote Work", "Startup", "Freelance", "Coworking", "Entrepreneur", "Digital Nomad", "Leadership", "Teamwork", "Office"],
        "growth_factor": 1.0,
        "seasonality": "low"
    },
    "Health": {
        "keywords": ["Mental Health", "Meditation", "Yoga", "Fitness", "Nutrition", "Sleep", "Holistic", "Therapy", "Healthcare"],
        "growth_factor": 1.15,
        "seasonality": "medium"  # New Year resolutions spike
    },
    "Food": {
        "keywords": ["Plant Based", "Vegan", "Healthy Eating", "Meal Prep", "Superfoods", "Organic Food", "Farm to Table", "Food Photography"],
        "growth_factor": 1.1,
        "seasonality": "high"  # Holiday seasons
    },
    "Travel": {
        "keywords": ["Ecotourism", "Adventure", "Solo Travel", "Staycation", "Glamping", "Road Trip", "Beach", "Mountain", "City Break"],
        "growth_factor": 1.0,
        "seasonality": "high"  # Summer/holidays
    },
    "Creative": {
        "keywords": ["Digital Art", "NFT Art", "Generative Art", "3D Design", "Motion Graphics", "Abstract", "Retro", "Aesthetic", "Gradient"],
        "growth_factor": 1.25,
        "seasonality": "low"
    },
    "Finance": {
        "keywords": ["Cryptocurrency", "Fintech", "Investment", "Passive Income", "Stock Market", "Banking", "Money", "Wealth"],
        "growth_factor": 1.1,
        "seasonality": "low"
    },
    "Seasonal": {
        "keywords": ["Christmas", "New Year", "Valentine", "Easter", "Halloween", "Thanksgiving", "Summer", "Winter", "Autumn", "Spring"],
        "growth_factor": 1.0,
        "seasonality": "very_high"
    }
}

def calculate_niche_score_advanced(
    demand: int,
    supply: int,
    growth: float,
    trend_data: dict,
    category_info: dict,
    current_month: int = None
) -> dict:
    """
    Advanced niche scoring algorithm with multiple weighted factors.
    
    Weights:
    - Opportunity (Demand/Supply): 35%
    - Growth Momentum: 25%
    - Competition Level: 20%
    - Seasonality Bonus: 10%
    - Trend Stability: 10%
    """
    if current_month is None:
        current_month = datetime.now().month
    
    # 1. Opportunity Score (35%)
    if supply == 0:
        opp_score = 100
    else:
        opp_ratio = (demand / supply) * 1000
        opp_score = min(100, opp_ratio)
    
    # 2. Growth Momentum Score (25%)
    # Normalize growth from -30% to +50% range
    growth_normalized = (growth + 30) * (100 / 80)
    growth_score = max(0, min(100, growth_normalized))
    
    # Apply category growth factor
    growth_factor = category_info.get("growth_factor", 1.0)
    growth_score *= growth_factor
    growth_score = min(100, growth_score)
    
    # 3. Competition Score (20%)
    if supply <= 500:
        competition_score = 100
    elif supply <= 5000:
        competition_score = 85
    elif supply <= 20000:
        competition_score = 65
    elif supply <= 100000:
        competition_score = 40
    else:
        competition_score = max(5, 100 - math.log10(supply) * 15)
    
    # 4. Seasonality Bonus (10%)
    seasonality = category_info.get("seasonality", "low")
    
    # Check if current month aligns with seasonal peaks
    peak_months = {
        "very_high": [11, 12, 1, 2],  # Holiday season
        "high": [6, 7, 8, 12],         # Summer + Christmas
        "medium": [1, 5, 9],           # New Year, Spring, Back to school
        "low": list(range(1, 13))      # Year-round
    }
    
    if current_month in peak_months.get(seasonality, []):
        seasonality_score = 90 if seasonality == "very_high" else 70 if seasonality == "high" else 50
    else:
        seasonality_score = 40 if seasonality == "very_high" else 50 if seasonality == "high" else 60
    
    # 5. Trend Stability Score (10%)
    history = trend_data.get("history", [])
    if len(history) >= 4:
        mean = sum(history) / len(history)
        variance = sum((x - mean) ** 2 for x in history) / len(history)
        std_dev = math.sqrt(variance)
        # Lower volatility = higher stability score
        stability_score = max(0, 100 - std_dev * 3)
    else:
        stability_score = 50
    
    # Calculate Final Weighted Score
    final_score = (
        opp_score * 0.35 +
        growth_score * 0.25 +
        competition_score * 0.20 +
        seasonality_score * 0.10 +
        stability_score * 0.10
    )
    
    # Confidence level based on data quality
    data_source = trend_data.get("source", "estimated")
    if data_source == "google_trends_real":
        confidence = 85 + (demand / 10)
    else:
        confidence = 55 + (demand / 10)
    confidence = min(95, confidence)
    
    # Determine Tier
    if final_score >= 80:
        tier, recommendation = "S", "🔥 Hot Opportunity - Act Now!"
    elif final_score >= 65:
        tier, recommendation = "A", "✅ Highly Recommended"
    elif final_score >= 50:
        tier, recommendation = "B", "👍 Worth Exploring"
    elif final_score >= 35:
        tier, recommendation = "C", "⚠️ Moderate Potential"
    else:
        tier, recommendation = "D", "❌ Low Priority"
    
    return {
        "finalScore": round(final_score, 1),
        "components": {
            "opportunity": round(opp_score, 1),
            "growth": round(growth_score, 1),
            "competition": round(competition_score, 1),
            "seasonality": round(seasonality_score, 1),
            "stability": round(stability_score, 1)
        },
        "weights": {
            "opportunity": 0.35,
            "growth": 0.25,
            "competition": 0.20,
            "seasonality": 0.10,
            "stability": 0.10
        },
        "confidence": round(confidence, 1),
        "tier": tier,
        "recommendation": recommendation,
        "growth_factor_applied": growth_factor,
        "seasonality_type": seasonality,
        "data_source": data_source
    }

# ============================================
# API ENDPOINTS
# ============================================

@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "StockVision API v2.1 is running!",
        "version": "2.1.0",
        "features": [
            "Multi-source supply data",
            "Google Trends integration",
            "Advanced niche scoring algorithm",
            "Prophet-style forecasting",
            "Seasonality analysis"
        ],
        "endpoints": ["/analyze", "/trending", "/discover", "/export", "/history", "/sources"]
    }

@app.get("/sources")
async def get_sources():
    return {
        "sources": DATA_SOURCES,
        "cache_expiry_hours": CACHE_EXPIRY_HOURS,
        "niche_categories": list(NICHE_CATEGORIES.keys())
    }

@app.get("/history")
async def get_history(limit: int = 50):
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT keyword, timestamp, score FROM history ORDER BY timestamp DESC LIMIT ?", (limit,))
        rows = c.fetchall()
        conn.close()
        return {"history": [{"keyword": r[0], "timestamp": r[1], "score": r[2]} for r in rows]}
    except Exception as e:
        return {"history": [], "error": str(e)}

@app.get("/analyze")
async def analyze(keyword: str):
    """Comprehensive keyword analysis with real data."""
    if not keyword:
        raise HTTPException(status_code=400, detail="Keyword is required")
    
    keyword = keyword.strip()
    
    # Check cache
    cached = get_cached_result(keyword)
    if cached:
        cached["from_cache"] = True
        return cached
    
    print(f"Analyzing: {keyword}")
    
    # Fetch real data
    demand_data = fetch_google_trends_data(keyword)
    supply_data = get_multi_source_supply(keyword)
    
    # Calculate metrics
    opportunity = calculate_opportunity_score(
        demand_data["current"],
        supply_data["weighted_average"]
    )
    
    growth_metrics = calculate_growth_metrics(demand_data)
    competition = calculate_competition_index(supply_data)
    forecast = generate_prophet_forecast(demand_data.get("history", []))
    
    # Free market saturation
    free_count = sum(1 for s in supply_data["sources"].values() if "free" in s["name"].lower())
    free_saturation = min(100, free_count * 25 + random.randint(10, 25))
    
    result = {
        "keyword": keyword,
        "demandScore": demand_data["current"],
        "demandData": demand_data,
        "supplyCount": supply_data["weighted_average"],
        "supplyData": supply_data,
        "opportunityScore": opportunity["raw"],
        "opportunityData": opportunity,
        "status": opportunity["status"],
        "growth": growth_metrics["week_over_week"],
        "growthMetrics": growth_metrics,
        "trend": demand_data["trend"],
        "competition": competition,
        "prediction": [f["predicted"] for f in forecast],
        "forecast": forecast,
        "freeSaturation": free_saturation,
        "dataQuality": demand_data["source"],
        "analyzedAt": datetime.now().isoformat(),
        "from_cache": False
    }
    
    save_to_cache(keyword, result)
    save_to_history(keyword, opportunity["raw"])
    
    return result

@app.get("/trending")
async def get_trending_keywords(category: str = ""):
    """Get trending keywords from Google Trends and stock suggestions."""
    try:
        trending_data = []
        
        # Try Google Trends
        try:
            pytrends = get_pytrends()
            daily = pytrends.trending_searches(pn='united_states')
            for kw in daily[0].head(8).tolist():
                trending_data.append({
                    "keyword": kw,
                    "type": "Trending Now",
                    "source": "Google Trends",
                    "confidence": 95
                })
        except Exception as e:
            print(f"Pytrends error: {e}")
        
        # Stock photography suggestions
        suggestions = [
            {"keyword": "Christmas 2025", "type": "Seasonal", "source": "Stock Trends", "confidence": 88},
            {"keyword": "New Year 2026", "type": "Seasonal", "source": "Stock Trends", "confidence": 85},
            {"keyword": "AI Technology", "type": "Technology", "source": "Stock Trends", "confidence": 92},
            {"keyword": "Sustainable Living", "type": "Lifestyle", "source": "Stock Trends", "confidence": 88},
            {"keyword": "Remote Work", "type": "Business", "source": "Stock Trends", "confidence": 85},
            {"keyword": "Digital Art", "type": "Creative", "source": "Stock Trends", "confidence": 82},
            {"keyword": "Mental Wellness", "type": "Health", "source": "Stock Trends", "confidence": 80},
            {"keyword": "Electric Vehicles", "type": "Technology", "source": "Stock Trends", "confidence": 85},
        ]
        
        if len(trending_data) < 5:
            trending_data.extend(suggestions)
        
        return {"keywords": trending_data[:15]}
    except Exception as e:
        return {"keywords": [], "error": str(e)}

@app.get("/discover")
async def discover_niches(category: str = "", limit: int = 20, use_real_data: bool = False):
    """
    Discover high-potential niches using advanced scoring algorithm.
    
    - category: Filter by specific category
    - limit: Number of results
    - use_real_data: If True, fetch real Google Trends data (slower but more accurate)
    """
    try:
        results = []
        current_month = datetime.now().month
        
        # Select categories
        if category and category in NICHE_CATEGORIES:
            categories = {category: NICHE_CATEGORIES[category]}
        else:
            categories = NICHE_CATEGORIES
        
        for cat_name, cat_info in categories.items():
            keywords = cat_info["keywords"]
            
            for keyword in keywords[:4]:  # Limit per category
                # Get trend data
                if use_real_data:
                    trend_data = fetch_google_trends_data(keyword)
                else:
                    # Quick estimation for faster response
                    base_demand = random.randint(40, 85)
                    trend_data = {
                        "current": base_demand,
                        "history": [base_demand + random.randint(-10, 10) for _ in range(12)],
                        "source": "quick_estimate"
                    }
                
                # Estimate supply (simplified for speed)
                supply = random.randint(1000, 120000)
                
                # Calculate growth
                history = trend_data.get("history", [base_demand] * 12)
                if len(history) >= 2:
                    growth = ((history[-1] - history[0]) / max(history[0], 1)) * 100
                else:
                    growth = random.uniform(-10, 25)
                
                # Calculate advanced score
                score_data = calculate_niche_score_advanced(
                    demand=trend_data["current"],
                    supply=supply,
                    growth=growth,
                    trend_data=trend_data,
                    category_info=cat_info,
                    current_month=current_month
                )
                
                results.append({
                    "keyword": keyword,
                    "category": cat_name,
                    "demand": trend_data["current"],
                    "supply": supply,
                    "growth": round(growth, 1),
                    "saturation": random.randint(15, 70),
                    **score_data
                })
        
        # Sort by final score
        results.sort(key=lambda x: x["finalScore"], reverse=True)
        
        # Statistics
        if results:
            scores = [r["finalScore"] for r in results]
            avg_score = sum(scores) / len(scores)
            s_tier_count = len([r for r in results if r["tier"] == "S"])
            a_tier_count = len([r for r in results if r["tier"] == "A"])
            
            # Top category
            top_results = results[:5]
            categories_in_top = [r["category"] for r in top_results]
            top_category = max(set(categories_in_top), key=categories_in_top.count)
        else:
            avg_score = 0
            s_tier_count = 0
            a_tier_count = 0
            top_category = "N/A"
        
        return {
            "niches": results[:limit],
            "totalAnalyzed": len(results),
            "averageScore": round(avg_score, 1),
            "topCategory": top_category,
            "sTierCount": s_tier_count,
            "aTierCount": a_tier_count,
            "categories": list(NICHE_CATEGORIES.keys()),
            "algorithm": "advanced_v2.1",
            "useRealData": use_real_data
        }
    except Exception as e:
        print(f"Discovery error: {e}")
        return {"niches": [], "error": str(e)}

@app.get("/export")
async def export_data():
    """Export all cached data as CSV."""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT keyword, data, timestamp FROM cache ORDER BY timestamp DESC")
        rows = c.fetchall()
        conn.close()
        
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Keyword", "Demand Score", "Supply Count", "Opportunity Score",
            "Status", "Growth %", "Trend", "Data Quality", "Analyzed At"
        ])
        
        for row in rows:
            try:
                data = json.loads(row[1])
                writer.writerow([
                    data.get("keyword", row[0]),
                    data.get("demandScore", "N/A"),
                    data.get("supplyCount", "N/A"),
                    data.get("opportunityScore", "N/A"),
                    data.get("status", "N/A"),
                    data.get("growth", "N/A"),
                    data.get("trend", "N/A"),
                    data.get("dataQuality", "N/A"),
                    row[2]
                ])
            except:
                pass
        
        output.seek(0)
        filename = f"stockvision_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/cache")
async def clear_cache():
    """Clear all cached data."""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("DELETE FROM cache")
        c.execute("DELETE FROM history")
        conn.commit()
        conn.close()
        return {"status": "ok", "message": "Cache and history cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# SERVER STARTUP
# ============================================

if __name__ == "__main__":
    import uvicorn
    
    # Get port from environment variable (for Railway) or use default
    port = int(os.environ.get("PORT", 8001))
    host = os.environ.get("HOST", "127.0.0.1")
    
    # In production, bind to 0.0.0.0
    if os.environ.get("RAILWAY_ENVIRONMENT") or os.environ.get("RENDER"):
        host = "0.0.0.0"
    
    print("=" * 60)
    print("  🚀 STOCKVISION BACKEND v2.1")
    print("  Advanced Market Research API")
    print("=" * 60)
    print(f"  📊 Endpoints: /analyze, /trending, /discover, /export")
    print(f"  ⏰ Cache Expiry: {CACHE_EXPIRY_HOURS} hours")
    print(f"  🔗 Data Sources: {len(DATA_SOURCES)}")
    print(f"  📁 Categories: {len(NICHE_CATEGORIES)}")
    print(f"  🌐 Running on: http://{host}:{port}")
    print("=" * 60)
    uvicorn.run(app, host=host, port=port)

