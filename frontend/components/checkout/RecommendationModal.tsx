import React from 'react';
import type { CartRecommendationItem } from '../../services/shopApi';

interface RecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendations: CartRecommendationItem[];
  onAddItem: (variantId: string, quantity: number) => Promise<void>;
  onContinue: () => void;
  isLoading?: boolean;
}

const RecommendationModal: React.FC<RecommendationModalProps> = ({
  isOpen,
  onClose,
  recommendations,
  onAddItem,
  onContinue,
  isLoading = false,
}) => {
  const [addingIds, setAddingIds] = React.useState<Set<string>>(new Set());

  const handleAdd = async (item: CartRecommendationItem) => {
    setAddingIds((prev) => new Set(prev).add(item.variantId));
    try {
      await onAddItem(item.variantId, 1);
    } finally {
      setAddingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.variantId);
        return next;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Chờ đã nguời đẹp, người đẹp nên thêm 1 vài món nữa nè
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <span className="material-symbols-outlined animate-spin !text-4xl text-primary">
                progress_activity
              </span>
              <p className="text-stone-500 dark:text-stone-400">Đang gợi ý món phù hợp...</p>
            </div>
          ) : recommendations.length === 0 ? (
            <p className="text-center py-8 text-stone-500 dark:text-stone-400">
              Không có gợi ý thêm. Bạn có thể tiếp tục thanh toán.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-stone-600 dark:text-stone-300 mb-4">
                
              </p>
              {recommendations.map((item) => (
                <div
                  key={item.variantId}
                  className="flex items-center gap-4 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 hover:border-primary/30 transition-colors"
                >
                  <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-stone-200 dark:bg-stone-700">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400">
                        <span className="material-symbols-outlined">restaurant</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">
                      {item.productName}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {item.category} • {item.variant}
                    </p>
                    {item.reason && (
                      <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 line-clamp-2">
                        {item.reason}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-bold text-primary">${Number(item.price).toFixed(2)}</span>
                    <button
                      onClick={() => handleAdd(item)}
                      disabled={addingIds.has(item.variantId)}
                      className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {addingIds.has(item.variantId) ? (
                        <>
                          <span className="material-symbols-outlined !text-sm animate-spin">
                            progress_activity
                          </span>
                          Đang thêm...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined !text-sm">add_shopping_cart</span>
                          Thêm ngay
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-stone-200 dark:border-stone-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 font-medium hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
          >
            Bỏ qua
          </button>
          <button
            onClick={() => {
              onClose();
              onContinue();
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
          >
            Tiếp tục thanh toán
            <span className="material-symbols-outlined !text-lg">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecommendationModal;
