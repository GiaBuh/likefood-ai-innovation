
import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { Product, CartItem, Order, FulfillmentStatus, Category, PaginationMeta } from '../types';
import { useToast } from './ToastContext';
import {
  addItemToMyCart,
  cancelMyOrder as cancelMyOrderApi,
  createCategory,
  createOrderFromMyCart,
  createProduct,
  deleteCategory as deleteCategoryApi,
  deleteProduct as deleteProductApi,
  fetchCategories,
  fetchMyOrders,
  fetchOrdersWithQuery,
  fetchProductsWithQuery,
  getMyCart,
  importProductsFromCsv as importProductsFromCsvApi,
  removeMyCartItem,
  toProduct,
  updateCategory as updateCategoryApi,
  updateProduct as updateProductApi,
  updateOrderStatusByAdmin,
  updateMyCartItem,
} from '../services/shopApi';
import { getAccessToken } from '../services/apiClient';

interface ShopContextType {
  products: Product[];
  categories: Category[];
  cart: CartItem[];
  orders: Order[];
  productPagination: PaginationMeta;
  orderPagination: PaginationMeta;
  isLoadingProducts: boolean;
  
  // Product Actions (Admin)
  updateProducts: (products: Product[]) => void;
  addCategory: (name: string) => Promise<void>;
  updateCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  refreshCategories: () => Promise<void>;
  createProduct: (product: Product) => Promise<void>;
  importProductsFromCsv: (file: File) => Promise<{ successCount: number; failCount: number; errors: string[] }>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<Product>;
  
  // Cart Actions
  addToCart: (product: Product, quantity: number) => void;
  addToCartByVariantId: (variantId: string, quantity: number) => Promise<void>;
  removeFromCart: (id: number | string) => void;
  updateCartQuantity: (id: number | string, delta: number) => void;
  clearCart: () => void;
  loadCartForCurrentUser: () => Promise<void>;
  
  // Order Actions
  placeOrder: (order: Order) => void;
  submitOrder: (payload: { name: string; phone: string; address: string; note?: string }) => Promise<void>;
  updateOrderStatus: (orderId: string, status: FulfillmentStatus) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  loadOrdersForRole: (isAdmin: boolean) => Promise<void>;
  clearOrders: () => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showError } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [productPagination, setProductPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 200,
    totalPages: 1,
    total: 0,
  });
  const [orderPagination, setOrderPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 200,
    totalPages: 1,
    total: 0,
  });
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const cartRevisionRef = useRef(0);

  const refreshCategories = useCallback(async () => {
    try {
      const apiCategories = await fetchCategories();
      if (apiCategories.length > 0) {
        setCategories(apiCategories);
        return;
      }
      if (products.length > 0) {
        setCategories(
          Array.from(
            new Set(
              products
                .map((product) => product.categoryName || product.category)
                .filter((name): name is string => Boolean(name))
            )
          ).map((name) => ({
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name,
            icon: 'category',
          }))
        );
      }
    } catch (error) {
      console.error('Cannot refresh categories from backend.', error);
    }
  }, [products]);

  const mapBackendCartToLocalItems = useCallback(
    (backendCart: Awaited<ReturnType<typeof getMyCart>>): CartItem[] => {
      return backendCart.items.map((item) => {
        const product = products.find((p) => String(p.id) === String(item.productId));
        const variant = product?.variants?.find((v) => v.id === item.variantId);
        const fallbackWeight = variant?.weight || product?.weight || 'Default';
        const fallbackPrice = Number(item.price ?? variant?.price ?? product?.price ?? 0);

        const maxQty = item.availableQuantity ?? variant?.quantity ?? product?.stock ?? 999;
        return {
          id: product?.id || item.productId,
          name: product?.name || 'Unknown product',
          price: fallbackPrice,
          image: product?.image || '',
          images: product?.images || (product?.image ? [product.image] : []),
          location: product?.location || 'Viet Nam',
          category: product?.category || 'Uncategorized',
          categoryName: product?.categoryName || product?.category || 'Uncategorized',
          categoryId: product?.categoryId,
          isUsShip: true,
          description: product?.description || '',
          weight: fallbackWeight,
          packaging: product?.packaging || 'Standard Pack',
          variants: product?.variants || [],
          thumbnail: product?.thumbnail || product?.image || '',
          variantId: item.variantId,
          status: product?.status || 'Active',
          stock: product?.stock,
          quantity: item.quantity,
          cartId: `${item.productId}-${item.variantId}`,
          backendCartItemId: item.id,
          maxQuantity: maxQty,
        };
      });
    },
    [products]
  );

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      try {
        const [productsResult, categoriesResult] = await Promise.allSettled([
          fetchProductsWithQuery({ page: 1, size: 500 }),
          fetchCategories(),
        ]);
        if (!isMounted) return;

        const apiProducts = productsResult.status === 'fulfilled' ? productsResult.value.items : [];
        const apiProductMeta = productsResult.status === 'fulfilled'
          ? productsResult.value.meta
          : { page: 1, pageSize: 500, totalPages: 1, total: 0 };
        const apiCategories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : [];

        setProducts(apiProducts);
        setProductPagination(apiProductMeta);
        if (apiCategories.length > 0) {
          setCategories(apiCategories);
        } else if (apiProducts.length > 0) {
          setCategories(
            Array.from(
              new Set(
                apiProducts
                  .map((product) => product.categoryName || product.category)
                  .filter((name): name is string => Boolean(name))
              )
            ).map((name) => ({
              id: name.toLowerCase().replace(/\s+/g, '-'),
              name,
              icon: 'category',
            }))
          );
        }
      } catch (error) {
        console.error('Cannot load products from backend.', error);
      } finally {
        if (isMounted) {
          setIsLoadingProducts(false);
        }
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  // --- Cart Logic ---
  const loadCartForCurrentUser = useCallback(async () => {
    if (!getAccessToken()) {
      setCart([]);
      return;
    }
    const revisionAtStart = cartRevisionRef.current;
    try {
      const backendCart = await getMyCart();
      if (revisionAtStart === cartRevisionRef.current) {
        setCart(mapBackendCartToLocalItems(backendCart));
      }
    } catch (error) {
      console.error('Cannot load cart from backend.', error);
      if (revisionAtStart === cartRevisionRef.current) {
        setCart([]);
      }
    }
  }, [mapBackendCartToLocalItems]);

  const addToCart = (product: Product, quantity: number) => {
    const variant = product.variantId
      ? product.variants?.find((v) => v.id === product.variantId)
      : product.variants?.[0];
    const maxStock = variant?.quantity ?? product.stock ?? 999;
    const currentInCart = cart.find(
      (item) =>
        item.id === product.id &&
        item.weight === product.weight &&
        item.variantId === product.variantId
    )?.quantity ?? 0;
    const canAdd = Math.max(0, maxStock - currentInCart);
    const toAdd = Math.min(quantity, canAdd);

    if (toAdd <= 0) {
      showError('Đã đạt số lượng tối đa tồn kho (' + maxStock + ')');
      return;
    }

    setCart(prev => {
      const existingItemIndex = prev.findIndex(
        item =>
          item.id === product.id &&
          item.weight === product.weight &&
          item.variantId === product.variantId
      );
      if (existingItemIndex > -1) {
        const newCart = [...prev];
        newCart[existingItemIndex] = {
          ...newCart[existingItemIndex],
          quantity: newCart[existingItemIndex].quantity + toAdd,
          maxQuantity: maxStock,
        };
        return newCart;
      } else {
        const cartId = `${product.id}-${product.weight}-${Date.now()}`;
        return [...prev, { ...product, quantity: toAdd, cartId, maxQuantity: maxStock }];
      }
    });

    if (getAccessToken() && product.variantId) {
      void addItemToMyCart(product.variantId, toAdd)
        .then((backendCart) => {
          setCart(mapBackendCartToLocalItems(backendCart));
        })
        .catch((error) => {
          showError(error instanceof Error ? error.message : 'Không thể thêm vào giỏ. Vui lòng thử lại.');
          void loadCartForCurrentUser();
        });
    }
  };

  const addToCartByVariantId = useCallback(
    async (variantId: string, quantity: number) => {
      if (!getAccessToken()) return;
      await addItemToMyCart(variantId, quantity);
      await loadCartForCurrentUser();
    },
    [loadCartForCurrentUser]
  );

  const removeFromCart = useCallback((id: number | string) => {
    const idStr = id != null ? String(id).trim() : '';
    if (!idStr) return;

    const toRemove = cart.find(
      (item) =>
        String(item.backendCartItemId ?? '') === idStr ||
        String(item.cartId ?? '') === idStr ||
        String(item.id ?? '') === idStr
    );

    setCart((prev) =>
      prev.filter(
        (item) =>
          String(item.backendCartItemId ?? '') !== idStr &&
          String(item.cartId ?? '') !== idStr &&
          String(item.id ?? '') !== idStr
      )
    );

    if (getAccessToken() && toRemove) {
      const doRemove = async () => {
        let backendItemId = toRemove.backendCartItemId
          ? String(toRemove.backendCartItemId).trim()
          : '';
        if (!backendItemId && toRemove.variantId) {
          const backendCart = await getMyCart();
          const matched = backendCart.items.find(
            (item) => item.variantId === toRemove.variantId || String(item.variantId) === String(toRemove.variantId)
          );
          backendItemId = matched ? String(matched.id) : '';
        }
        if (backendItemId) {
          const backendCart = await removeMyCartItem(backendItemId);
          setCart(mapBackendCartToLocalItems(backendCart));
        } else {
          await loadCartForCurrentUser();
        }
      };
      void doRemove().catch((error) => {
        console.error('Cannot sync remove-from-cart with backend.', error);
        void loadCartForCurrentUser();
      });
    }
  }, [cart, mapBackendCartToLocalItems, loadCartForCurrentUser]);

  const updateCartQuantity = (id: number | string, delta: number) => {
    const idStr = String(id);
    const targetItem = cart.find(
      (item) =>
        String(item.cartId) === idStr ||
        String(item.id) === idStr ||
        String(item.backendCartItemId ?? '') === idStr
    );
    const maxQty = targetItem?.maxQuantity ?? 999;
    const nextQuantity = Math.max(1, Math.min(maxQty, (targetItem?.quantity ?? 1) + delta));

    if (delta > 0 && nextQuantity <= (targetItem?.quantity ?? 0)) {
      showError('Đã đạt số lượng tối đa tồn kho (' + maxQty + ')');
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        const matches =
          String(item.cartId) === idStr ||
          String(item.id) === idStr ||
          String(item.backendCartItemId ?? '') === idStr;
        if (matches) {
          return { ...item, quantity: nextQuantity };
        }
        return item;
      })
    );

    if (getAccessToken() && targetItem) {
      const doUpdate = async () => {
        let backendItemId = targetItem.backendCartItemId;
        if (!backendItemId && targetItem.variantId) {
          const backendCart = await getMyCart();
          backendItemId = backendCart.items.find((item) => item.variantId === targetItem.variantId)?.id;
        }
        if (backendItemId) {
          const backendCart = await updateMyCartItem(backendItemId, nextQuantity);
          setCart(mapBackendCartToLocalItems(backendCart));
        }
      };
      void doUpdate().catch((error) => {
        showError(error instanceof Error ? error.message : 'Không thể cập nhật giỏ hàng. Vui lòng thử lại.');
        void loadCartForCurrentUser();
      });
    }
  };

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // --- Product Logic ---
  const updateProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
  };

  const addCategory = async (name: string) => {
    const normalized = name.trim();
    if (!normalized) return;

    const exists = categories.some(
      (category) => category.name.toLowerCase() === normalized.toLowerCase()
    );
    if (exists) return;

    const created = await createCategory(normalized);
    setCategories((prev) => [...prev, created]);
    await refreshCategories();
  };

  const updateCategory = async (id: string, name: string) => {
    const normalized = name.trim();
    if (!normalized) return;

    const updated = await updateCategoryApi(id, normalized);
    setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
    await refreshCategories();
  };

  const deleteCategory = async (id: string) => {
    await deleteCategoryApi(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    await refreshCategories();
  };

  const createProductAction = async (product: Product) => {
    const createdProduct = await createProduct(product, categories);
    setProducts((prev) => [createdProduct, ...prev]);
  };

  const importProductsFromCsvAction = async (file: File) => {
    const result = await importProductsFromCsvApi(file);
    const newProducts = (result.created || []).map((p) => toProduct(p));
    setProducts((prev) => [...newProducts, ...prev]);
    return {
      successCount: result.successCount,
      failCount: result.failCount,
      errors: result.errors || [],
    };
  };

  const updateProductAction = async (product: Product) => {
    const updatedProduct = await updateProductApi(product, categories);
    setProducts((prev) => prev.map((item) => (String(item.id) === String(product.id) ? updatedProduct : item)));
  };

  const deleteProductAction = async (id: string) => {
    const updated = await deleteProductApi(id);
    setProducts((prev) => prev.map((p) => (String(p.id) === String(id) ? updated : p)));
  };

  // --- Order Logic ---
  const placeOrder = (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);
    clearCart();
  };

  const submitOrder = async (payload: { name: string; phone: string; address: string; note?: string }) => {
    const created = await createOrderFromMyCart({
      receiverName: payload.name,
      receiverPhone: payload.phone,
      shippingAddress: payload.address,
      note: payload.note,
      paymentMethod: 'COD',
    });
    setOrders((prev) => [created, ...prev]);
    clearCart();
    cartRevisionRef.current += 1;
    await loadCartForCurrentUser();
  };

  const updateOrderStatus = async (orderId: string, status: FulfillmentStatus) => {
    if (status === 'Cancelled') {
      throw new Error('Cancelled status is only for customer cancellation flow.');
    }
    const updated = await updateOrderStatusByAdmin(orderId, status);
    setOrders(prev => prev.map(o => (o.id === orderId ? updated : o)));
  };

  const cancelOrder = async (orderId: string) => {
    const updated = await cancelMyOrderApi(orderId);
    setOrders(prev => prev.map(o => (o.id === orderId ? updated : o)));
  };

  const loadOrdersForRole = useCallback(async (isAdmin: boolean) => {
    if (isAdmin) {
      const orderPage = await fetchOrdersWithQuery({ page: 1, size: 200 });
      setOrders(orderPage.items);
      setOrderPagination(orderPage.meta);
      return;
    }

    const myOrders = await fetchMyOrders();
    setOrders(myOrders);
    setOrderPagination({
      page: 1,
      pageSize: myOrders.length,
      totalPages: 1,
      total: myOrders.length,
    });
  }, []);

  const clearOrders = useCallback(() => {
    setOrders([]);
    setOrderPagination({
      page: 1,
      pageSize: 0,
      totalPages: 1,
      total: 0,
    });
  }, []);

  return (
    <ShopContext.Provider value={{
      products,
      categories,
      cart,
      orders,
      productPagination,
      orderPagination,
      isLoadingProducts,
      updateProducts,
      addCategory,
      updateCategory,
      deleteCategory,
      refreshCategories,
      createProduct: createProductAction,
      importProductsFromCsv: importProductsFromCsvAction,
      updateProduct: updateProductAction,
      deleteProduct: deleteProductAction,
      addToCart,
      addToCartByVariantId,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      loadCartForCurrentUser,
      placeOrder,
      submitOrder,
      updateOrderStatus,
      cancelOrder,
      loadOrdersForRole,
      clearOrders
    }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
