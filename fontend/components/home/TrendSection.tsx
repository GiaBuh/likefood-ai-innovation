import React, { useEffect, useState } from "react";

interface TrendData {
    desc: string;
    music: string;
    author: string;
    views: string;
}

interface RecommendedProduct {
    productId: string;
    productName: string;
    matchedTrend: string;
    reason: string;
    imageUrl?: string;
    productSlug?: string;
}

interface TrendResponse {
    trends: TrendData[];
    analysis: string;
    recommendedProducts: RecommendedProduct[];
    source?: string;
    cached?: boolean;
}

/* ───────────────────── SKELETON COMPONENTS ───────────────────── */

const SkeletonPulse: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`animate-pulse bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200 dark:from-stone-800 dark:via-stone-700 dark:to-stone-800 bg-[length:200%_100%] rounded ${className ?? ""}`} 
         style={{ animation: "shimmer 1.5s ease-in-out infinite" }} />
);

const LoadingSkeleton: React.FC = () => (
    <section className="py-16 from-indigo-50/50 via-white to-purple-50/50 dark:from-stone-950 dark:to-stone-900 border-y border-indigo-100 dark:border-stone-800">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header skeleton */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <SkeletonPulse className="w-11 h-11 rounded-xl" />
                    <div>
                        <SkeletonPulse className="w-48 h-7 mb-2" />
                        <SkeletonPulse className="w-32 h-4" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT: AI Analysis skeleton */}
                <div className="lg:col-span-2 rounded-[32px] bg-white dark:bg-stone-800 shadow-xl border border-indigo-50 dark:border-stone-700 p-8">
                    <SkeletonPulse className="w-40 h-6 rounded-full mb-6" />
                    <SkeletonPulse className="w-full h-5 mb-3" />
                    <SkeletonPulse className="w-4/5 h-5 mb-3" />
                    <SkeletonPulse className="w-3/5 h-5 mb-8" />

                    {/* Product recommendation skeletons */}
                    <SkeletonPulse className="w-56 h-5 mb-4" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="rounded-2xl border border-stone-100 dark:border-stone-700 p-4 flex items-start gap-3">
                                <SkeletonPulse className="w-9 h-9 rounded-xl flex-shrink-0" />
                                <div className="flex-1">
                                    <SkeletonPulse className="w-3/4 h-4 mb-2" />
                                    <SkeletonPulse className="w-1/2 h-3 mb-2" />
                                    <SkeletonPulse className="w-full h-3" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: Hashtag list skeleton */}
                <div className="bg-white/60 dark:bg-stone-800/60 backdrop-blur-xl rounded-[32px] border border-white dark:border-stone-700 p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                        <SkeletonPulse className="w-40 h-5" />
                        <SkeletonPulse className="w-20 h-5 rounded" />
                    </div>
                    <div className="space-y-3">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 rounded-2xl border border-stone-100 dark:border-stone-800">
                                <SkeletonPulse className="w-8 h-8 rounded-lg flex-shrink-0" />
                                <div className="flex-1">
                                    <SkeletonPulse className="w-3/4 h-4 mb-1.5" />
                                    <SkeletonPulse className="w-1/2 h-3" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* AI Loading Message */}
            <div className="flex items-center justify-center gap-3 mt-8 text-indigo-500 dark:text-indigo-400">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm font-semibold">
                    🤖 AI đang tổng hợp dữ liệu từ TikTok, vui lòng đợi...
                </span>
            </div>
        </div>

        <style>{`
            @keyframes shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
        `}</style>
    </section>
);

/* ───────────────────── MAIN COMPONENT ───────────────────── */

const TrendSection: React.FC = () => {
    const [data, setData] = useState<TrendResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [isUsingFallback, setIsUsingFallback] = useState(false);

    useEffect(() => {
        const API_URL = "/ai/trends/analyze";

        fetch(API_URL)
            .then(async (res) => {
                if (!res.ok) throw new Error(`API Error: ${res.status}`);
                return res.json();
            })
            .then((result) => {
                const payload = result.data || result;
                if (payload && Array.isArray(payload.trends)) {
                    setData({
                        trends: payload.trends,
                        analysis: payload.analysis || "",
                        recommendedProducts: payload.recommendedProducts || [],
                        source: payload.source,
                        cached: payload.cached,
                    });
                    setIsUsingFallback(false);
                } else {
                    throw new Error("Invalid Structure");
                }
            })
            .catch((err) => {
                console.warn("⚠️ Switching to Demo Mode:", err);
                setIsUsingFallback(true);
                setData({
                    analysis:
                        "Kết quả phân tích AI: Xu hướng đồ ăn lành mạnh đang bùng nổ. Hãy tập trung vào Granola!",
                    trends: [
                        {
                            desc: "#healthysnack",
                            music: "Viral Hit",
                            views: "2.5M",
                            author: "HealthyBoi",
                        },
                        {
                            desc: "#vietnamesefood",
                            music: "Chill Vibe",
                            views: "1.8M",
                            author: "StreetFoodVN",
                        },
                    ],
                    recommendedProducts: [
                        {
                            productId: "demo-1",
                            productName: "Granola Mix",
                            matchedTrend: "#healthysnack",
                            reason: "Sản phẩm granola phù hợp với xu hướng ăn vặt lành mạnh.",
                        },
                    ],
                });
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <LoadingSkeleton />;
    }

    return (
        <section className="py-16 from-indigo-50/50 via-white to-purple-50/50 dark:from-stone-950 dark:to-stone-900 border-y border-indigo-100 dark:border-stone-800">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div
                            className={`p-2.5 rounded-xl shadow-lg transition-colors ${isUsingFallback ? "bg-stone-400" : "bg-gradient-to-r from-red-500 to-pink-500 shadow-red-500/20"}`}
                        >
                            <span className="material-symbols-outlined text-white">
                                trending_up
                            </span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                AI Trend Spotter
                                {isUsingFallback && (
                                    <span className="px-2 py-0.5 rounded text-[10px] bg-stone-200 text-stone-600 font-bold border border-stone-300">
                                        DEMO MODE
                                    </span>
                                )}
                            </h2>
                            <p
                                className={`text-xs font-bold flex items-center gap-1 mt-1 ${isUsingFallback ? "text-stone-400" : "text-red-500"}`}
                            >
                                <span className="relative flex h-2 w-2">
                                    <span
                                        className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${isUsingFallback ? "bg-stone-300" : "animate-ping bg-red-400"}`}
                                    ></span>
                                    <span
                                        className={`relative inline-flex rounded-full h-2 w-2 ${isUsingFallback ? "bg-stone-400" : "bg-red-500"}`}
                                    ></span>
                                </span>
                                {isUsingFallback
                                    ? "OFFLINE DATA"
                                    : "LIVE ANALYSIS • TIKTOK US"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* CỘT 1: AI INSIGHT */}
                    <div className="lg:col-span-2 relative overflow-hidden rounded-[32px] bg-white dark:bg-stone-800 shadow-xl border border-indigo-50 dark:border-stone-700 p-8 flex flex-col justify-between">
                        <div className="absolute top-0 right-0 p-0 opacity-[0.03] dark:opacity-[0.05]">
                            <span className="material-symbols-outlined text-[200px]">
                                psychology
                            </span>
                        </div>

                        <div className="relative z-10">
                            <span className="inline-flex items-center gap-1 py-1 px-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase mb-4">
                                <span className="material-symbols-outlined !text-sm">
                                    auto_awesome
                                </span>
                                Gemini AI Strategy
                            </span>

                            <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-stone-100 mb-6 leading-relaxed italic">
                                "{data?.analysis}"
                            </h3>
                        </div>

                        {/* RECOMMENDED PRODUCTS */}
                        {data?.recommendedProducts && data.recommendedProducts.length > 0 && (
                            <div className="relative z-10 mt-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="material-symbols-outlined text-amber-500 !text-lg">
                                        stars
                                    </span>
                                    <h4 className="font-bold text-sm uppercase text-slate-700 dark:text-stone-300 tracking-wide">
                                        Sản phẩm phù hợp xu hướng
                                    </h4>
                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded">
                                        {data.recommendedProducts.length} SẢN PHẨM
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {data.recommendedProducts.map((product, idx) => {
                                        const card = (
                                            <div
                                                key={idx}
                                                className="bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-stone-700/50 dark:to-stone-700/30 rounded-2xl p-4 border border-indigo-100 dark:border-stone-600 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all group cursor-pointer"
                                            >
                                                <div className="flex items-start gap-3">
                                                    {/* Product Image or Icon */}
                                                    {product.imageUrl ? (
                                                        <img
                                                            src={product.imageUrl}
                                                            alt={product.productName}
                                                            className="w-12 h-12 rounded-xl object-cover flex-shrink-0 shadow-sm border border-stone-200 dark:border-stone-600"
                                                        />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                                                            <span className="material-symbols-outlined text-white !text-base">
                                                                inventory_2
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-bold text-sm text-slate-800 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                            {product.productName}
                                                        </p>
                                                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 text-[10px] font-bold">
                                                            <span className="material-symbols-outlined !text-xs">
                                                                tag
                                                            </span>
                                                            {product.matchedTrend}
                                                        </span>
                                                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 leading-relaxed line-clamp-2">
                                                            {product.reason}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );

                                        // Wrap in link if productSlug exists
                                        return product.productSlug ? (
                                            <a
                                                key={idx}
                                                href={`/product/${product.productSlug}`}
                                                className="block no-underline"
                                            >
                                                {card}
                                            </a>
                                        ) : (
                                            card
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* CỘT 2: TOP TRENDS */}
                    <div className="bg-white/60 dark:bg-stone-800/60 backdrop-blur-xl rounded-[32px] border border-white dark:border-stone-700 p-6 shadow-lg">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="font-bold text-slate-700 dark:text-white uppercase text-sm">
                                🔥 Real-time Hashtags
                            </h4>
                            <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded">
                                {data?.trends.length} TOPICS
                            </span>
                        </div>

                        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
                            {data?.trends.map((trend, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-4 p-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-sm font-black text-stone-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                        {idx + 1}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 transition-colors">
                                            {trend.desc}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-bold text-red-500">
                                                {trend.views}
                                            </span>
                                            <span className="text-[10px] text-stone-400 truncate">
                                                • {trend.music}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-stone-300 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all !text-sm">
                                        arrow_forward
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TrendSection;
