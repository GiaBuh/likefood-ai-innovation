
import React from 'react';
import { Product, ProductStatus, PaginationMeta } from '../../types';
import Skeleton from '../ui/Skeleton';

interface ProductsTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete?: (productId: string | number) => void;
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
}

const ProductStatusBadge: React.FC<{ status: ProductStatus }> = ({ status }) => {
  const styles = {
    Active: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    Draft: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300',
    Archived: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  };

  const dotStyles = {
    Active: 'bg-green-600 dark:bg-green-400',
    Draft: 'bg-gray-500 dark:bg-gray-400',
    Archived: 'bg-red-600 dark:bg-red-400',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${dotStyles[status]}`}></span>
      {status}
    </span>
  );
};

const ProductsTable: React.FC<ProductsTableProps> = ({ products, onEdit, onDelete, pagination, onPageChange, isLoading = false }) => {
  const page = pagination?.page ?? 1;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const displayTotal = pagination?.total ?? products.length;

  return (
    <div className="overflow-hidden rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-subtext-light dark:text-subtext-dark">
          <thead className="bg-background-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark text-xs uppercase text-subtext-light dark:text-subtext-dark font-semibold">
            <tr>
              <th scope="col" className="px-6 py-4">Product</th>
              <th scope="col" className="px-6 py-4">SKU</th>
              <th scope="col" className="px-6 py-4">Category</th>
              <th scope="col" className="px-6 py-4">Variants (Weight)</th>
              <th scope="col" className="px-6 py-4">Price</th>
              <th scope="col" className="px-6 py-4">Status</th>
              <th scope="col" className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light dark:divide-border-dark">
            {isLoading ? (
               // Loading Skeletons
               [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex flex-col gap-1">
                           <Skeleton className="h-3 w-32" />
                           <Skeleton className="h-2 w-24" />
                        </div>
                     </div>
                  </td>
                  <td className="px-6 py-4"><Skeleton className="h-3 w-20" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-3 w-24" /></td>
                  <td className="px-6 py-4">
                     <div className="flex gap-1">
                        <Skeleton className="h-5 w-12 rounded" />
                        <Skeleton className="h-5 w-12 rounded" />
                     </div>
                  </td>
                  <td className="px-6 py-4"><Skeleton className="h-3 w-16" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                  <td className="px-6 py-4 text-right">
                     <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <Skeleton className="h-8 w-8 rounded-lg" />
                     </div>
                  </td>
                </tr>
               ))
            ) : (
              products.map((product) => {
                  // Calculate Price Range
                  const prices = product.variants.map(v => v.price);
                  const minPrice = Math.min(...prices);
                  const maxPrice = Math.max(...prices);

                  return (
                    <tr key={product.id} className="hover:bg-background-light dark:hover:bg-background-dark/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 border border-border-light dark:border-border-dark">
                              <img src={product.thumbnail} alt={product.name} className="h-full w-full object-cover" />
                          </div>
                          <div className="flex flex-col">
                              <span className="font-medium text-text-light dark:text-text-dark">{product.name}</span>
                              <span className="text-xs text-subtext-light dark:text-subtext-dark truncate max-w-[150px]">{product.description}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs whitespace-nowrap">{product.sku}</td>
                      <td className="px-6 py-4">{product.categoryName}</td>
                      <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                              {product.variants.map((v, idx) => (
                                  <span key={idx} className="inline-flex items-center rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 border border-border-light dark:border-border-dark">
                                      {v.weightValue}{v.weightUnit}
                                  </span>
                              ))}
                              {product.variants.length === 0 && <span className="text-xs text-subtext-light">No options</span>}
                          </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-text-light dark:text-text-dark">
                        {prices.length > 1 && minPrice !== maxPrice ? (
                            <div className="flex flex-col">
                                <span>${minPrice.toFixed(2)} -</span>
                                <span>${maxPrice.toFixed(2)}</span>
                            </div>
                        ) : (
                            <span>${(prices[0] || 0).toFixed(2)}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <ProductStatusBadge status={product.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                              onClick={() => onEdit(product)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-background-light dark:hover:bg-background-dark text-subtext-light dark:text-subtext-dark hover:text-primary transition-colors"
                          >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button 
                              onClick={() => onDelete && onDelete(product.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-background-light dark:hover:bg-background-dark text-subtext-light dark:text-subtext-dark hover:text-red-500 transition-colors"
                          >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-border-light dark:border-border-dark px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-subtext-light dark:text-subtext-dark">
            Page {page} of {totalPages}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange?.(page - 1)}
            disabled={page <= 1}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-subtext-light dark:text-subtext-dark disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          <button className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-primary px-2 text-white text-sm font-medium transition-colors">
            {page}
          </button>
          <button
            onClick={() => onPageChange?.(page + 1)}
            disabled={page >= totalPages}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-subtext-light dark:text-subtext-dark disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
          <span className="ml-2 text-sm text-subtext-light dark:text-subtext-dark">Total: {displayTotal}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductsTable;
