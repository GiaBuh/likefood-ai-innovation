
import React, { useState, useCallback } from 'react';
import { Product, ProductVariant, ProductStatus, PaginationMeta } from '../../types';
import Skeleton from '../ui/Skeleton';

interface ProductsTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete?: (productId: string | number) => void;
  onToggleVariantBestSeller?: (product: Product, variant: ProductVariant) => void;
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
}

const ProductStatusBadge: React.FC<{ status: ProductStatus }> = ({ status }) => {
  const styles = {
    Active: 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400',
    Draft: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300',
    Archived: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400',
  };
  const dotStyles = {
    Active: 'bg-green-500',
    Draft: 'bg-neutral-400',
    Archived: 'bg-red-500',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${dotStyles[status]}`} />
      {status}
    </span>
  );
};

const ProductsTable: React.FC<ProductsTableProps> = ({ products, onEdit, onDelete, onToggleVariantBestSeller, pagination, onPageChange, isLoading = false }) => {
  const page = pagination?.page ?? 1;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const displayTotal = pagination?.total ?? products.length;
  const [expandedIds, setExpandedIds] = useState<Set<string | number>>(new Set());

  const toggleExpand = useCallback((id: string | number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800 text-xs uppercase text-neutral-500 dark:text-neutral-400 font-semibold">
            <tr>
              <th scope="col" className="w-8 px-2 py-3.5"></th>
              <th scope="col" className="px-4 py-3.5">Sản phẩm</th>
              <th scope="col" className="px-4 py-3.5">Danh mục</th>
              <th scope="col" className="px-4 py-3.5">Loại</th>
              <th scope="col" className="px-4 py-3.5">Giá</th>
              <th scope="col" className="px-4 py-3.5 text-center">Đã bán</th>
              <th scope="col" className="px-4 py-3.5">Trạng thái</th>
              <th scope="col" className="px-4 py-3.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td className="px-2 py-4"><Skeleton className="h-5 w-5 rounded" /></td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-xl" />
                      <div className="flex flex-col gap-1.5">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-2.5 w-24" />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4"><Skeleton className="h-3.5 w-24" /></td>
                  <td className="px-4 py-4"><Skeleton className="h-5 w-16 rounded" /></td>
                  <td className="px-4 py-4"><Skeleton className="h-3.5 w-16" /></td>
                  <td className="px-4 py-4"><Skeleton className="h-3.5 w-10" /></td>
                  <td className="px-4 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-8 rounded-xl" />
                      <Skeleton className="h-8 w-8 rounded-xl" />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              products.map((product) => {
                const isExpanded = expandedIds.has(product.id);
                const variants = product.variants || [];
                const prices = variants.map(v => v.price);
                const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
                const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
                const totalSold = product.totalSoldCount ?? 0;
                const hasBestSeller = variants.some(v => v.bestSeller);

                return (
                  <React.Fragment key={product.id}>
                    <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group">
                      <td className="px-2 py-4">
                        {variants.length > 0 && (
                          <button
                            onClick={() => toggleExpand(product.id)}
                            className="flex h-6 w-6 items-center justify-center rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                          >
                            <span className={`material-symbols-outlined !text-base text-neutral-400 dark:text-neutral-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                              chevron_right
                            </span>
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 overflow-hidden rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 flex-shrink-0">
                            <img src={product.thumbnail} alt={product.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-neutral-900 dark:text-white truncate">{product.name}</span>
                              {hasBestSeller && (
                                <span className="material-symbols-outlined !text-sm text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                              )}
                            </div>
                            <span className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-[150px]">{product.description}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-neutral-600 dark:text-neutral-300">{product.categoryName}</td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-lg font-medium">
                          {variants.length} loại
                        </span>
                      </td>
                      <td className="px-4 py-4 font-bold text-neutral-900 dark:text-white tabular-nums">
                        {prices.length > 1 && minPrice !== maxPrice ? (
                          <div className="flex flex-col text-xs">
                            <span>${minPrice.toFixed(2)} -</span>
                            <span>${maxPrice.toFixed(2)}</span>
                          </div>
                        ) : (
                          <span>${(prices[0] || 0).toFixed(2)}</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`text-sm font-bold tabular-nums ${totalSold > 0 ? 'text-neutral-900 dark:text-white' : 'text-neutral-400 dark:text-neutral-500'}`}>
                          {totalSold}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <ProductStatusBadge status={product.status} />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEdit(product)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl text-neutral-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-all"
                          >
                            <span className="material-symbols-outlined !text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => onDelete && onDelete(product.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                          >
                            <span className="material-symbols-outlined !text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Variant Sub-rows */}
                    {isExpanded && variants.map((variant) => (
                      <tr key={`${product.id}-${variant.id}`} className="bg-neutral-50/50 dark:bg-neutral-800/20">
                        <td className="px-2 py-3"></td>
                        <td className="px-4 py-3" colSpan={2}>
                          <div className="flex items-center gap-2 pl-6">
                            <span className="text-neutral-300 dark:text-neutral-600">└</span>
                            <span className="inline-flex items-center rounded-lg bg-neutral-100 dark:bg-neutral-800 px-2 py-1 text-xs font-medium text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                              {variant.weightValue}{variant.weightUnit}
                            </span>
                            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">{variant.sku}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-neutral-900 dark:text-white font-bold tabular-nums">
                            ${variant.price.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-medium ${(variant.soldCount || 0) > 0 ? 'text-green-600 dark:text-green-400' : 'text-neutral-400 dark:text-neutral-500'}`}>
                            {variant.soldCount || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            KL: {variant.quantity ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); onToggleVariantBestSeller?.(product, variant); }}
                            className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all ml-auto ${
                              variant.bestSeller
                                ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                                : 'text-neutral-300 dark:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-amber-400'
                            }`}
                            title={variant.bestSeller ? 'Bỏ Best Seller' : 'Đánh dấu Best Seller'}
                          >
                            <span className="material-symbols-outlined !text-xl" style={{ fontVariationSettings: variant.bestSeller ? "'FILL' 1" : "'FILL' 0" }}>
                              star
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800 px-6 py-4">
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          Page {page} of {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange?.(page - 1)}
            disabled={page <= 1}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-400 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            <span className="material-symbols-outlined !text-sm">chevron_left</span>
          </button>
          <button className="flex h-8 min-w-8 items-center justify-center rounded-xl bg-primary-500 px-3 text-white text-sm font-bold">
            {page}
          </button>
          <button
            onClick={() => onPageChange?.(page + 1)}
            disabled={page >= totalPages}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-400 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            <span className="material-symbols-outlined !text-sm">chevron_right</span>
          </button>
          <span className="ml-2 text-sm text-neutral-500 dark:text-neutral-400 tabular-nums">Total: {displayTotal}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductsTable;
