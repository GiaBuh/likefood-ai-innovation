import React, { useState, useMemo } from 'react';
import { generateAiCombo, AiComboResponse, publishAiCombo } from '../../services/shopApi';
import { Product } from '../../types';

interface AiComboGeneratorProps {
  products: Product[];
}

interface ScoredProduct {
  product: Product;
  score: number;
  stock: number;
  sold: number;
}

const AiComboGenerator: React.FC<AiComboGeneratorProps> = ({ products }) => {
  const [hashtag, setHashtag] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiComboResponse | null>(null);
  const [error, setError] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'smart' | 'manual'>('smart');

  // Smart scoring: score = stock / (soldCount + 1)
  const scoredProducts = useMemo<ScoredProduct[]>(() => {
    return products
      .map(p => {
        const stock = p.stock ?? 0;
        const sold = p.totalSoldCount ?? 0;
        const score = stock / (sold + 1);
        return { product: p, score, stock, sold };
      })
      .sort((a, b) => b.score - a.score);
  }, [products]);

  // Auto-select top 3 when switching to smart tab
  const handleTabSwitch = (tab: 'smart' | 'manual') => {
    setActiveTab(tab);
    if (tab === 'smart') {
      const top3 = scoredProducts.slice(0, 3).map(sp => sp.product.name);
      setSelectedItems(top3);
    } else {
      setSelectedItems([]);
    }
  };

  // Initialize smart tab auto-select on first render
  React.useEffect(() => {
    if (activeTab === 'smart' && selectedItems.length === 0 && scoredProducts.length > 0) {
      const top3 = scoredProducts.slice(0, 3).map(sp => sp.product.name);
      setSelectedItems(top3);
    }
  }, [scoredProducts]);

  const handleToggleItem = (productName: string) => {
    setSelectedItems(prev =>
      prev.includes(productName)
        ? prev.filter(item => item !== productName)
        : [...prev, productName]
    );
  };

  const handleGenerate = async () => {
    if (!hashtag.trim()) {
      setError('Vui lòng nhập Hashtag (VD: #championsleague)');
      return;
    }
    if (selectedItems.length === 0) {
      setError('Vui lòng chọn ít nhất 1 sản phẩm cho Combo!');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    setPublishSuccess(false);

    try {
      const data = await generateAiCombo(hashtag, selectedItems);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi gọi AI.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!result || !result.id) return;
    setIsPublishing(true);
    setError('');
    try {
      await publishAiCombo(result.id);
      setPublishSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi đưa lên cửa hàng.');
    } finally {
      setIsPublishing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 20) return 'text-red-500 bg-red-50 dark:bg-red-950/30';
    if (score >= 10) return 'text-amber-500 bg-amber-50 dark:bg-amber-950/30';
    return 'text-green-500 bg-green-50 dark:bg-green-950/30';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 20) return 'Ưu tiên cao';
    if (score >= 10) return 'Nên đẩy';
    return 'Ổn định';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Form */}
        <div className="flex-1 bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              🤖 Smart Combo Generator
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
              Ghép sản phẩm tồn kho cao + bán ít thành combo AI để tăng doanh thu
            </p>
          </div>

          <div className="space-y-5">
            {/* Hashtag Input */}
            <div>
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Trending Hashtag <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-400">#</span>
                <input
                  type="text"
                  placeholder="championsleague, rapviet, blackpink..."
                  className="w-full pl-8 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all dark:text-white"
                  value={hashtag.replace('#', '')}
                  onChange={(e) => setHashtag('#' + e.target.value.replace('#', ''))}
                />
              </div>
            </div>

            {/* Tab Switcher */}
            <div>
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                Chọn sản phẩm cho Combo <span className="text-red-500">*</span>
              </label>
              <div className="flex rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1 mb-3">
                <button
                  onClick={() => handleTabSwitch('smart')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition-all ${
                    activeTab === 'smart'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                  }`}
                >
                  <span className="material-symbols-outlined !text-lg">auto_awesome</span>
                  Đề xuất thông minh
                </button>
                <button
                  onClick={() => handleTabSwitch('manual')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition-all ${
                    activeTab === 'manual'
                      ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-md'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                  }`}
                >
                  <span className="material-symbols-outlined !text-lg">checklist</span>
                  Chọn thủ công
                </button>
              </div>

              {/* Smart Tab */}
              {activeTab === 'smart' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2.5 bg-purple-50 dark:bg-purple-950/30 rounded-xl text-xs text-purple-600 dark:text-purple-400 font-medium">
                    <span className="material-symbols-outlined !text-sm">lightbulb</span>
                    Nên chọn 2-3 sản phẩm. Score cao = tồn nhiều, bán ít → ưu tiên đẩy.
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-1.5 p-1">
                    {scoredProducts.map((sp, idx) => (
                      <label
                        key={sp.product.id}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                          selectedItems.includes(sp.product.name)
                            ? 'border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/20'
                            : 'border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                          checked={selectedItems.includes(sp.product.name)}
                          onChange={() => handleToggleItem(sp.product.name)}
                        />
                        <span className="text-xs font-bold text-neutral-400 w-5">#{idx + 1}</span>
                        <div className="h-8 w-8 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
                          <img src={sp.product.thumbnail} alt={sp.product.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-bold text-neutral-900 dark:text-white block truncate">{sp.product.name}</span>
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            Kho: {sp.stock} · Đã bán: {sp.sold}
                          </span>
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${getScoreColor(sp.score)}`}>
                          <span>{sp.score.toFixed(1)}</span>
                          <span className="hidden sm:inline text-[10px] opacity-75">({getScoreLabel(sp.score)})</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual Tab */}
              {activeTab === 'manual' && (
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-100 dark:border-neutral-700">
                  {products.map(p => (
                    <label key={p.id} className="flex items-center space-x-2 p-2.5 hover:bg-white dark:hover:bg-neutral-700 rounded-lg cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        className="rounded text-purple-600 focus:ring-purple-500"
                        checked={selectedItems.includes(p.name)}
                        onChange={() => handleToggleItem(p.name)}
                      />
                      <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate">{p.name}</span>
                    </label>
                  ))}
                </div>
              )}

              <p className="text-xs text-neutral-500 mt-2">
                Đã chọn: <span className="font-bold text-purple-500">{selectedItems.length}</span> sản phẩm
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined !text-lg">warning</span>
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl font-bold text-white shadow-lg transition-all
                ${loading
                  ? 'bg-neutral-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 hover:shadow-xl hover:-translate-y-0.5'
                }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang vận dụng não bộ AI...
                </span>
              ) : '🚀 Bắt AI Tạo Combo!'}
            </button>
          </div>
        </div>

        {/* Right Result View */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {loading && !result && (
            <div className="flex flex-col items-center justify-center space-y-4 text-center p-8">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-purple-200 rounded-full animate-pulse" />
                <div className="absolute inset-0 border-t-4 border-purple-600 rounded-full animate-spin" />
              </div>
              <p className="text-neutral-500 dark:text-neutral-400 animate-pulse">
                Đang triệu hồi Giám đốc Marketing Gemini<br/>và Designer AI...
              </p>
            </div>
          )}

          {!loading && !result && (
            <div className="text-center p-12 text-neutral-400 dark:text-neutral-500 border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-2xl w-full h-full flex flex-col items-center justify-center">
              <span className="text-4xl mb-3">✨</span>
              <p>Combo Siêu Cấp Vô Địch sẽ xuất hiện ở đây!</p>
            </div>
          )}

          {result && (
            <div className="w-full bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800 transform transition-all hover:scale-[1.01]">
              <div className="relative h-64 bg-neutral-200 dark:bg-neutral-800 overflow-hidden group">
                {result.imageUrl ? (
                  <img src={result.imageUrl} alt="AI Generated Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">Không tạo được ảnh</div>
                )}
                <div className="absolute top-4 right-4 bg-red-500 text-white font-black text-xl px-4 py-2 rounded-full transform rotate-12 shadow-lg border-2 border-white">
                  -{result.discount_percentage}%
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white/80 text-xs italic line-clamp-2">Prompt: {result.image_prompt}</p>
                </div>
              </div>

              <div className="p-6">
                <div className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
                  HOT TREND
                </div>
                <h3 className="text-2xl font-black text-neutral-900 dark:text-white mb-1 leading-tight">
                  {result.combo_name}
                </h3>
                <p className="text-pink-500 font-bold mb-3">
                  "{result.slogan}"
                </p>

                {/* Items in combo */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {selectedItems.map(item => (
                    <span key={item} className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg text-xs font-medium">
                      {item}
                    </span>
                  ))}
                </div>

                <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-xl relative">
                  <div className="text-neutral-600 dark:text-neutral-300 text-sm whitespace-pre-wrap italic">
                    {result.description}
                  </div>
                  <span className="absolute top-2 left-2 text-4xl text-neutral-200 dark:text-neutral-700 opacity-50 block leading-none font-serif -z-10">"</span>
                </div>

                <div className="mt-6">
                  {publishSuccess ? (
                    <div className="w-full py-3 bg-green-500 text-white rounded-xl font-bold flex justify-center flex-col items-center">
                      <span>✅ Đã đưa lên cửa hàng thành công!</span>
                      <span className="text-xs opacity-75">Xem tại trang Combo</span>
                    </div>
                  ) : (
                    <button
                      onClick={handlePublish}
                      disabled={isPublishing}
                      className={`w-full py-3 rounded-xl font-bold transition-all ${
                        isPublishing
                          ? 'bg-neutral-400 text-white cursor-not-allowed'
                          : 'bg-gradient-to-r from-neutral-900 to-neutral-700 dark:from-white dark:to-neutral-200 text-white dark:text-neutral-900 hover:shadow-xl hover:-translate-y-0.5'
                      }`}
                    >
                      {isPublishing ? 'Đang xuất bản...' : '🚀 Publish lên trang Combo'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiComboGenerator;
