import React, { useEffect, useState } from 'react';

interface TrendHistoryItem {
    id: string;
    topHashtags: string;
    aiAnalysis: string;
    recommendedProductsJson: string;
    source: string;
    createdAt: string;
}

interface RecommendedProduct {
    productId: string;
    productName: string;
    matchedTrend: string;
    reason: string;
}

const TrendHistoryView: React.FC = () => {
    const [history, setHistory] = useState<TrendHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        fetch('/ai/trends/history')
            .then(async (res) => {
                if (!res.ok) throw new Error(`API Error: ${res.status}`);
                return res.json();
            })
            .then((result) => {
                const data = result.data || result;
                setHistory(Array.isArray(data) ? data : []);
            })
            .catch((err) => {
                console.error('Cannot load trend history:', err);
                setHistory([]);
            })
            .finally(() => setLoading(false));
    }, []);

    const parseProducts = (json: string): RecommendedProduct[] => {
        try {
            return JSON.parse(json) || [];
        } catch {
            return [];
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getSourceBadge = (source: string) => {
        if (source?.includes('Gemini')) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                    <span className="material-symbols-outlined !text-sm">auto_awesome</span>
                    Gemini AI
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400 text-xs font-bold">
                <span className="material-symbols-outlined !text-sm">backup</span>
                Fallback
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col gap-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-5 bg-stone-200 dark:bg-stone-700 rounded w-48" />
                            <div className="h-5 bg-stone-200 dark:bg-stone-700 rounded w-24" />
                        </div>
                        <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-full mb-2" />
                        <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-3/4" />
                    </div>
                ))}
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="material-symbols-outlined text-6xl text-stone-300 dark:text-stone-600 mb-4">history</span>
                <h3 className="text-lg font-bold text-text-light dark:text-text-dark mb-2">Chưa có lịch sử phân tích</h3>
                <p className="text-sm text-subtext-light dark:text-subtext-dark max-w-md">
                    Khi AI phân tích xu hướng TikTok, kết quả sẽ được lưu lại tại đây để bạn xem lại bất cứ lúc nào.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Summary Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
                <div className="rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-indigo-500">analytics</span>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-text-light dark:text-text-dark">{history.length}</p>
                        <p className="text-xs font-medium text-subtext-light dark:text-subtext-dark">Tổng bản phân tích</p>
                    </div>
                </div>
                <div className="rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-emerald-500">auto_awesome</span>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-text-light dark:text-text-dark">
                            {history.filter(h => h.source?.includes('Gemini')).length}
                        </p>
                        <p className="text-xs font-medium text-subtext-light dark:text-subtext-dark">Từ Gemini AI</p>
                    </div>
                </div>
                <div className="rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-amber-500">schedule</span>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-text-light dark:text-text-dark">
                            {history[0] ? formatDate(history[0].createdAt) : '—'}
                        </p>
                        <p className="text-xs font-medium text-subtext-light dark:text-subtext-dark">Phân tích gần nhất</p>
                    </div>
                </div>
            </div>

            {/* History List */}
            {history.map((item) => {
                const isExpanded = expandedId === item.id;
                const products = parseProducts(item.recommendedProductsJson);

                return (
                    <div
                        key={item.id}
                        className="rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark overflow-hidden transition-all hover:shadow-md"
                    >
                        {/* Header — always visible */}
                        <button
                            onClick={() => setExpandedId(isExpanded ? null : item.id)}
                            className="w-full flex items-center justify-between p-5 text-left hover:bg-background-light dark:hover:bg-background-dark transition-colors"
                        >
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <span className="material-symbols-outlined text-white !text-lg">psychology</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className="text-sm font-bold text-text-light dark:text-text-dark">
                                            {formatDate(item.createdAt)}
                                        </span>
                                        {getSourceBadge(item.source)}
                                        {products.length > 0 && (
                                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded">
                                                {products.length} sản phẩm
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-subtext-light dark:text-subtext-dark truncate">
                                        {item.topHashtags}
                                    </p>
                                </div>
                            </div>
                            <span className={`material-symbols-outlined text-subtext-light dark:text-subtext-dark transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                expand_more
                            </span>
                        </button>

                        {/* Expanded Content */}
                        {isExpanded && (
                            <div className="border-t border-border-light dark:border-border-dark p-5 space-y-5 bg-background-light/50 dark:bg-background-dark/50">
                                {/* AI Analysis */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="material-symbols-outlined text-indigo-500 !text-base">auto_awesome</span>
                                        <h4 className="text-sm font-bold text-text-light dark:text-text-dark uppercase tracking-wide">Phân tích AI</h4>
                                    </div>
                                    <p className="text-sm text-text-light dark:text-text-dark leading-relaxed bg-surface-light dark:bg-surface-dark rounded-xl p-4 border border-border-light dark:border-border-dark italic">
                                        "{item.aiAnalysis}"
                                    </p>
                                </div>

                                {/* Top Hashtags */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="material-symbols-outlined text-red-500 !text-base">tag</span>
                                        <h4 className="text-sm font-bold text-text-light dark:text-text-dark uppercase tracking-wide">Xu hướng</h4>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {item.topHashtags.split(',').map((tag, i) => (
                                            <span key={i} className="inline-flex items-center px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/15 text-red-600 dark:text-red-400 text-xs font-bold">
                                                {tag.trim()}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Recommended Products */}
                                {products.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="material-symbols-outlined text-amber-500 !text-base">stars</span>
                                            <h4 className="text-sm font-bold text-text-light dark:text-text-dark uppercase tracking-wide">Sản phẩm gợi ý</h4>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {products.map((p, idx) => (
                                                <div
                                                    key={idx}
                                                    className="rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-3.5 hover:shadow-sm transition-all"
                                                >
                                                    <p className="font-bold text-sm text-text-light dark:text-text-dark truncate mb-1">
                                                        {p.productName}
                                                    </p>
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 text-[10px] font-bold mb-2">
                                                        <span className="material-symbols-outlined !text-xs">tag</span>
                                                        {p.matchedTrend}
                                                    </span>
                                                    <p className="text-xs text-subtext-light dark:text-subtext-dark leading-relaxed line-clamp-2">
                                                        {p.reason}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default TrendHistoryView;
