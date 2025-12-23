"use client";

import { useState, useEffect } from "react";
import {
    Lightbulb,
    ArrowLeft,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    Target,
    Sparkles,
    Filter,
    ChevronRight,
    Award,
    BarChart3,
    Zap,
    Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface NicheResult {
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

interface DiscoveryResponse {
    niches: NicheResult[];
    totalAnalyzed: number;
    averageScore: number;
    topCategory: string;
    categories: string[];
}

const TIER_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    S: { bg: "bg-gradient-to-r from-yellow-500/20 to-amber-500/20", text: "text-yellow-400", border: "border-yellow-500/50", glow: "shadow-yellow-500/20" },
    A: { bg: "bg-gradient-to-r from-purple-500/20 to-violet-500/20", text: "text-purple-400", border: "border-purple-500/50", glow: "shadow-purple-500/20" },
    B: { bg: "bg-gradient-to-r from-blue-500/20 to-cyan-500/20", text: "text-blue-400", border: "border-blue-500/50", glow: "shadow-blue-500/20" },
    C: { bg: "bg-gradient-to-r from-green-500/20 to-emerald-500/20", text: "text-green-400", border: "border-green-500/50", glow: "shadow-green-500/20" },
    D: { bg: "bg-gray-500/20", text: "text-gray-400", border: "border-gray-500/50", glow: "shadow-gray-500/20" },
};

const CATEGORY_ICONS: Record<string, string> = {
    Technology: "💻",
    Lifestyle: "🌿",
    Sustainability: "♻️",
    Business: "💼",
    Health: "🏥",
    Food: "🍽️",
    Travel: "✈️",
    Creative: "🎨",
    Finance: "💰",
    Fashion: "👗",
};

export default function DiscoverPage() {
    const [results, setResults] = useState<DiscoveryResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [categories, setCategories] = useState<string[]>([]);
    const [expandedNiche, setExpandedNiche] = useState<string | null>(null);

    // Fetch niches
    const fetchNiches = async (category: string = "") => {
        setIsLoading(true);
        toast.loading("Discovering niches...", { id: "discover" });

        try {
            const response = await axios.get("http://127.0.0.1:8001/discover", {
                params: { category, limit: 20 }
            });
            setResults(response.data);
            setCategories(response.data.categories || []);
            toast.success(`Found ${response.data.niches.length} potential niches!`, { id: "discover" });
        } catch (error) {
            console.error("Discovery failed:", error);
            toast.error("Failed to discover niches", { id: "discover" });
        } finally {
            setIsLoading(false);
        }
    };

    // Load on mount
    useEffect(() => {
        fetchNiches();
    }, []);

    // Handle category change
    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category);
        fetchNiches(category);
    };

    // Get tier badge
    const getTierBadge = (tier: string) => {
        const colors = TIER_COLORS[tier] || TIER_COLORS.D;
        return (
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold ${colors.bg} ${colors.text} ${colors.border} border-2 shadow-lg ${colors.glow}`}>
                {tier}
            </div>
        );
    };

    // Score breakdown component
    const ScoreBreakdown = ({ niche }: { niche: NicheResult }) => (
        <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-card/50 rounded-lg">
            <div>
                <div className="text-xs text-muted-foreground mb-1">Opportunity (40%)</div>
                <div className="flex items-center gap-2">
                    <Progress value={niche.opportunityScore} className="h-2" />
                    <span className="text-sm font-mono">{niche.opportunityScore}</span>
                </div>
            </div>
            <div>
                <div className="text-xs text-muted-foreground mb-1">Growth (25%)</div>
                <div className="flex items-center gap-2">
                    <Progress value={niche.growthScore} className="h-2" />
                    <span className="text-sm font-mono">{niche.growthScore}</span>
                </div>
            </div>
            <div>
                <div className="text-xs text-muted-foreground mb-1">Competition (20%)</div>
                <div className="flex items-center gap-2">
                    <Progress value={niche.competitionScore} className="h-2" />
                    <span className="text-sm font-mono">{niche.competitionScore}</span>
                </div>
            </div>
            <div>
                <div className="text-xs text-muted-foreground mb-1">Market Gap (15%)</div>
                <div className="flex items-center gap-2">
                    <Progress value={niche.marketGapScore} className="h-2" />
                    <span className="text-sm font-mono">{niche.marketGapScore}</span>
                </div>
            </div>
        </div>
    );

    return (
        <TooltipProvider>
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
                                    <Lightbulb className="h-6 w-6 text-yellow-400" />
                                    Niche Discovery
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    AI-powered niche recommendations with statistical analysis
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={() => fetchNiches(selectedCategory)}
                                disabled={isLoading}
                                className="gap-2"
                            >
                                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </header>

                <main className="container mx-auto px-6 py-8">
                    {/* Category Filter */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-semibold">Filter by Category:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant={selectedCategory === "" ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleCategoryChange("")}
                            >
                                All Categories
                            </Button>
                            {categories.map((cat) => (
                                <Button
                                    key={cat}
                                    variant={selectedCategory === cat ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handleCategoryChange(cat)}
                                    className="gap-1"
                                >
                                    <span>{CATEGORY_ICONS[cat] || "📦"}</span>
                                    {cat}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Summary Stats */}
                    {results && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <Card className="bg-card/50 border-border/50">
                                <CardContent className="pt-4">
                                    <div className="text-sm text-muted-foreground">Niches Analyzed</div>
                                    <div className="text-3xl font-bold">{results.totalAnalyzed}</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-yellow-500/10 border-yellow-500/30">
                                <CardContent className="pt-4">
                                    <div className="text-sm text-yellow-400">S-Tier Niches</div>
                                    <div className="text-3xl font-bold text-yellow-400">
                                        {results.niches.filter(n => n.tier === "S").length}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-purple-500/10 border-purple-500/30">
                                <CardContent className="pt-4">
                                    <div className="text-sm text-purple-400">Average Score</div>
                                    <div className="text-3xl font-bold text-purple-400">{results.averageScore}</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-primary/10 border-primary/30">
                                <CardContent className="pt-4">
                                    <div className="text-sm text-primary">Top Category</div>
                                    <div className="text-xl font-bold text-primary flex items-center gap-2">
                                        <span>{CATEGORY_ICONS[results.topCategory] || "📦"}</span>
                                        {results.topCategory}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Scoring Methodology */}
                    <Card className="mb-8 bg-card/30 border-border/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Info className="h-4 w-4" />
                                Scoring Methodology
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-cyan-500"></div>
                                    <span><strong>Opportunity (40%)</strong>: Demand/Supply ratio</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-green-500"></div>
                                    <span><strong>Growth (25%)</strong>: Trend momentum</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-purple-500"></div>
                                    <span><strong>Competition (20%)</strong>: Market saturation</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-amber-500"></div>
                                    <span><strong>Market Gap (15%)</strong>: Untapped potential</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Results Grid */}
                    {isLoading ? (
                        <div className="text-center py-16">
                            <RefreshCw className="h-12 w-12 mx-auto animate-spin text-primary mb-4" />
                            <p className="text-muted-foreground">Analyzing market data...</p>
                        </div>
                    ) : results && results.niches.length > 0 ? (
                        <div className="space-y-4">
                            <AnimatePresence>
                                {results.niches.map((niche, index) => {
                                    const tierColor = TIER_COLORS[niche.tier] || TIER_COLORS.D;
                                    const isExpanded = expandedNiche === niche.keyword;

                                    return (
                                        <motion.div
                                            key={niche.keyword}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <Card
                                                className={`${tierColor.bg} ${tierColor.border} border-2 cursor-pointer hover:shadow-lg transition-all ${tierColor.glow}`}
                                                onClick={() => setExpandedNiche(isExpanded ? null : niche.keyword)}
                                            >
                                                <CardContent className="py-4">
                                                    <div className="flex items-center gap-4">
                                                        {/* Tier Badge */}
                                                        {getTierBadge(niche.tier)}

                                                        {/* Main Info */}
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h3 className="text-lg font-bold">{niche.keyword}</h3>
                                                                <Badge variant="outline" className="text-xs">
                                                                    {CATEGORY_ICONS[niche.category]} {niche.category}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                                <span className={niche.growth >= 0 ? 'text-green-400' : 'text-red-400'}>
                                                                    {niche.growth >= 0 ? <TrendingUp className="inline h-3 w-3 mr-1" /> : <TrendingDown className="inline h-3 w-3 mr-1" />}
                                                                    {niche.growth >= 0 ? '+' : ''}{niche.growth}%
                                                                </span>
                                                                <span>Demand: {niche.demand}</span>
                                                                <span>Supply: {niche.supply.toLocaleString()}</span>
                                                            </div>
                                                        </div>

                                                        {/* Score */}
                                                        <div className="text-right">
                                                            <div className={`text-3xl font-bold ${tierColor.text}`}>
                                                                {niche.finalScore}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {niche.confidence}% confidence
                                                            </div>
                                                        </div>

                                                        {/* Recommendation */}
                                                        <div className="hidden md:block text-right min-w-[140px]">
                                                            <Badge className={`${tierColor.bg} ${tierColor.text} ${tierColor.border}`}>
                                                                {niche.recommendation}
                                                            </Badge>
                                                        </div>

                                                        {/* Expand Icon */}
                                                        <ChevronRight className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                    </div>

                                                    {/* Expanded Content */}
                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                            >
                                                                <ScoreBreakdown niche={niche} />
                                                                <div className="mt-4 flex gap-2">
                                                                    <Link href={`/?search=${encodeURIComponent(niche.keyword)}`}>
                                                                        <Button size="sm" className="gap-2">
                                                                            <BarChart3 className="h-4 w-4" />
                                                                            Deep Analysis
                                                                        </Button>
                                                                    </Link>
                                                                    <Button variant="outline" size="sm" className="gap-2">
                                                                        <Target className="h-4 w-4" />
                                                                        Add to Watchlist
                                                                    </Button>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="text-center py-16 text-muted-foreground">
                            <Lightbulb className="h-16 w-16 mx-auto mb-4 opacity-50" />
                            <h3 className="text-xl font-semibold mb-2">No niches found</h3>
                            <p>Try selecting a different category</p>
                        </div>
                    )}

                    {/* Legend */}
                    <div className="mt-8 p-4 bg-card/30 rounded-lg">
                        <h3 className="text-sm font-semibold mb-3">Tier Legend:</h3>
                        <div className="flex flex-wrap gap-4">
                            {Object.entries(TIER_COLORS).map(([tier, colors]) => (
                                <div key={tier} className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded flex items-center justify-center font-bold ${colors.bg} ${colors.text} ${colors.border} border`}>
                                        {tier}
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                        {tier === "S" ? "75+ (Highly Recommended)" :
                                            tier === "A" ? "60-74 (Recommended)" :
                                                tier === "B" ? "45-59 (Worth Exploring)" :
                                                    tier === "C" ? "30-44 (Moderate)" : "0-29 (Low Priority)"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </TooltipProvider>
    );
}
