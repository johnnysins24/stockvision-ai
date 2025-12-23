"use client";

import { useState, useEffect } from "react";
import {
    TrendingUp,
    TrendingDown,
    RefreshCw,
    ArrowLeft,
    Search,
    BarChart3,
    Zap,
    Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
    CartesianGrid,
} from "recharts";
import { analyzeKeyword, type TrendData } from "@/lib/data";
import { toast } from "sonner";

// Mini Sparkline Component
const Sparkline = ({ data, color = "#22c55e" }: { data: number[]; color?: string }) => {
    const chartData = data.map((value, index) => ({ day: index + 1, value }));

    return (
        <div className="h-12 w-32">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2}
                        fill={`url(#gradient-${color})`}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

// Stock photography categories
const STOCK_CATEGORIES = [
    "Business", "Technology", "Nature", "Food", "Travel",
    "Lifestyle", "Health", "Fashion", "Sports", "Abstract",
    "Animals", "Architecture", "Education", "Entertainment", "Finance"
];

// Popular search terms for stock photography
const POPULAR_KEYWORDS = [
    "Christmas", "Winter", "New Year", "Cyberpunk", "AI Robot",
    "Remote Work", "Sustainable", "Electric Car", "Minimalist", "Vintage",
    "Sunset Beach", "Coffee Shop", "Yoga Meditation", "City Skyline", "Forest",
    "Team Meeting", "Startup", "Cryptocurrency", "Smart Home", "Wellness"
];

export default function MarketAnalysis() {
    const [keywords, setKeywords] = useState<string[]>([]);
    const [results, setResults] = useState<TrendData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    const [sortBy, setSortBy] = useState<"score" | "demand" | "supply" | "growth">("score");
    const [filterStatus, setFilterStatus] = useState<"all" | "Blue Ocean" | "Red Ocean" | "Neutral">("all");

    // Load initial data
    useEffect(() => {
        const savedResults = localStorage.getItem("stockvision_analysis");
        if (savedResults) {
            setResults(JSON.parse(savedResults));
        }
    }, []);

    // Analyze multiple keywords
    const analyzeMultiple = async (keywordList: string[]) => {
        setIsLoading(true);
        toast.loading("Analyzing keywords...", { id: "batch-analyze" });

        const newResults: TrendData[] = [...results];

        for (const keyword of keywordList) {
            if (!newResults.some(r => r.keyword.toLowerCase() === keyword.toLowerCase())) {
                try {
                    const result = await analyzeKeyword(keyword);
                    newResults.push(result);
                } catch (error) {
                    console.error(`Failed to analyze ${keyword}:`, error);
                }
            }
        }

        setResults(newResults);
        localStorage.setItem("stockvision_analysis", JSON.stringify(newResults));
        setIsLoading(false);
        toast.success(`Analyzed ${keywordList.length} keywords!`, { id: "batch-analyze" });
    };

    // Quick scan popular keywords
    const quickScan = () => {
        const randomKeywords = POPULAR_KEYWORDS
            .sort(() => Math.random() - 0.5)
            .slice(0, 5);
        analyzeMultiple(randomKeywords);
    };

    // Handle search
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchInput.trim()) return;

        const keywordList = searchInput.split(",").map(k => k.trim()).filter(k => k);
        analyzeMultiple(keywordList);
        setSearchInput("");
    };

    // Sort results
    const sortedResults = [...results].sort((a, b) => {
        switch (sortBy) {
            case "score": return b.opportunityScore - a.opportunityScore;
            case "demand": return b.demandScore - a.demandScore;
            case "supply": return a.supplyCount - b.supplyCount;
            case "growth": return b.growth - a.growth;
            default: return 0;
        }
    });

    // Filter results
    const filteredResults = filterStatus === "all"
        ? sortedResults
        : sortedResults.filter(r => r.status === filterStatus);

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case "Blue Ocean": return { bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/50" };
            case "Red Ocean": return { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/50" };
            default: return { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/50" };
        }
    };

    // Get chart color based on trend
    const getChartColor = (prediction: number[]) => {
        if (!prediction || prediction.length < 2) return "#22c55e";
        const trend = prediction[prediction.length - 1] - prediction[0];
        if (trend > 5) return "#22c55e"; // Green - rising
        if (trend < -5) return "#ef4444"; // Red - falling
        return "#eab308"; // Yellow - stable
    };

    // Summary stats
    const blueOceanCount = results.filter(r => r.status === "Blue Ocean").length;
    const redOceanCount = results.filter(r => r.status === "Red Ocean").length;
    const avgScore = results.length > 0
        ? Math.round(results.reduce((sum, r) => sum + r.opportunityScore, 0) / results.length)
        : 0;

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <BarChart3 className="h-6 w-6 text-primary" />
                                Market Analysis
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Analyze multiple keywords with trend forecasts
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={quickScan}
                            disabled={isLoading}
                            className="gap-2"
                        >
                            <Zap className="h-4 w-4" />
                            Quick Scan
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setResults([]);
                                localStorage.removeItem("stockvision_analysis");
                                toast.info("Cleared all results");
                            }}
                        >
                            Clear All
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                {/* Search Bar */}
                <div className="mb-8">
                    <form onSubmit={handleSearch} className="flex gap-4 max-w-3xl mx-auto">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Enter keywords (comma separated)..."
                                className="pl-12 py-6 text-lg bg-card border-border"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <Button type="submit" disabled={isLoading} className="px-8">
                            {isLoading ? <RefreshCw className="h-5 w-5 animate-spin" /> : "Analyze"}
                        </Button>
                    </form>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card className="bg-card/50 border-border/50">
                        <CardContent className="pt-4">
                            <div className="text-sm text-muted-foreground">Total Analyzed</div>
                            <div className="text-3xl font-bold">{results.length}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-cyan-500/10 border-cyan-500/30">
                        <CardContent className="pt-4">
                            <div className="text-sm text-cyan-400">Blue Ocean</div>
                            <div className="text-3xl font-bold text-cyan-400">{blueOceanCount}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-red-500/10 border-red-500/30">
                        <CardContent className="pt-4">
                            <div className="text-sm text-red-400">Red Ocean</div>
                            <div className="text-3xl font-bold text-red-400">{redOceanCount}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-primary/10 border-primary/30">
                        <CardContent className="pt-4">
                            <div className="text-sm text-primary">Avg. Score</div>
                            <div className="text-3xl font-bold text-primary">{avgScore}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters and Sort */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Filter:</span>
                        {["all", "Blue Ocean", "Red Ocean", "Neutral"].map((status) => (
                            <Button
                                key={status}
                                variant={filterStatus === status ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilterStatus(status as any)}
                                className="capitalize"
                            >
                                {status}
                            </Button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                        <span className="text-sm text-muted-foreground">Sort by:</span>
                        {[
                            { key: "score", label: "Opp. Score" },
                            { key: "demand", label: "Demand" },
                            { key: "supply", label: "Supply" },
                            { key: "growth", label: "Growth" },
                        ].map(({ key, label }) => (
                            <Button
                                key={key}
                                variant={sortBy === key ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setSortBy(key as any)}
                            >
                                {label}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Results Table */}
                {filteredResults.length > 0 ? (
                    <div className="border border-border/50 rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-card/80">
                                <tr className="border-b border-border/50">
                                    <th className="text-left px-4 py-3 font-semibold">Keyword</th>
                                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                                    <th className="text-center px-4 py-3 font-semibold">7-Day Forecast</th>
                                    <th className="text-right px-4 py-3 font-semibold">Demand</th>
                                    <th className="text-right px-4 py-3 font-semibold">Supply</th>
                                    <th className="text-right px-4 py-3 font-semibold">Opp. Score</th>
                                    <th className="text-right px-4 py-3 font-semibold">Growth</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {filteredResults.map((result, index) => {
                                        const statusColor = getStatusColor(result.status);
                                        const chartColor = getChartColor(result.prediction);

                                        return (
                                            <motion.tr
                                                key={result.keyword}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="border-b border-border/30 hover:bg-card/50 transition-colors"
                                            >
                                                <td className="px-4 py-4">
                                                    <div className="font-medium">{result.keyword}</div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Badge
                                                        variant="outline"
                                                        className={`${statusColor.text} ${statusColor.border} ${statusColor.bg}`}
                                                    >
                                                        {result.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex justify-center">
                                                        <Sparkline data={result.prediction} color={chartColor} />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Progress
                                                            value={result.demandScore}
                                                            className="w-16 h-2"
                                                        />
                                                        <span className="font-mono text-sm w-8">{result.demandScore}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <span className="font-mono text-sm">
                                                        {result.supplyCount.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <span className={`font-bold ${result.opportunityScore >= 1000 ? 'text-cyan-400' :
                                                            result.opportunityScore < 300 ? 'text-red-400' : 'text-amber-400'
                                                        }`}>
                                                        {result.opportunityScore.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className={`flex items-center justify-end gap-1 ${result.growth >= 0 ? 'text-green-400' : 'text-red-400'
                                                        }`}>
                                                        {result.growth >= 0 ? (
                                                            <TrendingUp className="h-4 w-4" />
                                                        ) : (
                                                            <TrendingDown className="h-4 w-4" />
                                                        )}
                                                        <span className="font-mono text-sm">
                                                            {result.growth >= 0 ? '+' : ''}{result.growth}%
                                                        </span>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-16 text-muted-foreground">
                        <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-semibold mb-2">No data yet</h3>
                        <p className="mb-4">Enter keywords above or use Quick Scan to get started</p>
                        <Button onClick={quickScan} disabled={isLoading}>
                            <Zap className="h-4 w-4 mr-2" />
                            Start Quick Scan
                        </Button>
                    </div>
                )}

                {/* Quick Add Buttons */}
                {filteredResults.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                            Quick Add More Keywords:
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {POPULAR_KEYWORDS.filter(k => !results.some(r => r.keyword === k)).slice(0, 10).map((keyword) => (
                                <Badge
                                    key={keyword}
                                    variant="outline"
                                    className="cursor-pointer hover:bg-primary/20 transition-colors"
                                    onClick={() => analyzeMultiple([keyword])}
                                >
                                    + {keyword}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
