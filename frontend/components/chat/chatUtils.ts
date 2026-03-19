import type { Product, ProductVariant } from '../../types';

export const stripAccents = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export const normalize = (value: string): string =>
  stripAccents(value).replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

export function hasInStockVariant(product: Product): boolean {
  if (!product.variants?.length) return false;
  return product.variants.some((variant) => Number(variant.quantity ?? 0) > 0);
}

