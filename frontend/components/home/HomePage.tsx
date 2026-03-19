import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import BannerCarousel from "./BannerCarousel";
import ShopSidebar from "./ShopSidebar";
import ProductCard from "../product/ProductCard";
import ProductCardSkeleton from "../product/ProductCardSkeleton";
import ProductFilterBar from "../product/ProductFilterBar";
import SocialMediaSection from "./SocialMediaSection";
import MobileFilterModal from "./MobileFilterModal";

import { Product, SortOption } from "../../types";
import { useShop } from "../../contexts/ShopContext";
import { fetchProductsWithQuery } from "../../services/shopApi";

interface HomePageProps {
    onProductClick: (product: Product) => void;
    searchQuery: string;
}

const PAGE_SIZE = 30;

const HomePage: React.FC<HomePageProps> = ({ onProductClick, searchQuery }) => {
    const { products, categories, isLoadingProducts } = useShop();
    const { t } = useTranslation();
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [serverProducts, setServerProducts] = useState<Product[]>([]);
    const [isFilteringProducts, setIsFilteringProducts] = useState(false);

    // URL-synced Filter States
    const [searchParams, setSearchParams] = useSearchParams();
    const categoryFromUrl = searchParams.get('categoryName');
    const sortFromUrl = searchParams.get('sort') as SortOption | null;
    const minPriceFromUrl = searchParams.get('minPrice');
    const maxPriceFromUrl = searchParams.get('maxPrice');

    const [activeCategory, setActiveCategory] = useState<string>(categoryFromUrl || "all");
    const [currentSort, setCurrentSort] = useState<SortOption>(sortFromUrl || "Phổ biến");
    const [priceRange, setPriceRange] = useState<[number, number]>([
        minPriceFromUrl ? Number(minPriceFromUrl) : 1,
        maxPriceFromUrl ? Number(maxPriceFromUrl) : 100,
    ]);

    // Helper to update URL params
    const updateSearchParams = (updates: Record<string, string | null>) => {
        const newParams = new URLSearchParams(searchParams);
        for (const [key, value] of Object.entries(updates)) {
            if (value === null || value === undefined) {
                newParams.delete(key);
            } else {
                newParams.set(key, value);
            }
        }
        setSearchParams(newParams, { replace: true });
    };

    // Sync category to URL so it persists on reload
    const handleCategoryChange = (cat: string) => {
        setActiveCategory(cat);
        updateSearchParams({ categoryName: cat === 'all' ? null : cat });
    };

    // Sync sort to URL
    const handleSortChange = (sort: SortOption) => {
        setCurrentSort(sort);
        updateSearchParams({ sort: sort === 'Phổ biến' ? null : sort });
    };

    // Sync price to URL
    const handlePriceChange = (range: [number, number]) => {
        setPriceRange(range);
        updateSearchParams({
            minPrice: range[0] === 1 ? null : String(range[0]),
            maxPrice: range[1] === 100 ? null : String(range[1]),
        });
    };

    // Server-side Pagination
    const [currentPage, setCurrentPage] = useState(0);

    // Sync URL changes to state & scroll to top when arriving with a category filter
    useEffect(() => {
        setActiveCategory(categoryFromUrl || "all");
        if (categoryFromUrl) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [categoryFromUrl]);

    // Ref for scrolling to products top
    const productsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setServerProducts(products);
    }, [products]);

    useEffect(() => {
        let cancelled = false;
        const normalizedSearch = searchQuery.trim();

        const fetchFilteredProducts = async () => {
            setIsFilteringProducts(true);
            try {
                const response = await fetchProductsWithQuery({
                    page: 1,
                    size: 200,
                    status: "ACTIVE",
                    categoryName:
                        activeCategory !== "all" ? activeCategory : undefined,
                    search: normalizedSearch || undefined,
                    minPrice: priceRange[0],
                    maxPrice: priceRange[1],
                });
                if (!cancelled) {
                    setServerProducts(response.items);
                }
            } catch {
                if (!cancelled) {
                    setServerProducts([]);
                }
            } finally {
                if (!cancelled) {
                    setIsFilteringProducts(false);
                }
            }
        };

        const timerId = window.setTimeout(() => {
            void fetchFilteredProducts();
        }, 250);

        return () => {
            cancelled = true;
            window.clearTimeout(timerId);
        };
    }, [activeCategory, priceRange, searchQuery]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(0);
    }, [priceRange, activeCategory, currentSort, searchQuery]);

    // Filter and Sort Logic
    const processedProducts = useMemo(() => {
        let result = [...serverProducts];
        switch (currentSort) {
            case "Giá thấp đến cao":
                result.sort((a, b) => a.price - b.price);
                break;
            case "Giá cao đến thấp":
                result.sort((a, b) => b.price - a.price);
                break;
            case "Mới nhất":
                result.sort((a, b) => {
                    const idA =
                        typeof a.id === "string" ? parseInt(a.id) || 0 : a.id;
                    const idB =
                        typeof b.id === "string" ? parseInt(b.id) || 0 : b.id;
                    return idB - idA;
                });
                break;
            case "Bán chạy nhất":
                result.sort((a, b) => (b.totalSoldCount || 0) - (a.totalSoldCount || 0));
                break;
            case "Phổ biến":
            default:
                break;
        }
        return result;
    }, [serverProducts, currentSort]);

    const availableCategories = useMemo(() => {
        if (categories.length > 0) {
            return categories.map((category) => ({
                id: category.id,
                name: category.name,
                icon: category.icon,
            }));
        }
        return Array.from(
            new Set(
                serverProducts
                    .map((product) => product.categoryName || product.category)
                    .filter((value): value is string => Boolean(value)),
            ),
        ).map((name: string) => ({
            id: name.toLowerCase().replace(/\s+/g, "-"),
            name,
            icon: "category",
        }));
    }, [categories, serverProducts]);

    // Pagination
    const totalPages = Math.ceil(processedProducts.length / PAGE_SIZE);
    const paginatedProducts = processedProducts.slice(
        currentPage * PAGE_SIZE,
        (currentPage + 1) * PAGE_SIZE
    );

    const handlePageChange = (page: number) => {
        if (page < 0 || page >= totalPages) return;
        setCurrentPage(page);
        // Scroll to top of product grid
        if (productsRef.current) {
            const headerHeight = 80;
            const top = productsRef.current.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    };

    const handleResetFilters = () => {
        handlePriceChange([1, 100]);
        handleSortChange("Phổ biến");
        handleCategoryChange("all");
    };

    return (
        <>
            <BannerCarousel />

            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex gap-6" ref={productsRef}>
                    {/* Sidebar - Hidden on mobile */}
                    <div className="hidden lg:block">
                        <ShopSidebar
                            categories={availableCategories}
                            activeCategory={activeCategory}
                            onCategoryChange={handleCategoryChange}
                            priceRange={priceRange}
                            onPriceChange={handlePriceChange}
                        />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        {/* Mobile filter button */}
                        <button
                            onClick={() => setIsMobileFilterOpen(true)}
                            className="lg:hidden mb-4 flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:border-primary transition-colors"
                        >
                            <span className="material-symbols-outlined !text-lg">tune</span>
                            {t('shop.filter')}
                        </button>

                        {/* Sort Bar */}
                        <ProductFilterBar
                            currentSort={currentSort}
                            onSortChange={handleSortChange}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                            totalProducts={processedProducts.length}
                        />

                        {/* Product Grid */}
                        {isLoadingProducts || isFilteringProducts ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-[2px] mt-[2px]">
                                {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                                    <ProductCardSkeleton key={index} />
                                ))}
                            </div>
                        ) : paginatedProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center bg-white dark:bg-neutral-800 mt-[2px]">
                                <span className="material-symbols-outlined !text-6xl text-neutral-300 dark:text-neutral-600 mb-4">
                                    search_off
                                </span>
                                <h3 className="text-xl font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                                    {t('shop.noProducts')}
                                </h3>
                                <p className="text-neutral-500 dark:text-neutral-400 max-w-md">
                                    {t('shop.noProductsHint')}
                                </p>
                                <button
                                    onClick={handleResetFilters}
                                    className="mt-6 px-6 py-2 bg-primary text-white font-bold text-sm rounded-sm hover:bg-primary-600 transition-colors"
                                >
                                    {t('shop.clearFilters')}
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-[2px] mt-[2px]">
                                {paginatedProducts.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        onClick={onProductClick}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Bottom Pagination */}
                        {totalPages > 1 && !isLoadingProducts && !isFilteringProducts && (
                            <div className="mt-8 flex justify-center items-center gap-1">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage <= 0}
                                    className="w-9 h-9 flex items-center justify-center rounded-sm border border-neutral-200 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300 hover:bg-primary hover:text-white hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <span className="material-symbols-outlined !text-lg">chevron_left</span>
                                </button>
                                {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                                    let page: number;
                                    if (totalPages <= 7) {
                                        page = i;
                                    } else if (currentPage < 4) {
                                        page = i;
                                    } else if (currentPage > totalPages - 4) {
                                        page = totalPages - 7 + i;
                                    } else {
                                        page = currentPage - 3 + i;
                                    }
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => handlePageChange(page)}
                                            className={`w-9 h-9 flex items-center justify-center rounded-sm text-sm font-medium transition-colors ${page === currentPage
                                                    ? 'bg-primary text-white border border-primary'
                                                    : 'border border-neutral-200 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300 hover:bg-primary/10 hover:text-primary'
                                                }`}
                                        >
                                            {page + 1}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage >= totalPages - 1}
                                    className="w-9 h-9 flex items-center justify-center rounded-sm border border-neutral-200 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300 hover:bg-primary hover:text-white hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <span className="material-symbols-outlined !text-lg">chevron_right</span>
                                </button>
                            </div>
                        )}

                        {/* Product count */}
                        {!isLoadingProducts && !isFilteringProducts && (
                            <div className="mt-4 flex justify-center">
                                <p className="text-neutral-400 dark:text-neutral-500 text-xs">
                                    {t('shop.showing', { current: paginatedProducts.length, total: processedProducts.length })}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="border-t border-neutral-100 dark:border-neutral-800"></div>
            </div>
            <SocialMediaSection />
            <MobileFilterModal
                isOpen={isMobileFilterOpen}
                onClose={() => setIsMobileFilterOpen(false)}
                categories={availableCategories}
                priceRange={priceRange}
                onPriceChange={handlePriceChange}
                activeCategory={activeCategory}
                onCategoryChange={handleCategoryChange}
                resultCount={processedProducts.length}
            />
        </>
    );
};

export default HomePage;
