"use client";

import { useState, useEffect } from "react";
import {
  Search,
  TrendingUp,
  Users,
  Activity,
  BarChart3,
  Database,
  RefreshCw,
  Zap,
  LayoutDashboard,
  Bell,
  Settings,
  Download,
  Lightbulb,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TrendChart } from "@/components/trend-chart";
import { MOCK_TRENDS, analyzeKeyword, fetchTrendingKeywords, exportData, clearCache, type TrendData, type TrendingKeyword } from "@/lib/data";
import { toast } from "sonner";
import Link from "next/link";

export default function Dashboard() {
  const [trends, setTrends] = useState<TrendData[]>(MOCK_TRENDS);
  const [savedTrends, setSavedTrends] = useState<TrendData[]>([]);
  const [trendingKeywords, setTrendingKeywords] = useState<TrendingKeyword[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);
  const [selectedTrend, setSelectedTrend] = useState<TrendData>(MOCK_TRENDS[0]);

  // Load saved trends and trending keywords on mount
  useEffect(() => {
    const saved = localStorage.getItem("stockvision_saved");
    if (saved) {
      setSavedTrends(JSON.parse(saved));
    }

    // Load trending keywords
    loadTrendingKeywords();
  }, []);

  const loadTrendingKeywords = async () => {
    setIsLoadingTrending(true);
    try {
      const keywords = await fetchTrendingKeywords();
      setTrendingKeywords(keywords);
    } catch (error) {
      console.error("Failed to load trending keywords", error);
    } finally {
      setIsLoadingTrending(false);
    }
  };

  const toggleSaveTrend = (trend: TrendData) => {
    const isSaved = savedTrends.some(t => t.keyword === trend.keyword);
    let newSaved;
    if (isSaved) {
      newSaved = savedTrends.filter(t => t.keyword !== trend.keyword);
      toast.info(`"${trend.keyword}" removed from watchlist`);
    } else {
      newSaved = [trend, ...savedTrends];
      toast.success(`"${trend.keyword}" added to watchlist!`);
    }
    setSavedTrends(newSaved);
    localStorage.setItem("stockvision_saved", JSON.stringify(newSaved));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsAnalyzing(true);
    toast.loading("Analyzing keywords...", { id: "search" });

    try {
      // Batch Processing Logic
      const keywords = searchTerm.split(',').map(k => k.trim()).filter(k => k);
      const results = await Promise.all(keywords.map(k => analyzeKeyword(k)));

      setTrends(prev => {
        const newKeywordSet = new Set(results.map(r => r.keyword));
        const filteredPrev = prev.filter(t => !newKeywordSet.has(t.keyword));
        return [...results, ...filteredPrev];
      });
      setSelectedTrend(results[0]);
      setSearchTerm("");

      // Check for Blue Ocean opportunities and show notifications
      const blueOceans = results.filter(r => r.status === "Blue Ocean");
      const redOceans = results.filter(r => r.status === "Red Ocean");

      toast.dismiss("search");

      if (blueOceans.length > 0) {
        toast.success(
          `🌊 Blue Ocean Found! ${blueOceans.map(b => `"${b.keyword}"`).join(", ")}`,
          {
            description: "High demand, low competition - Go create content now!",
            duration: 8000,
          }
        );
      }

      if (redOceans.length > 0) {
        toast.warning(
          `🔴 Red Ocean Alert: ${redOceans.map(r => `"${r.keyword}"`).join(", ")}`,
          {
            description: "High competition - Consider niche variations instead.",
            duration: 6000,
          }
        );
      }

      if (blueOceans.length === 0 && redOceans.length === 0) {
        toast.info(`Analysis complete for ${results.length} keyword(s)`);
      }

    } catch (error) {
      console.error("Analysis failed", error);
      toast.dismiss("search");
      toast.error("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border/40 bg-card/30 hidden md:flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <Zap className="h-6 w-6 text-yellow-400" />
            StockVision
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Main</p>
            <Button variant="ghost" className="w-full justify-start gap-2 bg-primary/10 text-primary">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
            <Link href="/analysis" className="w-full">
              <Button variant="ghost" className="w-full justify-start gap-2 hover:bg-primary/10 hover:text-primary">
                <BarChart3 className="h-4 w-4" />
                Market Analysis
              </Button>
            </Link>
            <Link href="/discover" className="w-full">
              <Button variant="ghost" className="w-full justify-start gap-2 hover:bg-yellow-500/10 hover:text-yellow-400">
                <Lightbulb className="h-4 w-4" />
                Niche Discovery
              </Button>
            </Link>
            <Link href="/settings" className="w-full">
              <Button variant="ghost" className="w-full justify-start gap-2 hover:bg-muted">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </Link>
          </div>

          <div className="space-y-2">
            <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Watchlist ({savedTrends.length})
            </p>
            {savedTrends.length === 0 ? (
              <div className="px-4 py-4 text-xs text-muted-foreground border border-dashed rounded-md text-center">
                No saved trends yet.
              </div>
            ) : (
              savedTrends.map(trend => (
                <Button
                  key={trend.keyword}
                  variant="ghost"
                  className="w-full justify-start gap-2 text-xs h-8 truncate"
                  onClick={() => setSelectedTrend(trend)}
                >
                  <div className={`w-2 h-2 rounded-full ${trend.status === 'Blue Ocean' ? 'bg-blue-500' : trend.status === 'Red Ocean' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                  <span className="truncate">{trend.keyword}</span>
                </Button>
              ))
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-border/40">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-primary/20">
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <p className="font-medium">John Doe</p>
              <p className="text-xs text-muted-foreground">Pro Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] opacity-20" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] opacity-20" />
        </div>

        {/* Header */}
        <header className="h-16 border-b border-border/40 flex items-center justify-between px-8 bg-background/50 backdrop-blur-sm z-10">
          <h1 className="text-xl font-semibold">Image Market Intelligence</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={async () => {
                try {
                  toast.loading("Exporting data...", { id: "export" });
                  await exportData();
                  toast.success("Data exported successfully!", { id: "export" });
                } catch {
                  toast.error("Export failed", { id: "export" });
                }
              }}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-red-400 hover:text-red-300 hover:border-red-400"
              onClick={async () => {
                if (confirm("Clear all cached data?")) {
                  const success = await clearCache();
                  if (success) {
                    toast.success("Cache cleared!");
                  } else {
                    toast.error("Failed to clear cache");
                  }
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
              Clear Cache
            </Button>
            <Button variant="outline" size="icon" className="rounded-full">
              <Bell className="h-4 w-4" />
            </Button>
            <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              <RefreshCw className="h-4 w-4" />
              Auto-Sync
            </Button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">

          {/* Search Section */}
          <div className="max-w-2xl mx-auto mb-12">
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-600 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative flex items-center bg-card rounded-lg border border-border">
                <Search className="ml-4 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Enter keywords (comma separated) e.g. 'Vintage Car, Cyberpunk, Cat Meme'..."
                  className="border-0 bg-transparent focus-visible:ring-0 py-6 text-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={isAnalyzing}
                />
                <Button
                  type="submit"
                  disabled={isAnalyzing}
                  className="mr-2 px-6"
                >
                  {isAnalyzing ? "Analyzing..." : "Research"}
                </Button>
              </div>
            </form>

            {/* Popular Keywords Section */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Popular Keywords (Click to Research)
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadTrendingKeywords}
                  disabled={isLoadingTrending}
                  className="text-xs"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingTrending ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {isLoadingTrending ? (
                  <div className="text-xs text-muted-foreground">Loading trending keywords...</div>
                ) : (
                  trendingKeywords.slice(0, 15).map((kw, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className={`cursor-pointer hover:bg-primary/20 transition-colors text-xs py-1 px-3
                        ${kw.type === 'Trending Now' ? 'border-red-500/50 text-red-400 hover:border-red-400' :
                          kw.type === 'Rising' ? 'border-green-500/50 text-green-400 hover:border-green-400' :
                            kw.type === 'Top' ? 'border-blue-500/50 text-blue-400 hover:border-blue-400' :
                              'border-amber-500/50 text-amber-400 hover:border-amber-400'}
                      `}
                      onClick={() => {
                        setSearchTerm(kw.keyword);
                        toast.info(`"${kw.keyword}" added to search`);
                      }}
                    >
                      {kw.type === 'Trending Now' && '🔥 '}
                      {kw.type === 'Rising' && '📈 '}
                      {kw.keyword}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Selected Trend Deep Dive (Chart) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  {selectedTrend.keyword}
                  <Badge variant="outline" className="text-sm font-normal">
                    {selectedTrend.status}
                  </Badge>
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  className={savedTrends.some(t => t.keyword === selectedTrend.keyword) ? "text-yellow-400 border-yellow-400/50 bg-yellow-400/10" : ""}
                  onClick={() => toggleSaveTrend(selectedTrend)}
                >
                  {savedTrends.some(t => t.keyword === selectedTrend.keyword) ? "★ Saved" : "☆ Save to Watchlist"}
                </Button>
              </div>

              <TrendChart data={selectedTrend.prediction} label="Demand Forecast" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-card/50 backdrop-blur border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Demand</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedTrend.demandScore}/100</div>
                    <Progress value={selectedTrend.demandScore} className="h-2 mt-2" />
                  </CardContent>
                </Card>
                <Card className="bg-card/50 backdrop-blur border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Supply</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-xs truncate whitespace-nowrap">{selectedTrend.supplyCount.toLocaleString()}</div>
                    <p className="text-[10px] text-muted-foreground mt-2 uppercase">Stock Count</p>
                  </CardContent>
                </Card>
                <Card className={`backdrop-blur border-border/50 ${selectedTrend.status === 'Blue Ocean' ? 'bg-blue-500/10 border-blue-500/50' : selectedTrend.status === 'Red Ocean' ? 'bg-red-500/10 border-red-500/50' : 'bg-card/50'}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Opp. Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${selectedTrend.status === 'Blue Ocean' ? 'text-blue-400' : selectedTrend.status === 'Red Ocean' ? 'text-red-400' : 'text-yellow-400'}`}>
                      {selectedTrend.opportunityScore.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card/50 backdrop-blur border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Free Market</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedTrend.freeSaturation || 0}%</div>
                    <Progress value={selectedTrend.freeSaturation || 0} className="h-2 mt-2" />
                    <p className="text-[10px] text-muted-foreground mt-2 uppercase">Saturation</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Side List: Top Opportunities */}
            <div className="lg:col-span-1">
              <Card className="h-full bg-card/50 backdrop-blur border-border/50 flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Recent Research
                  </CardTitle>
                  <CardDescription>
                    High score = Blue Ocean
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <div className="space-y-4">
                    <AnimatePresence>
                      {trends.map((trend, i) => (
                        <motion.div
                          key={trend.keyword}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          onClick={() => setSelectedTrend(trend)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent/50 ${selectedTrend.keyword === trend.keyword ? 'bg-accent/80 border-primary/50' : 'border-transparent bg-background/50'}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-semibold">{trend.keyword}</div>
                            <div className={`text-sm font-bold ${trend.status === 'Blue Ocean' ? 'text-blue-400' : trend.status === 'Red Ocean' ? 'text-red-400' : 'text-yellow-400'}`}>
                              {trend.opportunityScore}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Demand: {trend.demandScore}</span>
                              <span>Supply: {trend.supplyCount}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-[10px] h-5">
                                {trend.status}
                              </Badge>
                              {trend.growth > 0 && (
                                <span className="text-xs text-green-500 flex items-center">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  {trend.growth}%
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
