import React, { useState, useMemo, useRef } from 'react';
import { generateAiCombo, createManualCombo, uploadComboImage, AiComboResponse, publishAiCombo, ComboItemInput } from '../../services/shopApi';
import { Product } from '../../types';

interface AiComboGeneratorProps {
  products: Product[];
}

interface SelectedProduct {
  productId: string;
  variantId: string;
  quantity: number;
}

interface ScoredProduct {
  product: Product;
  score: number;
  stock: number;
  sold: number;
}

const AiComboGenerator: React.FC<AiComboGeneratorProps> = ({ products }) => {
  const [hashtag, setHashtag] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiComboResponse | null>(null);
  const [error, setError] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai-smart' | 'ai-manual' | 'manual'>('ai-smart');

  // Manual combo fields
  const [manualName, setManualName] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualDiscount, setManualDiscount] = useState(10);
  const [manualImageUrl, setManualImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Smart scoring
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
  const handleTabSwitch = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setResult(null);
    setPublishSuccess(false);
    setError('');
    if (tab === 'ai-smart') {
      const top3 = scoredProducts.slice(0, 3).map(sp => ({
        productId: String(sp.product.id),
        variantId: sp.product.variants?.[0]?.id || '',
        quantity: 1,
      }));
      setSelectedProducts(top3);
    } else {
      setSelectedProducts([]);
    }
  };

  // Initialize smart tab auto-select on first render
  React.useEffect(() => {
    if (activeTab === 'ai-smart' && selectedProducts.length === 0 && scoredProducts.length > 0) {
      const top3 = scoredProducts.slice(0, 3).map(sp => ({
        productId: String(sp.product.id),
        variantId: sp.product.variants?.[0]?.id || '',
        quantity: 1,
      }));
      setSelectedProducts(top3);
    }
  }, [scoredProducts]);

  const handleToggleProduct = (productId: string) => {
    setSelectedProducts(prev => {
      const exists = prev.find(p => p.productId === productId);
      if (exists) {
        return prev.filter(p => p.productId !== productId);
      }
      const product = products.find(p => String(p.id) === productId);
      const defaultVariantId = product?.variants?.[0]?.id || '';
      return [...prev, { productId, variantId: defaultVariantId, quantity: 1 }];
    });
  };

  const handleVariantChange = (productId: string, variantId: string) => {
    setSelectedProducts(prev =>
      prev.map(p => p.productId === productId ? { ...p, variantId } : p)
    );
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    setSelectedProducts(prev =>
      prev.map(p => p.productId === productId ? { ...p, quantity: Math.max(1, quantity) } : p)
    );
  };

  const getComboItems = (): ComboItemInput[] => {
    return selectedProducts.map(sp => ({
      productId: sp.productId,
      variantId: sp.variantId || undefined,
      quantity: sp.quantity,
    }));
  };

  // Calculate combo price in realtime
  const comboPricePreview = useMemo(() => {
    let total = 0;
    for (const sp of selectedProducts) {
      const product = products.find(p => String(p.id) === sp.productId);
      if (!product) continue;
      const variant = product.variants?.find(v => v.id === sp.variantId);
      const price = variant?.price ?? product.price ?? 0;
      total += price * sp.quantity;
    }
    const discount = activeTab === 'manual' ? manualDiscount : 15; // AI default ~15%
    const discounted = total * (1 - discount / 100);
    return { original: total, discounted, discount };
  }, [selectedProducts, products, manualDiscount, activeTab]);

  // Generate AI Combo
  const handleGenerate = async () => {
    if (!hashtag.trim()) {
      setError('Vui lòng nhập Hashtag (VD: #championsleague)');
      return;
    }
    if (selectedProducts.length === 0) {
      setError('Vui lòng chọn ít nhất 1 sản phẩm cho Combo!');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    setPublishSuccess(false);

    try {
      const data = await generateAiCombo(hashtag, getComboItems());
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi gọi AI.');
    } finally {
      setLoading(false);
    }
  };

  // Create Manual Combo
  const handleCreateManual = async () => {
    if (!manualName.trim()) {
      setError('Vui lòng nhập tên Combo');
      return;
    }
    if (selectedProducts.length === 0) {
      setError('Vui lòng chọn ít nhất 1 sản phẩm!');
      return;
    }
    if (!manualImageUrl) {
      setError('Vui lòng upload ảnh cho Combo!');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    setPublishSuccess(false);

    try {
      const data = await createManualCombo({
        hashtag: hashtag.trim() || '#combo',
        comboName: manualName,
        description: manualDesc,
        discountPercentage: manualDiscount,
        imageUrl: manualImageUrl,
        items: getComboItems(),
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tạo Combo.');
    } finally {
      setLoading(false);
    }
  };

  // Upload image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    setError('');
    try {
      const url = await uploadComboImage(file);
      setManualImageUrl(url);
    } catch (err: any) {
      setError(err.message || 'Lỗi upload ảnh');
    } finally {
      setIsUploadingImage(false);
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

  const isProductSelected = (productId: string) => selectedProducts.some(p => p.productId === productId);
  const getSelectedVariant = (productId: string) => selectedProducts.find(p => p.productId === productId)?.variantId || '';
  const getSelectedQty = (productId: string) => selectedProducts.find(p => p.productId === productId)?.quantity || 1;

  // ─── Product Selector with Variant ───────────────────────────────

  const renderProductSelector = (productList: { product: Product; score?: number; stock?: number; sold?: number }[], showScore: boolean) => (
    <div className="max-h-72 overflow-y-auto space-y-1.5 p-1">
      {productList.map((item, idx) => {
        const p = item.product;
        const pid = String(p.id);
        const selected = isProductSelected(pid);
        return (
          <div key={pid} className={`rounded-xl border transition-all ${selected ? 'border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/20' : 'border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}>
            {/* Product Row */}
            <label className="flex items-center gap-3 p-3 cursor-pointer">
              <input
                type="checkbox"
                className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                checked={selected}
                onChange={() => handleToggleProduct(pid)}
              />
              {showScore && <span className="text-xs font-bold text-neutral-400 w-5">#{idx + 1}</span>}
              <div className="h-8 w-8 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
                <img src={p.thumbnail || p.image} alt={p.name} className="h-full w-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-bold text-neutral-900 dark:text-white block truncate">{p.name}</span>
                {showScore && (
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    Kho: {item.stock} · Đã bán: {item.sold}
                  </span>
                )}
              </div>
              {showScore && item.score !== undefined && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${getScoreColor(item.score)}`}>
                  <span>{item.score.toFixed(1)}</span>
                  <span className="hidden sm:inline text-[10px] opacity-75">({getScoreLabel(item.score)})</span>
                </div>
              )}
            </label>

            {/* Variant Selector (shown when product is selected) */}
            {selected && p.variants && p.variants.length > 0 && (
              <div className="px-3 pb-3 ml-10 flex flex-wrap items-center gap-2">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">Loại:</span>
                <select
                  value={getSelectedVariant(pid)}
                  onChange={e => handleVariantChange(pid, e.target.value)}
                  className="text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-purple-500/50 outline-none dark:text-white"
                >
                  {p.variants.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.weightValue}{v.weightUnit} — {Number(v.price).toLocaleString('vi-VN')}đ
                    </option>
                  ))}
                </select>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-2">SL:</span>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={getSelectedQty(pid)}
                  onChange={e => handleQuantityChange(pid, parseInt(e.target.value) || 1)}
                  className="w-14 text-xs text-center bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-1 py-1.5 focus:ring-2 focus:ring-purple-500/50 outline-none dark:text-white"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Form */}
        <div className="flex-1 bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              🤖 Combo Generator
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
              Tạo combo bằng AI hoặc thủ công — chọn sản phẩm + loại cụ thể
            </p>
          </div>

          <div className="space-y-5">
            {/* Tab Switcher — 3 tabs */}
            <div className="flex rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1 gap-1">
              <button
                onClick={() => handleTabSwitch('ai-smart')}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'ai-smart'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700'
                }`}
              >
                <span className="material-symbols-outlined !text-base">auto_awesome</span>
                AI Thông minh
              </button>
              <button
                onClick={() => handleTabSwitch('ai-manual')}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'ai-manual'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-md'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700'
                }`}
              >
                <span className="material-symbols-outlined !text-base">checklist</span>
                AI Chọn tay
              </button>
              <button
                onClick={() => handleTabSwitch('manual')}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'manual'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700'
                }`}
              >
                <span className="material-symbols-outlined !text-base">edit_note</span>
                Tạo thủ công
              </button>
            </div>

            {/* Hashtag Input — shared for AI tabs and manual */}
            <div>
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Trending Hashtag {activeTab !== 'manual' && <span className="text-red-500">*</span>}
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

            {/* Manual-only fields */}
            {activeTab === 'manual' && (
              <>
                <div>
                  <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Tên Combo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Combo Siêu Tiết Kiệm Mùa Hè"
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-green-500/50 focus:border-green-500 outline-none transition-all dark:text-white"
                    value={manualName}
                    onChange={e => setManualName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Mô tả combo..."
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-green-500/50 focus:border-green-500 outline-none transition-all dark:text-white resize-none"
                    value={manualDesc}
                    onChange={e => setManualDesc(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Giảm giá (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    className="w-32 px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-green-500/50 focus:border-green-500 outline-none transition-all dark:text-white"
                    value={manualDiscount}
                    onChange={e => setManualDiscount(Number(e.target.value))}
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Ảnh Combo <span className="text-red-500">*</span>
                  </label>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  {manualImageUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700">
                      <img src={manualImageUrl} alt="Combo" className="w-full h-40 object-cover" />
                      <button
                        onClick={() => { setManualImageUrl(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <span className="material-symbols-outlined !text-sm">close</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="w-full h-32 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      {isUploadingImage ? (
                        <span className="text-sm text-neutral-500 animate-pulse">Đang upload...</span>
                      ) : (
                        <>
                          <span className="material-symbols-outlined !text-2xl text-neutral-400">cloud_upload</span>
                          <span className="text-sm text-neutral-500">Nhấn để chọn ảnh</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Product Selector */}
            <div>
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                Chọn sản phẩm + loại <span className="text-red-500">*</span>
              </label>

              {activeTab === 'ai-smart' && (
                <>
                  <div className="flex items-center gap-2 p-2.5 bg-purple-50 dark:bg-purple-950/30 rounded-xl text-xs text-purple-600 dark:text-purple-400 font-medium mb-2">
                    <span className="material-symbols-outlined !text-sm">lightbulb</span>
                    Score cao = tồn nhiều, bán ít → ưu tiên đẩy. Chọn loại cụ thể cho mỗi SP.
                  </div>
                  {renderProductSelector(scoredProducts.map(sp => ({ product: sp.product, score: sp.score, stock: sp.stock, sold: sp.sold })), true)}
                </>
              )}

              {activeTab === 'ai-manual' && (
                renderProductSelector(products.map(p => ({ product: p })), false)
              )}

              {activeTab === 'manual' && (
                renderProductSelector(products.map(p => ({ product: p })), false)
              )}

              {/* Selected summary + price preview */}
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-neutral-500">
                  Đã chọn: <span className="font-bold text-purple-500">{selectedProducts.length}</span> sản phẩm
                </p>
                {selectedProducts.length > 0 && (
                  <div className="text-xs text-right">
                    <span className="text-neutral-400 line-through mr-2">{comboPricePreview.original.toLocaleString('vi-VN')}đ</span>
                    <span className="font-bold text-green-500">{comboPricePreview.discounted.toLocaleString('vi-VN')}đ</span>
                    <span className="text-red-500 ml-1 font-bold">(-{comboPricePreview.discount}%)</span>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined !text-lg">warning</span>
                {error}
              </div>
            )}

            {/* Action Button */}
            {activeTab === 'manual' ? (
              <button
                onClick={handleCreateManual}
                disabled={loading}
                className={`w-full py-3 px-4 rounded-xl font-bold text-white shadow-lg transition-all ${
                  loading
                    ? 'bg-neutral-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 hover:shadow-xl hover:-translate-y-0.5'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang tạo Combo...
                  </span>
                ) : '📦 Tạo Combo Thủ Công'}
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={loading}
                className={`w-full py-3 px-4 rounded-xl font-bold text-white shadow-lg transition-all ${
                  loading
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
            )}
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
                {activeTab === 'manual' ? 'Đang tạo Combo thủ công...' : 'Đang triệu hồi Giám đốc Marketing Gemini\nvà Designer AI...'}
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
                  <img src={result.imageUrl} alt="Combo Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">Không có ảnh</div>
                )}
                <div className="absolute top-4 right-4 bg-red-500 text-white font-black text-xl px-4 py-2 rounded-full transform rotate-12 shadow-lg border-2 border-white">
                  -{result.discount_percentage}%
                </div>
                {result.source && (
                  <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg ${result.source === 'AI' ? 'bg-purple-500' : 'bg-green-500'}`}>
                    {result.source === 'AI' ? '🤖 AI Generated' : '✏️ Manual'}
                  </div>
                )}
                {result.image_prompt && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white/80 text-xs italic line-clamp-2">Prompt: {result.image_prompt}</p>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
                  HOT TREND
                </div>
                <h3 className="text-2xl font-black text-neutral-900 dark:text-white mb-1 leading-tight">
                  {result.combo_name}
                </h3>
                {result.slogan && (
                  <p className="text-pink-500 font-bold mb-3">
                    "{result.slogan}"
                  </p>
                )}

                {/* Combo Price */}
                {result.comboPrice != null && (
                  <div className="mb-3 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-primary-500">{Number(result.comboPrice).toLocaleString('vi-VN')}đ</span>
                    <span className="text-sm text-neutral-400 line-through">{comboPricePreview.original.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}

                {/* Items in combo as chips */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {selectedProducts.map(sp => {
                    const p = products.find(pr => String(pr.id) === sp.productId);
                    const v = p?.variants?.find(vr => vr.id === sp.variantId);
                    return (
                      <span key={sp.productId} className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg text-xs font-medium">
                        {p?.name} {v ? `(${v.weightValue}${v.weightUnit})` : ''} x{sp.quantity}
                      </span>
                    );
                  })}
                </div>

                {result.description && (
                  <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-xl relative">
                    <div className="text-neutral-600 dark:text-neutral-300 text-sm whitespace-pre-wrap italic">
                      {result.description}
                    </div>
                    <span className="absolute top-2 left-2 text-4xl text-neutral-200 dark:text-neutral-700 opacity-50 block leading-none font-serif -z-10">"</span>
                  </div>
                )}

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
