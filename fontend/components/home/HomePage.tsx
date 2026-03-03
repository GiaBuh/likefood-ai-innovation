import React, { useState, useEffect, useMemo, useRef } from "react";
import Hero from "./Hero";
import Sidebar from "./Sidebar";
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

const HomePage: React.FC<HomePageProps> = ({ onProductClick, searchQuery }) => {
    const { products, categories, isLoadingProducts } = useShop();
    const [currentSort, setCurrentSort] = useState<SortOption>("Best Selling");
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [serverProducts, setServerProducts] = useState<Product[]>([]);
    const [isFilteringProducts, setIsFilteringProducts] = useState(false);

    // Filter States
    const [priceRange, setPriceRange] = useState<[number, number]>([1, 100]);
    const [activeCategory, setActiveCategory] = useState<string>("all"); // 'all' means all categories

    // Pagination State
    const [visibleCount, setVisibleCount] = useState(20);

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

    // Custom smooth scroll function for "slower" feel
    const smoothScrollToProducts = () => {
        if (!productsRef.current) return;

        const headerHeight = 80; // approximate header height
        const elementTop = productsRef.current.getBoundingClientRect().top;
        const currentScrollY = window.scrollY;

        // Target position: element top position relative to document minus header offset
        const targetPosition = currentScrollY + elementTop - headerHeight - 20;

        // Only scroll if we are currently BELOW the target position (scrolled down)
        if (currentScrollY <= targetPosition + 50) return; // +50 threshold

        const startPosition = currentScrollY;
        const distance = targetPosition - startPosition;
        const duration = 1200; // ms - 1.2 seconds for a very smooth, slow feel
        let startTime: number | null = null;

        function animation(currentTime: number) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);

            // Ease Out Quint for even smoother ending: 1 - pow(1 - x, 5)
            const ease = 1 - Math.pow(1 - progress, 5);

            window.scrollTo(0, startPosition + distance * ease);

            if (timeElapsed < duration) {
                requestAnimationFrame(animation);
            }
        }

        requestAnimationFrame(animation);
    };

    // Reset pagination and scroll to top when filters change
    useEffect(() => {
        setVisibleCount(20);
        // Use the custom smooth scroll instead of native behavior
        smoothScrollToProducts();
    }, [priceRange, activeCategory, currentSort, searchQuery]);

    // Filter and Sort Logic
    const processedProducts = useMemo(() => {
        let result = [...serverProducts];
        // Sort (Uses base price for sorting simplification)
        switch (currentSort) {
            case "Price: Low to High":
                result.sort((a, b) => a.price - b.price);
                break;
            case "Price: High to Low":
                result.sort((a, b) => b.price - a.price);
                break;
            case "Newest Arrivals":
                // Handle ID sorting whether string or number
                result.sort((a, b) => {
                    const idA =
                        typeof a.id === "string" ? parseInt(a.id) || 0 : a.id;
                    const idB =
                        typeof b.id === "string" ? parseInt(b.id) || 0 : b.id;
                    return idB - idA;
                });
                break;
            case "Best Selling":
            default:
                // Keep default order (demo data)
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

    // Get current visible products
    const visibleProducts = processedProducts.slice(0, visibleCount);

    const handleLoadMore = () => {
        setVisibleCount((prev) => prev + 20);
    };

    const handleResetFilters = () => {
        setPriceRange([1, 100]);
        setActiveCategory("all");
    };

    return (
        <>
            <Hero />
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                    <Sidebar
                        categories={availableCategories}
                        activeCategory={activeCategory}
                        onCategoryChange={setActiveCategory}
                        priceRange={priceRange}
                        onPriceChange={setPriceRange}
                    />

                    <div className="flex-1" ref={productsRef}>
                        <ProductFilterBar
                            currentSort={currentSort}
                            onSortChange={setCurrentSort}
                            onOpenMobileFilter={() =>
                                setIsMobileFilterOpen(true)
                            }
                        />

                        {isLoadingProducts || isFilteringProducts ? (
                            // Shimmer / Skeleton Loading State
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {Array.from({ length: 10 }).map((_, index) => (
                                    <ProductCardSkeleton key={index} />
                                ))}
                            </div>
                        ) : visibleProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-300">
                                <span className="material-symbols-outlined !text-6xl text-stone-200 dark:text-stone-700 mb-4">
                                    search_off
                                </span>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                    No products found
                                </h3>
                                <p className="text-stone-500 dark:text-stone-400 max-w-md">
                                    Try adjusting your search, price range, or
                                    category filters to find what you're looking
                                    for.
                                </p>
                                <button
                                    onClick={handleResetFilters}
                                    className="mt-6 px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {visibleProducts.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        onClick={onProductClick}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Load More Button - Only show if there are more products to load AND not loading */}
                        {!isLoadingProducts &&
                            !isFilteringProducts &&
                            visibleCount < processedProducts.length && (
                                <div className="mt-12 flex justify-center">
                                    <button
                                        onClick={handleLoadMore}
                                        className="px-8 py-3 bg-white border border-slate-300 dark:bg-stone-800 dark:border-stone-700 rounded-lg text-sm font-bold text-slate-700 dark:text-white hover:bg-orange-50 dark:hover:bg-stone-700 transition-colors shadow-sm"
                                    >
                                        View More Products
                                    </button>
                                </div>
                            )}

                        {/* Result count message */}
                        {!isLoadingProducts && !isFilteringProducts && (
                            <div className="mt-8 flex justify-center">
                                <p className="text-stone-400 dark:text-stone-500 text-xs">
                                    Showing {visibleProducts.length} of{" "}
                                    {processedProducts.length} products
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="border-t border-stone-100 dark:border-stone-800"></div>
            </div>
            <SocialMediaSection />
            <MobileFilterModal
                isOpen={isMobileFilterOpen}
                onClose={() => setIsMobileFilterOpen(false)}
                categories={availableCategories}
                priceRange={priceRange}
                onPriceChange={setPriceRange}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                resultCount={processedProducts.length}
            />
        </>
    );
};

export default HomePage;
