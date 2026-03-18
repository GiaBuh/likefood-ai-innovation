import React, { useState, useEffect, useCallback } from 'react';
import Skeleton from '../ui/Skeleton';
import {
  fetchAllFlashSales,
  createFlashSale,
  updateFlashSale,
  deleteFlashSale,
  FlashSaleEventResponse,
  FlashSaleEventRequest,
  FlashSaleItemRequest,
} from '../../services/flashSaleApi';
import { Product, ProductVariant } from '../../types';

const S3_BASE = (((import.meta as any).env?.VITE_S3_PUBLIC_BASE_URL as string) || '').replace(/\/+$/, '');
function resolveImage(key: string | null | undefined): string {
  if (!key) return '';
  if (key.startsWith('http')) return key;
  return `${S3_BASE}/${key}`;
}

const pad2 = (n: number) => String(n).padStart(2, '0');
function toLocalDatetimeStr(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

// ─── Flash Sale Item with variant info ───
interface FlashSaleFormItem {
  productId: string;
  variantId?: string;
  salePrice: number;
  stock: number;
}

// ─── Event Form Modal ───
const FlashSaleFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: FlashSaleEventRequest) => Promise<void>;
  products: Product[];
  initial?: FlashSaleEventResponse | null;
}> = ({ isOpen, onClose, onSave, products, initial }) => {
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [items, setItems] = useState<FlashSaleFormItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setStartTime(toLocalDatetimeStr(initial.startTime));
      setEndTime(toLocalDatetimeStr(initial.endTime));
      setItems(initial.items.map(i => ({
        productId: i.productId,
        variantId: i.variantId || undefined,
        salePrice: i.salePrice,
        stock: i.stock,
      })));
    } else {
      setName('');
      setStartTime('');
      setEndTime('');
      setItems([]);
    }
    setError('');
    setShowPicker(false);
  }, [initial, isOpen]);

  // Use productId+variantId as unique key
  const usedKeys = new Set(items.map(i => `${i.productId}__${i.variantId || 'default'}`));

  const addVariant = (product: Product, variant: ProductVariant) => {
    const key = `${product.id}__${variant.id}`;
    if (usedKeys.has(key)) return;
    setItems(prev => [...prev, {
      productId: String(product.id),
      variantId: variant.id,
      salePrice: Math.round(variant.price * 0.7 * 100) / 100,
      stock: variant.quantity || 50,
    }]);
  };

  const addProductDefault = (product: Product) => {
    // Product with no variants — add with no variantId
    const key = `${product.id}__default`;
    if (usedKeys.has(key)) return;
    const price = product.price || 0;
    setItems(prev => [...prev, {
      productId: String(product.id),
      salePrice: Math.round(price * 0.7 * 100) / 100,
      stock: 50,
    }]);
  };

  const updateItem = (idx: number, field: keyof FlashSaleFormItem, value: any) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Vui lòng nhập tên khung giờ'); return; }
    if (!startTime || !endTime) { setError('Vui lòng chọn thời gian'); return; }
    if (items.length === 0) { setError('Vui lòng thêm ít nhất 1 sản phẩm'); return; }

    setSaving(true);
    setError('');
    try {
      await onSave({
        name,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        isActive: true,
        items: items.map(i => ({
          productId: i.productId,
          variantId: i.variantId,
          salePrice: i.salePrice,
          stock: i.stock,
        })),
      });
      onClose();
    } catch (e: any) {
      setError(e.message || 'Lỗi khi lưu');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h2 className="text-lg font-extrabold text-neutral-900 dark:text-white">
              {initial ? 'Chỉnh sửa khung giờ' : 'Tạo khung giờ Flash Sale'}
            </h2>
            <p className="text-sm text-neutral-500">Chọn sản phẩm + biến thể và đặt giá sale</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">Tên khung giờ</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Ví dụ: Khung 15:00 - Combo Siêu Rẻ"
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none" />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">Bắt đầu</label>
              <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">Kết thúc</label>
              <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none" />
            </div>
          </div>

          {/* Products Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                Sản phẩm đã chọn ({items.length})
              </label>
              <button onClick={() => setShowPicker(!showPicker)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-orange-500 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors">
                <span className="material-symbols-outlined !text-sm">{showPicker ? 'expand_less' : 'add'}</span>
                {showPicker ? 'Đóng' : 'Thêm sản phẩm'}
              </button>
            </div>

            {/* ── Product + Variant Picker ── */}
            {showPicker && (
              <div className="mb-4 p-3 bg-neutral-50 dark:bg-neutral-800/30 rounded-xl border border-neutral-200 dark:border-neutral-700 max-h-[300px] overflow-y-auto">
                <p className="text-xs font-semibold text-neutral-500 mb-2">Chọn sản phẩm và biến thể:</p>
                <div className="space-y-3">
                  {products.map(p => {
                    const pid = String(p.id);
                    const hasVariants = p.variants && p.variants.length > 0;

                    return (
                      <div key={pid} className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                        {/* Product Header */}
                        <div className="flex items-center gap-2 p-2">
                          <img src={resolveImage(p.thumbnail)} alt=""
                            className="w-10 h-10 rounded-lg object-cover bg-neutral-200 dark:bg-neutral-700 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-neutral-800 dark:text-white truncate">{p.name}</p>
                            <p className="text-[10px] text-neutral-400">
                              {hasVariants ? `${p.variants.length} biến thể` : `$${p.price}`}
                            </p>
                          </div>
                          {!hasVariants && (
                            <button onClick={() => addProductDefault(p)}
                              disabled={usedKeys.has(`${pid}__default`)}
                              className={`px-2 py-1 text-[10px] font-bold rounded-md ${usedKeys.has(`${pid}__default`) ? 'text-green-500 bg-green-50' : 'text-orange-500 bg-orange-50 hover:bg-orange-100'}`}>
                              {usedKeys.has(`${pid}__default`) ? '✓' : '+ Thêm'}
                            </button>
                          )}
                        </div>
                        {/* Variant List */}
                        {hasVariants && (
                          <div className="px-2 pb-2 flex flex-wrap gap-1.5">
                            {p.variants.map(v => {
                              const vKey = `${pid}__${v.id}`;
                              const isUsed = usedKeys.has(vKey);
                              return (
                                <button key={v.id} onClick={() => !isUsed && addVariant(p, v)} disabled={isUsed}
                                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all ${
                                    isUsed
                                      ? 'bg-green-50 dark:bg-green-900/20 text-green-600 cursor-not-allowed'
                                      : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-500'
                                  }`}>
                                  <span>{v.weight}</span>
                                  <span className="text-neutral-400">·</span>
                                  <span>${v.price}</span>
                                  {v.quantity !== undefined && <span className="text-neutral-400">(SL: {v.quantity})</span>}
                                  {isUsed && <span className="text-green-500">✓</span>}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Selected Items ── */}
            {items.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl">
                <span className="material-symbols-outlined !text-4xl text-neutral-300 dark:text-neutral-600 mb-2 block">add_shopping_cart</span>
                <p className="text-sm text-neutral-400">Bấm "Thêm sản phẩm" để chọn sản phẩm và biến thể</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, idx) => {
                  const product = products.find(p => String(p.id) === item.productId);
                  const variant = item.variantId ? product?.variants?.find(v => v.id === item.variantId) : null;
                  const originalPrice = variant?.price || product?.price || 0;
                  const discount = originalPrice > 0 ? Math.round((1 - item.salePrice / originalPrice) * 100) : 0;
                  return (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-700">
                      <img src={resolveImage(product?.thumbnail)} alt=""
                        className="w-12 h-12 rounded-lg object-cover bg-neutral-200 dark:bg-neutral-700 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{product?.name || 'Unknown'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {variant && (
                            <span className="text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
                              {variant.weight}
                            </span>
                          )}
                          <span className="text-[10px] text-neutral-400">Giá gốc: ${originalPrice}</span>
                          {discount > 0 && (
                            <span className="text-[10px] font-bold text-orange-500 bg-orange-50 dark:bg-orange-900/30 px-1.5 py-0.5 rounded">-{discount}%</span>
                          )}
                        </div>
                      </div>
                      <div className="w-24">
                        <label className="text-[10px] text-neutral-400 block">Giá sale</label>
                        <input type="number" step="0.01" min="0" value={item.salePrice}
                          onChange={e => updateItem(idx, 'salePrice', parseFloat(e.target.value) || 0)}
                          className="w-full text-sm font-bold text-orange-500 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-orange-500" />
                      </div>
                      <div className="w-20">
                        <label className="text-[10px] text-neutral-400 block">Số lượng</label>
                        <input type="number" min="1" value={item.stock}
                          onChange={e => updateItem(idx, 'stock', parseInt(e.target.value) || 1)}
                          className="w-full text-sm font-bold bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-orange-500 text-neutral-900 dark:text-white" />
                      </div>
                      <button onClick={() => removeItem(idx)}
                        className="p-1.5 text-neutral-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors flex-shrink-0">
                        <span className="material-symbols-outlined !text-lg">delete</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-4 py-2 rounded-lg">
              <span className="material-symbols-outlined !text-lg">error</span>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-100 dark:border-neutral-800">
          <button onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors">
            Hủy
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="px-5 py-2.5 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-orange-500/20">
            {saving && <span className="material-symbols-outlined !text-lg animate-spin">progress_activity</span>}
            {initial ? 'Cập nhật' : 'Tạo khung giờ'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Flash Sale Manager ───
const FlashSaleManager: React.FC<{ products: Product[] }> = ({ products }) => {
  const [events, setEvents] = useState<FlashSaleEventResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<FlashSaleEventResponse | null>(null);

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllFlashSales();
      data.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      setEvents(data);
    } catch (e) {
      console.error('Error loading flash sales:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const handleSave = async (data: FlashSaleEventRequest) => {
    if (editingEvent) {
      await updateFlashSale(editingEvent.id, data);
    } else {
      await createFlashSale(data);
    }
    setShowModal(false);
    setEditingEvent(null);
    await loadEvents();
  };

  const handleDelete = async (event: FlashSaleEventResponse) => {
    if (window.confirm(`Xóa khung giờ "${event.name}"?`)) {
      try {
        await deleteFlashSale(event.id);
        await loadEvents();
      } catch (e: any) {
        alert(e.message || 'Lỗi khi xóa');
      }
    }
  };

  const getStatus = (e: FlashSaleEventResponse) => {
    const now = Date.now();
    const start = new Date(e.startTime).getTime();
    const end = new Date(e.endTime).getTime();
    if (now < start) return { label: 'Sắp diễn ra', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' };
    if (now > end) return { label: 'Đã kết thúc', color: 'text-neutral-400 bg-neutral-100 dark:bg-neutral-800' };
    return { label: 'Đang diễn ra', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {events.length} khung giờ Flash Sale
        </p>
        <button onClick={() => { setEditingEvent(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-500 text-white font-bold text-sm rounded-xl hover:from-orange-600 hover:to-orange-600 transition-all shadow-lg shadow-orange-500/20">
          <span className="material-symbols-outlined !text-lg">add</span>
          Tạo khung giờ
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-neutral-900 rounded-xl p-5 border border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-24 rounded-full" />
                <div className="flex-1" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <div className="flex gap-3 mt-4">
                <Skeleton className="h-16 w-16 rounded-lg" />
                <Skeleton className="h-16 w-16 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800">
          <span className="material-symbols-outlined !text-6xl text-neutral-300 dark:text-neutral-600 mb-3 block">flash_off</span>
          <h3 className="text-lg font-bold text-neutral-700 dark:text-neutral-300 mb-2">Chưa có Flash Sale</h3>
          <p className="text-sm text-neutral-400 mb-4">Tạo khung giờ đầu tiên để bắt đầu</p>
          <button onClick={() => { setEditingEvent(null); setShowModal(true); }}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl transition-colors">
            Tạo ngay
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map(event => {
            const status = getStatus(event);
            const startDate = new Date(event.startTime);
            const endDate = new Date(event.endTime);
            const timeRange = `${pad2(startDate.getHours())}:${pad2(startDate.getMinutes())} - ${pad2(endDate.getHours())}:${pad2(endDate.getMinutes())}`;
            const dateStr = `${pad2(startDate.getDate())}/${pad2(startDate.getMonth() + 1)}/${startDate.getFullYear()}`;
            return (
              <div key={event.id} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 p-5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined !text-xl text-orange-500" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                    <h3 className="font-bold text-neutral-900 dark:text-white">{event.name}</h3>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${status.color}`}>{status.label}</span>
                  <div className="flex items-center gap-1.5 text-sm text-neutral-500">
                    <span className="material-symbols-outlined !text-sm">schedule</span>
                    {timeRange}
                  </div>
                  <span className="text-xs text-neutral-400">{dateStr}</span>
                  <div className="flex-1" />
                  <button onClick={() => { setEditingEvent(event); setShowModal(true); }}
                    className="p-2 text-neutral-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Chỉnh sửa">
                    <span className="material-symbols-outlined !text-lg">edit</span>
                  </button>
                  <button onClick={() => handleDelete(event)}
                    className="p-2 text-neutral-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors" title="Xóa">
                    <span className="material-symbols-outlined !text-lg">delete</span>
                  </button>
                </div>
                <div className="px-5 pb-4">
                  <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                    {event.items.map(item => (
                      <div key={item.id} className="flex items-center gap-3 flex-shrink-0 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-2.5 min-w-[220px] border border-neutral-100 dark:border-neutral-700">
                        <img src={resolveImage(item.productImage)} alt="" className="w-12 h-12 rounded-lg object-cover bg-neutral-200 dark:bg-neutral-700" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-neutral-800 dark:text-white truncate">{item.productName}</p>
                          {item.variantLabel && (
                            <span className="text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-1 py-0.5 rounded">{item.variantLabel}</span>
                          )}
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm font-extrabold text-orange-500">${item.salePrice}</span>
                            {item.originalPrice > item.salePrice && (
                              <span className="text-[10px] text-neutral-400 line-through">${item.originalPrice}</span>
                            )}
                          </div>
                          <span className="text-[10px] text-neutral-400">Đã bán: {item.soldCount}/{item.stock}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <FlashSaleFormModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingEvent(null); }}
        onSave={handleSave}
        products={products}
        initial={editingEvent}
      />
    </div>
  );
};

export default FlashSaleManager;
