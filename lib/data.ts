import axios from "axios";

// Use environment variable for production, fallback to localhost for development
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";

// ============================================
// INTERFACES
// ============================================

export interface TrendData {
    keyword: string;
    demandScore: number;
    supplyCount: number;
    opportunityScore: number;
    status: "Blue Ocean" | "Red Ocean" | "Neutral";
    growth: number;
    prediction: number[];
    freeSaturation?: number;
    trend?: string;
    from_cache?: boolean;
    analyzedAt?: string;
    // Enhanced data
    demandData?: {
        current: number;
        average: number;
        max: number;
        min: number;
        trend: string;
        history: number[];
        source: string;
    };
    supplyData?: {
        sources: Record<string, { name: string; count: number; weight: number }>;
        weighted_average: number;
        sources_available: number;
    };
    competition?: {
        level: string;
        score: number;
        total_supply: number;
    };
    forecast?: Array<{
        day: number;
        predicted: number;
        lower: number;
        upper: number;
    }>;
}

export interface TrendingKeyword {
    keyword: string;
    type: string;
    value?: number;
    source: string;
    confidence?: number;
}

export interface NicheResult {
    keyword: string;
    category: string;
    demand: number;
    supply: number;
    growth: number;
    saturation: number;
    finalScore: number;
    opportunityScore: number;
    growthScore: number;
    competitionScore: number;
    marketGapScore: number;
    confidence: number;
    recommendation: string;
    tier: string;
}

export interface SearchHistory {
    keyword: string;
    timestamp: string;
    score: number;
}

// ============================================
// API FUNCTIONS
// ============================================

// Check API health
export const checkApiHealth = async (): Promise<boolean> => {
    try {
        const response = await axios.get(`${API_BASE}/`, { timeout: 5000 });
        return response.data.status === "ok";
    } catch {
        return false;
    }
};

// Fetch trending/popular keywords
export const fetchTrendingKeywords = async (category: string = ""): Promise<TrendingKeyword[]> => {
    try {
        const response = await axios.get(`${API_BASE}/trending`, {
            params: { category }
        });
        return response.data.keywords || [];
    } catch (error) {
        console.error("Failed to fetch trending keywords", error);
        return [
            { keyword: "Christmas 2025", type: "Seasonal", source: "Suggestion" },
            { keyword: "New Year 2026", type: "Seasonal", source: "Suggestion" },
            { keyword: "AI Technology", type: "Trending", source: "Suggestion" },
            { keyword: "Sustainable Energy", type: "Trending", source: "Suggestion" },
            { keyword: "Remote Work", type: "Business", source: "Suggestion" },
        ];
    }
};

// Analyze keyword with multi-source data
export const analyzeKeyword = async (keyword: string): Promise<TrendData> => {
    try {
        const response = await axios.get(`${API_BASE}/analyze`, {
            params: { keyword },
            timeout: 30000 // 30 second timeout for scraping
        });
        return response.data;
    } catch (error) {
        console.error("Backend connection failed, using fallback mock data", error);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const demandScore = Math.floor(Math.random() * 60) + 40;
        const supplyCount = Math.floor(Math.random() * 50000) + 500;
        const score = Math.round((demandScore / supplyCount) * 10000);
        const status = score >= 1000 ? "Blue Ocean" : score < 300 ? "Red Ocean" : "Neutral";

        return {
            keyword,
            demandScore,
            supplyCount,
            opportunityScore: score,
            status,
            growth: Number((Math.random() * 20 - 5).toFixed(1)),
            prediction: Array.from({ length: 7 }, (_, i) =>
                Math.floor(demandScore + (Math.random() * 10 - 2) * i)
            ),
            freeSaturation: Math.floor(Math.random() * 60) + 20,
            trend: Math.random() > 0.5 ? "rising" : "stable",
        };
    }
};

// Discover niches
export const discoverNiches = async (category: string = "", limit: number = 20): Promise<{
    niches: NicheResult[];
    totalAnalyzed: number;
    averageScore: number;
    topCategory: string;
    categories: string[];
}> => {
    try {
        const response = await axios.get(`${API_BASE}/discover`, {
            params: { category, limit }
        });
        return response.data;
    } catch (error) {
        console.error("Discovery failed", error);
        return {
            niches: [],
            totalAnalyzed: 0,
            averageScore: 0,
            topCategory: "N/A",
            categories: []
        };
    }
};

// Get search history
export const getSearchHistory = async (limit: number = 50): Promise<SearchHistory[]> => {
    try {
        const response = await axios.get(`${API_BASE}/history`, {
            params: { limit }
        });
        return response.data.history || [];
    } catch (error) {
        console.error("Failed to fetch history", error);
        return [];
    }
};

// Export data as CSV
export const exportData = async (): Promise<void> => {
    try {
        const response = await axios.get(`${API_BASE}/export`, {
            responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `stockvision_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        console.error("Export failed", error);
        throw error;
    }
};

// Clear cache
export const clearCache = async (): Promise<boolean> => {
    try {
        await axios.delete(`${API_BASE}/cache`);
        return true;
    } catch (error) {
        console.error("Failed to clear cache", error);
        return false;
    }
};

// Get data sources
export const getDataSources = async (): Promise<Record<string, any>> => {
    try {
        const response = await axios.get(`${API_BASE}/sources`);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch sources", error);
        return {};
    }
};

// ============================================
// MOCK DATA FOR FALLBACK
// ============================================

export const MOCK_TRENDS: TrendData[] = [
    {
        keyword: "Cyberpunk City",
        demandScore: 85,
        supplyCount: 1240,
        opportunityScore: 685,
        status: "Neutral",
        growth: 12.5,
        prediction: [85, 87, 89, 92, 90, 94, 98],
        trend: "rising",
    },
    {
        keyword: "Minimalist Coffee",
        demandScore: 70,
        supplyCount: 5600,
        opportunityScore: 125,
        status: "Red Ocean",
        growth: -2.3,
        prediction: [70, 68, 67, 65, 66, 64, 62],
        trend: "falling",
    },
    {
        keyword: "Niche Thai Food",
        demandScore: 65,
        supplyCount: 150,
        opportunityScore: 4333,
        status: "Blue Ocean",
        growth: 24.0,
        prediction: [65, 70, 75, 82, 85, 88, 92],
        trend: "rising",
    },
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
};

export const getStatusColor = (status: string): { bg: string; text: string; border: string } => {
    switch (status) {
        case "Blue Ocean":
            return { bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/50" };
        case "Red Ocean":
            return { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/50" };
        default:
            return { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/50" };
    }
};

export const getTrendIcon = (trend: string): "up" | "down" | "stable" => {
    if (trend === "rising") return "up";
    if (trend === "falling") return "down";
    return "stable";
};
