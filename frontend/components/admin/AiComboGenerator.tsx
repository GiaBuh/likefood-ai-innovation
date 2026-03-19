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
  score?: number;
  stock?: number;
  sold?: number;
}

function formatVND(n: number): string {
  return n.toLocaleString('vi-VN') + 'đ';
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
  const [searchQuery, setSearchQuery] = useState('');

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
    setSearchQuery('');
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

  const comboPricePreview = useMemo(() => {
    let total = 0;
    for (const sp of selectedProducts) {
      const product = products.find(p => String(p.id) === sp.productId);
      if (!product) continue;
      const variant = product.variants?.find(v => v.id === sp.variantId);
      const price = variant?.price ?? product.price ?? 0;
      total += price * sp.quantity;
    }
    const discount = activeTab === 'manual' ? manualDiscount : 15;
    const discounted = total * (1 - discount / 100);
    return { original: total, discounted, discount };
  }, [selectedProducts, products, manualDiscount, activeTab]);

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

  // Filtered products
  const getDisplayProducts = () => {
    const list = activeTab === 'ai-smart'
      ? scoredProducts.map(sp => ({ product: sp.product, score: sp.score, stock: sp.stock, sold: sp.sold }))
      : products.map(p => ({ product: p, score: undefined, stock: undefined, sold: undefined }));

    if (!searchQuery.trim()) return list;
    return list.filter(item => item.product.name.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  const displayProducts = getDisplayProducts();
  const showScore = activeTab === 'ai-smart';

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent flex items-center gap-2">
              🤖 Combo Generator
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-0.5">
              Tạo combo đu trend bằng AI hoặc thủ công
            </p>
          </div>
          {/* Tab Switcher */}
          <div className="flex rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1 gap-1">
            <button
              onClick={() => handleTabSwitch('ai-smart')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'ai-smart'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700'
              }`}
            >
              <span className="material-symbols-outlined !text-sm">auto_awesome</span>
              AI Thông minh
            </button>
            <button
              onClick={() => handleTabSwitch('ai-manual')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'ai-manual'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-md'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700'
              }`}
            >
              <span className="material-symbols-outlined !text-sm">checklist</span>
              AI Chọn tay
            </button>
            <button
              onClick={() => handleTabSwitch('manual')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'manual'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700'
              }`}
            >
              <span className="material-symbols-outlined !text-sm">edit_note</span>
              Tạo thủ công
            </button>
          </div>
        </div>
      </div>

      {/* ═══ 3-Column Body ═══ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── COL 1: Config ── */}
        <div className="w-[300px] flex-shrink-0 border-r border-neutral-100 dark:border-neutral-800 flex flex-col overflow-y-auto"
          style={{ scrollbarWidth: 'none' }}>
          <div className="p-5 space-y-4 flex-1">
            {/* Hashtag */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 mb-1.5 uppercase tracking-wider">
                # Trending Hashtag {activeTab !== 'manual' && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-400 text-sm">#</span>
                <input
                  type="text"
                  placeholder="championsleague, rapviet..."
                  className="w-full pl-7 pr-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all dark:text-white"
                  value={hashtag.replace('#', '')}
                  onChange={(e) => setHashtag('#' + e.target.value.replace('#', ''))}
                />
              </div>
            </div>

            {/* Manual-only fields */}
            {activeTab === 'manual' && (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 mb-1.5 uppercase tracking-wider">
                    Tên Combo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Combo Siêu Tiết Kiệm"
                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:ring-2 focus:ring-green-500/50 outline-none dark:text-white"
                    value={manualName}
                    onChange={e => setManualName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 mb-1.5 uppercase tracking-wider">
                    Mô tả
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Mô tả combo..."
                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:ring-2 focus:ring-green-500/50 outline-none dark:text-white resize-none"
                    value={manualDesc}
                    onChange={e => setManualDesc(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 mb-1.5 uppercase tracking-wider">
                    Giảm giá (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    className="w-24 px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:ring-2 focus:ring-green-500/50 outline-none dark:text-white"
                    value={manualDiscount}
                    onChange={e => setManualDiscount(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 mb-1.5 uppercase tracking-wider">
                    Ảnh Combo <span className="text-red-500">*</span>
                  </label>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  {manualImageUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700">
                      <img src={manualImageUrl} alt="Combo" className="w-full h-28 object-cover" />
                      <button
                        onClick={() => { setManualImageUrl(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <span className="material-symbols-outlined !text-xs">close</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="w-full h-24 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      {isUploadingImage ? (
                        <span className="text-xs text-neutral-500 animate-pulse">Đang upload...</span>
                      ) : (
                        <>
                          <span className="material-symbols-outlined !text-xl text-neutral-400">cloud_upload</span>
                          <span className="text-xs text-neutral-500">Nhấn để chọn ảnh</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Smart tab info */}
            {activeTab === 'ai-smart' && (
              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl text-[11px] text-purple-600 dark:text-purple-400 font-medium flex items-start gap-2">
                <span className="material-symbols-outlined !text-sm mt-0.5">lightbulb</span>
                <span>Score cao = tồn nhiều, bán ít → ưu tiên đẩy. AI tự động chọn top 3.</span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-2.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined !text-sm">warning</span>
                {error}
              </div>
            )}
          </div>

          {/* Action Button — sticky bottom */}
          <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex-shrink-0">
            {activeTab === 'manual' ? (
              <button
                onClick={handleCreateManual}
                disabled={loading}
                className={`w-full py-3 px-4 rounded-xl font-bold text-white text-sm shadow-lg transition-all ${
                  loading
                    ? 'bg-neutral-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 hover:shadow-xl hover:-translate-y-0.5'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined !text-lg animate-spin">progress_activity</span>
                    Đang tạo...
                  </span>
                ) : '📦 Tạo Combo'}
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={loading}
                className={`w-full py-3 px-4 rounded-xl font-bold text-white text-sm shadow-lg transition-all ${
                  loading
                    ? 'bg-neutral-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 hover:shadow-xl hover:-translate-y-0.5'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined !text-lg animate-spin">progress_activity</span>
                    AI đang tạo...
                  </span>
                ) : '🚀 Bắt AI Tạo Combo!'}
              </button>
            )}
          </div>
        </div>

        {/* ── COL 2: Product Picker ── */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-neutral-100 dark:border-neutral-800">
          {/* Search */}
          <div className="px-4 pt-4 pb-2 flex-shrink-0">
            <div className="relative">
              <span className="material-symbols-outlined !text-lg text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2">search</span>
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm sản phẩm..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 focus:border-transparent outline-none placeholder:text-neutral-400" />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                  <span className="material-symbols-outlined !text-sm">close</span>
                </button>
              )}
            </div>
          </div>

          {/* Product List */}
          <div className="flex-1 overflow-y-auto px-4 pb-4" style={{ scrollbarWidth: 'none' }}>
            <p className="text-[10px] font-bold text-neutral-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined !text-sm text-purple-500">inventory_2</span>
              Sản phẩm ({displayProducts.length})
            </p>

            {displayProducts.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined !text-3xl text-neutral-300 dark:text-neutral-600 block mb-1">search_off</span>
                <p className="text-xs text-neutral-400">Không tìm thấy "{searchQuery}"</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {displayProducts.map((item, idx) => {
                  const p = item.product;
                  const pid = String(p.id);
                  const selected = isProductSelected(pid);
                  return (
                    <div key={pid} className={`rounded-xl border transition-all ${selected ? 'border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/20' : 'border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}`}>
                      <label className="flex items-center gap-2.5 p-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 flex-shrink-0"
                          checked={selected}
                          onChange={() => handleToggleProduct(pid)}
                        />
                        {showScore && <span className="text-[10px] font-bold text-neutral-400 w-4 text-center">#{idx + 1}</span>}
                        <div className="h-8 w-8 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
                          <img src={p.thumbnail || p.image} alt={p.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-neutral-900 dark:text-white block truncate">{p.name}</span>
                          {showScore && (
                            <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                              Kho: {item.stock} · Bán: {item.sold}
                            </span>
                          )}
                          {!showScore && p.price != null && (
                            <span className="text-[10px] text-neutral-400">{formatVND(p.price)}</span>
                          )}
                        </div>
                        {showScore && item.score !== undefined && (
                          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${getScoreColor(item.score)}`}>
                            <span>{item.score.toFixed(1)}</span>
                            <span className="hidden lg:inline opacity-75">{getScoreLabel(item.score)}</span>
                          </div>
                        )}
                      </label>

                      {/* Variant + Qty selector */}
                      {selected && p.variants && p.variants.length > 0 && (
                        <div className="px-2.5 pb-2.5 ml-9 flex flex-wrap items-center gap-2">
                          <select
                            value={getSelectedVariant(pid)}
                            onChange={e => handleVariantChange(pid, e.target.value)}
                            className="text-[11px] bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-purple-500/50 outline-none dark:text-white"
                          >
                            {p.variants.map(v => (
                              <option key={v.id} value={v.id}>
                                {v.weightValue}{v.weightUnit} — {formatVND(Number(v.price))}
                              </option>
                            ))}
                          </select>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-neutral-400">SL:</span>
                            <input
                              type="number"
                              min={1}
                              max={99}
                              value={getSelectedQty(pid)}
                              onChange={e => handleQuantityChange(pid, parseInt(e.target.value) || 1)}
                              className="w-12 text-[11px] text-center bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-1 py-1.5 focus:ring-2 focus:ring-purple-500/50 outline-none dark:text-white"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected summary bar */}
          <div className="px-4 py-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between flex-shrink-0 bg-neutral-50/50 dark:bg-neutral-800/30">
            <p className="text-xs text-neutral-500">
              Đã chọn: <span className="font-bold text-purple-500">{selectedProducts.length}</span> sản phẩm
            </p>
            {selectedProducts.length > 0 && (
              <div className="text-xs text-right">
                <span className="text-neutral-400 line-through mr-1.5">{formatVND(comboPricePreview.original)}</span>
                <span className="font-bold text-green-500">{formatVND(Math.round(comboPricePreview.discounted))}</span>
                <span className="text-red-500 ml-1 font-bold text-[10px]">(-{comboPricePreview.discount}%)</span>
              </div>
            )}
          </div>
        </div>

        {/* ── COL 3: Preview / Result ── */}
        <div className="w-[380px] flex-shrink-0 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {/* Loading state */}
          {loading && !result && (
            <div className="flex flex-col items-center justify-center h-full space-y-4 text-center p-8">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 border-4 border-purple-200 rounded-full animate-pulse" />
                <div className="absolute inset-0 border-t-4 border-purple-600 rounded-full animate-spin" />
              </div>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm animate-pulse">
                {activeTab === 'manual' ? 'Đang tạo Combo...' : 'Đang triệu hồi AI...'}
              </p>
            </div>
          )}

          {/* No result — Live Preview */}
          {!loading && !result && (
            <div className="p-5 h-full flex flex-col">
              <p className="text-[10px] font-bold text-neutral-400 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined !text-sm text-purple-500">preview</span>
                Xem trước Combo
              </p>

              {selectedProducts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-2xl p-6">
                  <span className="text-3xl mb-2">✨</span>
                  <p className="text-xs text-neutral-400">Chọn sản phẩm để xem trước combo</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden shadow-sm">
                  {/* Preview banner */}
                  <div className="h-32 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center relative">
                    <span className="text-white text-3xl font-black opacity-20">COMBO</span>
                    <div className="absolute top-3 right-3 bg-red-500 text-white font-black text-sm px-3 py-1 rounded-full transform rotate-12 shadow-lg border-2 border-white">
                      -{comboPricePreview.discount}%
                    </div>
                    {hashtag && (
                      <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-[10px] font-bold">
                        {hashtag}
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Name */}
                    <div>
                      <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Tên combo</p>
                      <p className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">
                        {activeTab === 'manual' && manualName ? manualName : hashtag ? `Combo ${hashtag}` : 'Combo Đu Trend'}
                      </p>
                    </div>

                    {/* Items */}
                    <div>
                      <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1.5">Sản phẩm ({selectedProducts.length})</p>
                      <div className="space-y-1.5">
                        {selectedProducts.map(sp => {
                          const p = products.find(pr => String(pr.id) === sp.productId);
                          const v = p?.variants?.find(vr => vr.id === sp.variantId);
                          const price = v?.price ?? p?.price ?? 0;
                          return (
                            <div key={sp.productId} className="flex items-center gap-2 p-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                              <div className="w-8 h-8 rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-700 flex-shrink-0">
                                <img src={p?.thumbnail || p?.image} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-semibold text-neutral-800 dark:text-white truncate">{p?.name}</p>
                                <p className="text-[10px] text-neutral-400">
                                  {v ? `${v.weightValue}${v.weightUnit}` : ''} x{sp.quantity} · {formatVND(price * sp.quantity)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Price summary */}
                    <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] text-neutral-400">Giá gốc</span>
                        <span className="text-xs text-neutral-400 line-through">{formatVND(comboPricePreview.original)}</span>
                      </div>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Giá combo</span>
                        <span className="text-lg font-black text-purple-500">{formatVND(Math.round(comboPricePreview.discounted))}</span>
                      </div>
                      <div className="flex items-center justify-end mt-1">
                        <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                          Tiết kiệm {formatVND(Math.round(comboPricePreview.original - comboPricePreview.discounted))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Result */}
          {result && (
            <div className="p-4">
              <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl overflow-hidden border border-neutral-100 dark:border-neutral-800">
                <div className="relative h-48 bg-neutral-200 dark:bg-neutral-800 overflow-hidden group">
                  {result.imageUrl ? (
                    <img src={result.imageUrl} alt="Combo Banner" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400">Không có ảnh</div>
                  )}
                  <div className="absolute top-3 right-3 bg-red-500 text-white font-black text-lg px-3 py-1.5 rounded-full transform rotate-12 shadow-lg border-2 border-white">
                    -{result.discount_percentage}%
                  </div>
                  {result.source && (
                    <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-lg ${result.source === 'AI' ? 'bg-purple-500' : 'bg-green-500'}`}>
                      {result.source === 'AI' ? '🤖 AI Generated' : '✏️ Manual'}
                    </div>
                  )}
                  {result.image_prompt && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white/80 text-[10px] italic line-clamp-2">Prompt: {result.image_prompt}</p>
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  <div className="inline-block px-2.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                    HOT TREND
                  </div>
                  <h3 className="text-lg font-black text-neutral-900 dark:text-white leading-tight">
                    {result.combo_name}
                  </h3>
                  {result.slogan && (
                    <p className="text-pink-500 font-bold text-sm">
                      "{result.slogan}"
                    </p>
                  )}

                  {result.comboPrice != null && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-purple-500">{formatVND(Number(result.comboPrice))}</span>
                      <span className="text-sm text-neutral-400 line-through">{formatVND(comboPricePreview.original)}</span>
                    </div>
                  )}

                  {/* Items chips */}
                  <div className="flex flex-wrap gap-1">
                    {selectedProducts.map(sp => {
                      const p = products.find(pr => String(pr.id) === sp.productId);
                      const v = p?.variants?.find(vr => vr.id === sp.variantId);
                      return (
                        <span key={sp.productId} className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-md text-[10px] font-medium">
                          {p?.name} {v ? `(${v.weightValue}${v.weightUnit})` : ''} x{sp.quantity}
                        </span>
                      );
                    })}
                  </div>

                  {result.description && (
                    <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-xl relative">
                      <div className="text-neutral-600 dark:text-neutral-300 text-xs whitespace-pre-wrap italic">
                        {result.description}
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    {publishSuccess ? (
                      <div className="w-full py-2.5 bg-green-500 text-white rounded-xl font-bold text-sm flex justify-center flex-col items-center">
                        <span>✅ Đã đưa lên cửa hàng!</span>
                        <span className="text-[10px] opacity-75">Xem tại trang Combo</span>
                      </div>
                    ) : (
                      <button
                        onClick={handlePublish}
                        disabled={isPublishing}
                        className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${
                          isPublishing
                            ? 'bg-neutral-400 text-white cursor-not-allowed'
                            : 'bg-gradient-to-r from-neutral-900 to-neutral-700 dark:from-white dark:to-neutral-200 text-white dark:text-neutral-900 hover:shadow-xl hover:-translate-y-0.5'
                        }`}
                      >
                        {isPublishing ? 'Đang xuất bản...' : '🚀 Publish lên Combo'}
                      </button>
                    )}
                  </div>
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
