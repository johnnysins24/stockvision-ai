"use client";

import { useState, useEffect } from "react";
import {
    ArrowLeft,
    Settings,
    Database,
    Clock,
    Globe,
    RefreshCw,
    CheckCircle,
    XCircle,
    Trash2,
    Download,
    Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { getDataSources, exportData, clearCache, checkApiHealth } from "@/lib/data";

interface DataSource {
    name: string;
    url: string;
    enabled: boolean;
    weight: number;
}

export default function SettingsPage() {
    const [sources, setSources] = useState<Record<string, DataSource>>({});
    const [cacheExpiry, setCacheExpiry] = useState(24);
    const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadSettings();
        checkApi();
    }, []);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const data = await getDataSources();
            setSources(data.sources || {});
            setCacheExpiry(data.cache_expiry_hours || 24);
        } catch (error) {
            console.error("Failed to load settings:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const checkApi = async () => {
        setApiStatus("checking");
        const isOnline = await checkApiHealth();
        setApiStatus(isOnline ? "online" : "offline");
    };

    const handleExport = async () => {
        try {
            toast.loading("Exporting data...", { id: "export" });
            await exportData();
            toast.success("Data exported successfully!", { id: "export" });
        } catch {
            toast.error("Export failed", { id: "export" });
        }
    };

    const handleClearCache = async () => {
        if (confirm("Are you sure you want to clear all cached data? This cannot be undone.")) {
            try {
                toast.loading("Clearing cache...", { id: "clear" });
                const success = await clearCache();
                if (success) {
                    toast.success("Cache cleared successfully!", { id: "clear" });
                } else {
                    toast.error("Failed to clear cache", { id: "clear" });
                }
            } catch {
                toast.error("Failed to clear cache", { id: "clear" });
            }
        }
    };

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
                                <Settings className="h-6 w-6 text-muted-foreground" />
                                Settings
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Configure data sources and system settings
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge
                            variant="outline"
                            className={
                                apiStatus === "online" ? "border-green-500 text-green-400" :
                                    apiStatus === "offline" ? "border-red-500 text-red-400" :
                                        "border-yellow-500 text-yellow-400"
                            }
                        >
                            {apiStatus === "online" && <CheckCircle className="h-3 w-3 mr-1" />}
                            {apiStatus === "offline" && <XCircle className="h-3 w-3 mr-1" />}
                            {apiStatus === "checking" && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
                            API {apiStatus === "checking" ? "Checking..." : apiStatus === "online" ? "Online" : "Offline"}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={checkApi}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8 max-w-4xl">
                {/* API Connection */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5" />
                            API Connection
                        </CardTitle>
                        <CardDescription>
                            Backend server connection status
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 bg-card/50 rounded-lg border border-border/50">
                            <div>
                                <p className="font-medium">Backend Server</p>
                                <p className="text-sm text-muted-foreground">
                                    {process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001"}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {apiStatus === "online" ? (
                                    <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Connected
                                    </Badge>
                                ) : apiStatus === "offline" ? (
                                    <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Disconnected
                                    </Badge>
                                ) : (
                                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                        Checking...
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Data Sources */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            Data Sources
                        </CardTitle>
                        <CardDescription>
                            Stock photography platforms used for supply data
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                                Loading sources...
                            </div>
                        ) : Object.keys(sources).length > 0 ? (
                            <div className="space-y-4">
                                {Object.entries(sources).map(([id, source]) => (
                                    <div
                                        key={id}
                                        className="flex items-center justify-between p-4 bg-card/50 rounded-lg border border-border/50"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">{source.name}</p>
                                                {source.enabled ? (
                                                    <Badge variant="outline" className="text-xs border-green-500/50 text-green-400">
                                                        Enabled
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-xs border-gray-500/50 text-gray-400">
                                                        Disabled
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1 truncate max-w-md">
                                                {source.url}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-sm font-medium">{(source.weight * 100).toFixed(0)}%</p>
                                                <p className="text-xs text-muted-foreground">Weight</p>
                                            </div>
                                            <div className="w-20">
                                                <Progress value={source.weight * 100} className="h-2" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No data sources configured
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Cache Settings */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Cache Settings
                        </CardTitle>
                        <CardDescription>
                            Configure data caching behavior
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 bg-card/50 rounded-lg border border-border/50 mb-4">
                            <div>
                                <p className="font-medium">Cache Expiry</p>
                                <p className="text-sm text-muted-foreground">
                                    Data is refreshed after this period
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-primary">{cacheExpiry}</p>
                                <p className="text-xs text-muted-foreground">hours</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="gap-2 flex-1"
                                onClick={handleExport}
                            >
                                <Download className="h-4 w-4" />
                                Export All Data (CSV)
                            </Button>
                            <Button
                                variant="outline"
                                className="gap-2 flex-1 text-red-400 hover:text-red-300 hover:border-red-400"
                                onClick={handleClearCache}
                            >
                                <Trash2 className="h-4 w-4" />
                                Clear All Cache
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* About */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Info className="h-5 w-5" />
                            About StockVision
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <p><strong>Version:</strong> 2.0.0</p>
                            <p><strong>Stack:</strong> Next.js 15 + FastAPI + SQLite</p>
                            <p><strong>Features:</strong></p>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li>Multi-source supply data (Adobe Stock, Shutterstock, Pexels, Unsplash)</li>
                                <li>Google Trends integration for demand analysis</li>
                                <li>Prophet-style forecasting with confidence intervals</li>
                                <li>Statistical niche discovery with tier scoring</li>
                                <li>Market analysis with batch keyword processing</li>
                                <li>Smart caching with 24-hour expiry</li>
                                <li>CSV export functionality</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
