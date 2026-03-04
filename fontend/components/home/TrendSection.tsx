import React, { useEffect, useState } from "react";

// 1. Định nghĩa kiểu dữ liệu (Khớp với Backend trả về)
interface TrendData {
    desc: string;
    music: string;
    author: string;
    views: string;
}

interface TrendResponse {
    trends: TrendData[];
    analysis: string; // Lời khuyên của AI
}

const TrendSection: React.FC = () => {
    const [data, setData] = useState<TrendResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [isUsingFallback, setIsUsingFallback] = useState(false);

    useEffect(() => {
        // Dùng đường dẫn tương đối để Nginx tự điều hướng
        const API_URL = "/ai/trends/analyze";

        console.log("Fetching trends from:", API_URL);

        fetch(API_URL)
            .then(async (res) => {
                // Kiểm tra status code trước
                if (!res.ok) {
                    // Nếu lỗi (404, 500, 502...), ném lỗi để xuống catch xử lý
                    throw new Error(`API Error: ${res.status}`);
                }

                // Kiểm tra Content-Type xem có phải JSON không
                const contentType = res.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                    throw new Error("Received non-JSON response from server");
                }

                return res.json();
            })
            .then((result) => {
                // Kiểm tra cấu trúc dữ liệu trả về có đúng format không
                if (
                    result &&
                    Array.isArray(result.trends) &&
                    typeof result.analysis === "string"
                ) {
                    setData(result);
                    setIsUsingFallback(false); // Dữ liệu thật -> Tắt demo mode
                } else {
                    throw new Error("Invalid Data Structure from API");
                }
            })
            .catch((err) => {
                console.warn(
                    "⚠️ API Error or Offline. Switching to Demo Mode.",
                    err,
                );
                setIsUsingFallback(true);

                // Dữ liệu giả lập (Fallback Data) - Hiển thị khi API lỗi
                setData({
                    analysis:
                        "Kết quả phân tích AI (Demo): Xu hướng 'Healthy Lifestyle' đang bùng nổ với các video ASMR đồ ăn vặt. Gợi ý chiến lược: Đẩy mạnh sản phẩm 'Trái Cây Sấy' và 'Granola' ngay lập tức!",
                    trends: [
                        {
                            desc: "#healthysnack",
                            music: "Rank: 1 • Viral Hit",
                            views: "2.5M",
                            author: "HealthyBoi",
                        },
                        {
                            desc: "#vietnamesefood",
                            music: "Rank: 2 • Chill Vibe",
                            views: "1.8M",
                            author: "StreetFoodVN",
                        },
                        {
                            desc: "#asmr_eating",
                            music: "Rank: 3 • Trending Audio",
                            views: "900K",
                            author: "MukbangUS",
                        },
                        {
                            desc: "#summer_vibes",
                            music: "Rank: 4 • Up Beat",
                            views: "750K",
                            author: "TravelFood",
                        },
                    ],
                });
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    // Giao diện khi đang tải (Skeleton Loading)
    if (loading) {
        return (
            <div className="py-12 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="h-8 w-48 bg-stone-200 dark:bg-stone-800 rounded-lg animate-pulse mb-6"></div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 h-64 bg-stone-100 dark:bg-stone-800 rounded-2xl animate-pulse"></div>
                    <div className="h-64 bg-stone-100 dark:bg-stone-800 rounded-2xl animate-pulse"></div>
                </div>
            </div>
        );
    }

    return (
        <section className="py-16 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-stone-900 dark:via-stone-900 dark:to-stone-800 border-y border-indigo-100 dark:border-stone-800 transition-colors duration-500">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl shadow-lg shadow-red-500/20 animate-pulse-slow">
                            <span className="material-symbols-outlined text-white">
                                trending_up
                            </span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                AI Trend Spotter
                                {isUsingFallback && (
                                    <span className="px-2 py-0.5 rounded text-[10px] bg-stone-200 text-stone-600 font-bold border border-stone-300 ml-2">
                                        DEMO MODE
                                    </span>
                                )}
                            </h2>
                            <p className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                                LIVE ANALYSIS • TIKTOK US
                            </p>
                        </div>
                    </div>

                    <div className="text-right hidden sm:block">
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                            Data Source
                        </p>
                        <p className="text-sm font-bold text-slate-700 dark:text-stone-300 flex items-center justify-end gap-1">
                            <span className="material-symbols-outlined !text-sm">
                                api
                            </span>{" "}
                            Creative Center API
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* CỘT 1: AI INSIGHT (Lời khuyên) - Điểm nhấn WOW */}
                    <div className="lg:col-span-2 relative overflow-hidden rounded-[32px] bg-white dark:bg-stone-800 shadow-xl shadow-indigo-100/50 dark:shadow-none border border-indigo-50 dark:border-stone-700 p-8 flex flex-col justify-center group">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 p-0 opacity-[0.03] dark:opacity-[0.05] group-hover:scale-110 transition-transform duration-700">
                            <span className="material-symbols-outlined text-[200px]">
                                psychology
                            </span>
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="inline-flex items-center gap-1 py-1 px-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider">
                                    <span className="material-symbols-outlined !text-sm">
                                        auto_awesome
                                    </span>
                                    Gemini AI Analysis
                                </span>
                            </div>

                            <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-stone-100 mb-6 leading-relaxed">
                                "{data?.analysis}"
                            </h3>

                            {/* Call To Action Button */}
                            <button className="px-8 py-4 bg-slate-900 dark:bg-white hover:bg-indigo-600 dark:hover:bg-indigo-400 text-white dark:text-slate-900 font-bold rounded-2xl shadow-xl shadow-indigo-500/20 transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 w-fit">
                                <span className="material-symbols-outlined">
                                    shopping_bag
                                </span>
                                Apply Strategy & Push Products
                            </button>
                        </div>
                    </div>

                    {/* CỘT 2: TOP TRENDS LIST */}
                    <div className="bg-white/60 dark:bg-stone-800/60 backdrop-blur-xl rounded-[32px] border border-white dark:border-stone-700 p-6 shadow-lg shadow-slate-100/50 dark:shadow-none h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="font-bold text-slate-700 dark:text-white uppercase text-sm">
                                🔥 Top Hashtags
                            </h4>
                            <span className="text-xs font-medium text-stone-400">
                                Last 24h
                            </span>
                        </div>

                        <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                            {data?.trends.slice(0, 4).map((trend, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-4 p-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div
                                        className={`
                                            w-10 h-10 rounded-full flex items-center justify-center text-lg font-black shrink-0
                                            ${
                                                idx === 0
                                                    ? "bg-yellow-100 text-yellow-600"
                                                    : idx === 1
                                                      ? "bg-stone-100 text-stone-500"
                                                      : idx === 2
                                                        ? "bg-orange-50 text-orange-700"
                                                        : "bg-stone-50 text-stone-400"
                                            }
                                        `}
                                    >
                                        {idx + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-900 dark:text-white truncate">
                                            {trend.desc}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 rounded text-stone-500">
                                                {trend.views} views
                                            </span>
                                            <span className="text-[10px] text-stone-400 truncate max-w-[100px]">
                                                {trend.music}
                                            </span>
                                        </div>
                                    </div>
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
