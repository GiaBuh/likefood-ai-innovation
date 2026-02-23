
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import AdminSidebar from './AdminSidebar';
import KPICards from './KPICards';
import Filters from './Filters';
import OrdersTable from './OrdersTable';
import ProductsTable from './ProductsTable';
import CustomersTable from './CustomersTable';
import Dashboard from './Dashboard';
import OrderDetailsModal from './OrderDetailsModal';
import { CategoryManagementModal, ProductFormModal } from './ProductModals';
import AdminChatView, { ChatConversation, ChatMessage } from './AdminChatView';
import { Product, Order, FulfillmentStatus, CustomerProfile, KPIStats, Category, PaginationMeta } from '../../types';
import {
  getAdminConversations,
  getAdminMessages,
  sendAdminMessage,
  ChatConversationRes,
  ChatMessageRes,
} from '../../services/shopApi';

type AdminViewType = 'dashboard' | 'orders' | 'products' | 'customers' | 'chatting';

interface AdminPanelProps {
  onExit: () => void;
  products: Product[];
  orders: Order[];
  categories: Category[];
  productPagination: PaginationMeta;
  orderPagination: PaginationMeta;
  onAddCategory: (name: string) => Promise<void>;
  onUpdateCategory: (id: string, name: string) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onRefreshCategories: () => Promise<void>;
  onCreateProduct: (product: Product) => Promise<void>;
  onImportProductsFromCsv?: (file: File) => Promise<{ successCount: number; failCount: number; errors: string[] }>;
  onUpdateProduct: (product: Product) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onUpdateProducts: (products: Product[]) => void;
  onUpdateOrderStatus: (orderId: string, status: FulfillmentStatus) => Promise<void>;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  onExit,
  products,
  orders: initialOrders,
  categories,
  productPagination,
  orderPagination,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onRefreshCategories,
  onCreateProduct,
  onImportProductsFromCsv,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateProducts,
  onUpdateOrderStatus,
}) => {
  const [currentView, setCurrentView] = useState<AdminViewType>('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  // Data State
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  // Products are passed in via props to share state with main app
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [primaryFilter, setPrimaryFilter] = useState('All');
  const [secondaryFilter, setSecondaryFilter] = useState('All');
  const [productPage, setProductPage] = useState(1);

  const PRODUCTS_PAGE_SIZE = 20;

  // Modal States
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Chat state
  const [chatConversations, setChatConversations] = useState<ChatConversation[]>([]);
  const [chatMessagesByUser, setChatMessagesByUser] = useState<Record<string, ChatMessage[]>>({});

  // CSV import
  const [isImporting, setIsImporting] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Derived State for Modal
  const selectedOrder = useMemo(() => 
    orders.find(o => o.id === selectedOrderId) || null
  , [orders, selectedOrderId]);

  // Simulate data fetching on view change
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800); // 0.8s delay to simulate fast API response
    return () => clearTimeout(timer);
  }, [currentView]);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const loadChatConversations = async () => {
    if (currentView !== 'chatting') return;
    try {
      const list = await getAdminConversations();
      setChatConversations(
        list.map((c: ChatConversationRes) => ({
          userId: c.userId,
          fullname: c.fullname,
          email: c.email,
          avatarUrl: c.avatarUrl,
          initials: c.initials,
          initialsBgColor: c.initialsBgColor,
          initialsTextColor: c.initialsTextColor,
          lastMessage: c.lastMessage,
          lastMessageAt: c.lastMessageAt,
        }))
      );
    } catch (e) {
      console.error('Cannot load chat conversations.', e);
    }
  };

  useEffect(() => {
    loadChatConversations();
  }, [currentView]);

  // Poll for new conversations when on Chatting tab (1 request per 5s)
  useEffect(() => {
    if (currentView !== 'chatting') return;
    const interval = setInterval(loadChatConversations, 5000);
    return () => clearInterval(interval);
  }, [currentView]);

  useEffect(() => {
    const customerMap = new Map<string, CustomerProfile>();
    orders.forEach((order) => {
      const current = customerMap.get(order.customer.email);
      const nextTotalOrders = (current?.totalOrders || 0) + 1;
      const nextSpent = (current?.totalSpent || 0) + order.totalAmount;
      customerMap.set(order.customer.email, {
        id: order.customer.id || order.customer.email,
        fullname: order.customer.fullname,
        email: order.customer.email,
        phoneNumber: order.customer.phoneNumber,
        address: order.customer.address,
        initials: order.customer.initials,
        initialsBgColor: order.customer.initialsBgColor,
        initialsTextColor: order.customer.initialsTextColor,
        avatarUrl: order.customer.avatarUrl,
        totalOrders: nextTotalOrders,
        totalSpent: nextSpent,
        lastOrderDate: order.createdAt,
        status: current?.status || 'Active',
      });
    });

    setCustomers((prev) =>
      Array.from(customerMap.values()).map((customer) => {
        const previous = prev.find((item) => item.email === customer.email);
        return previous ? { ...customer, status: previous.status } : customer;
      })
    );
  }, [orders]);

  // Reset filters when view changes
  const handleViewChange = (view: AdminViewType) => {
    setCurrentView(view);
    setSearchTerm('');
    setPrimaryFilter('All');
    setSecondaryFilter(view === 'orders' ? '30' : 'All');
  };

  // --- Product Handlers ---
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleAddProduct = () => {
    void onRefreshCategories();
    setEditingProduct(null);
    setShowProductModal(true);
  };

  useEffect(() => {
    if (currentView === 'products') {
      void onRefreshCategories();
    }
  }, [currentView, onRefreshCategories]);

  const handleSaveProduct = async (productData: Product) => {
    if (editingProduct) {
      await onUpdateProduct(productData);
    } else {
      await onCreateProduct(productData);
    }
    setShowProductModal(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (productId: string | number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await onDeleteProduct(String(productId));
      } catch (error) {
        console.error('Cannot delete product.', error);
        alert(error instanceof Error ? error.message : 'Cannot delete product.');
      }
    }
  };

  // --- Order Handlers ---
  const handleOrderClick = (order: Order) => {
    setSelectedOrderId(order.id);
    setShowOrderModal(true);
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: FulfillmentStatus) => {
    try {
      await onUpdateOrderStatus(orderId, newStatus);
    } catch (error) {
      console.error('Cannot update order status.', error);
      alert('Cannot update order status. Please try again.');
    }
  };

  const handleCancelOrder = (orderId: string) => {
    if (window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      setOrders(prev => prev.map(o => {
        if (o.id === orderId) {
          return { ...o, status: 'Cancelled', fulfillmentStatus: 'Cancelled' };
        }
        return o;
      }));
    }
  };

  const handleLoadChatMessages = useCallback(async (userId: string) => {
    try {
      const list = await getAdminMessages(userId);
      setChatMessagesByUser((prev) => ({
        ...prev,
        [userId]: list.map((m: ChatMessageRes) => ({
          id: m.id,
          content: m.content,
          sender: m.sender as 'user' | 'admin',
          createdAt: m.createdAt,
        })),
      }));
    } catch (e) {
      console.error('Cannot load chat messages.', e);
    }
  }, []);

  const handleCsvImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImportProductsFromCsv) return;
    setIsImporting(true);
    try {
      const result = await onImportProductsFromCsv(file);
      const msg = result.successCount > 0
        ? `Imported ${result.successCount} product(s)${result.failCount > 0 ? `. ${result.failCount} failed.` : ''}`
        : result.failCount > 0
          ? `Import failed: ${result.errors?.join('; ') || 'Unknown error'}`
          : 'No products to import.';
      window.alert(msg);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  }, [onImportProductsFromCsv]);

  const handleSendChatMessage = async (userId: string, content: string) => {
    const created = await sendAdminMessage(userId, content);
    setChatMessagesByUser((prev) => {
      const list = prev[userId] || [];
      if (list.some((m) => m.id === created.id)) return prev;
      return {
        ...prev,
        [userId]: [...list, { id: created.id, content: created.content, sender: 'admin' as const, createdAt: created.createdAt }],
      };
    });
  };

  const handleChatWebSocketMessage = useCallback((userId: string, msg: ChatMessageRes) => {
    setChatMessagesByUser((prev) => {
      const list = prev[userId] || [];
      if (list.some((m) => m.id === msg.id)) return prev;
      return {
        ...prev,
        [userId]: [...list, { id: msg.id, content: msg.content, sender: msg.sender as 'user' | 'admin', createdAt: msg.createdAt }],
      };
    });
  }, []);

  const getKPIs = () => {
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const pendingOrders = orders.filter((order) => order.fulfillmentStatus === 'Processing').length;
    const lowStockProducts = products.filter((product) => (product.stock ?? 0) > 0 && (product.stock ?? 0) < 10).length;
    const outOfStockProducts = products.filter((product) => (product.stock ?? 0) <= 0).length;
    const activeCustomers = customers.filter((customer) => customer.status === 'Active').length;

    const dashboardKpi: KPIStats[] = [
      { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, trend: 'Live data', trendDirection: 'up', icon: 'payments', iconColorClass: 'text-primary', iconBgClass: 'bg-primary/10' },
      { label: 'Total Orders', value: `${orders.length}`, trend: 'Live data', trendDirection: 'up', icon: 'shopping_bag', iconColorClass: 'text-blue-500', iconBgClass: 'bg-blue-500/10' },
      { label: 'Customers', value: `${customers.length}`, trend: `${activeCustomers} active`, trendDirection: 'up', icon: 'group_add', iconColorClass: 'text-green-500', iconBgClass: 'bg-green-500/10' },
      { label: 'Pending Fulfillment', value: `${pendingOrders}`, trend: 'Needs processing', trendDirection: 'down', icon: 'pending_actions', iconColorClass: 'text-orange-500', iconBgClass: 'bg-orange-500/10' }
    ];

    const orderKpi: KPIStats[] = [
      { label: 'Total Orders', value: `${orders.length}`, trend: 'Live data', trendDirection: 'up', icon: 'shopping_cart', iconColorClass: 'text-primary', iconBgClass: 'bg-primary/10' },
      { label: 'Pending Fulfillment', value: `${pendingOrders}`, trend: 'Requires attention', trendDirection: 'down', icon: 'schedule', iconColorClass: 'text-orange-500', iconBgClass: 'bg-orange-500/10' },
      { label: 'Revenue', value: `$${totalRevenue.toFixed(2)}`, trend: 'Live data', trendDirection: 'up', icon: 'payments', iconColorClass: 'text-green-500', iconBgClass: 'bg-green-500/10' },
      { label: 'Cancelled', value: `${orders.filter((o) => o.fulfillmentStatus === 'Cancelled').length}`, trend: 'Live data', trendDirection: 'down', icon: 'assignment_return', iconColorClass: 'text-red-500', iconBgClass: 'bg-red-500/10' }
    ];

    const productKpi: KPIStats[] = [
      { label: 'Total Products', value: `${products.length}`, trend: 'Live data', trendDirection: 'up', icon: 'inventory_2', iconColorClass: 'text-primary', iconBgClass: 'bg-primary/10' },
      { label: 'Low Stock', value: `${lowStockProducts}`, trend: 'Restock needed', trendDirection: 'down', icon: 'production_quantity_limits', iconColorClass: 'text-orange-500', iconBgClass: 'bg-orange-500/10' },
      { label: 'Out of Stock', value: `${outOfStockProducts}`, trend: 'Critical', trendDirection: 'down', icon: 'event_busy', iconColorClass: 'text-red-500', iconBgClass: 'bg-red-500/10' },
      { label: 'Categories', value: `${new Set(products.map((p) => p.categoryName || p.category)).size}`, trend: 'Live data', trendDirection: 'up', icon: 'category', iconColorClass: 'text-purple-500', iconBgClass: 'bg-purple-500/10' }
    ];

    const customerKpi: KPIStats[] = [
      { label: 'Total Customers', value: `${customers.length}`, trend: 'Live data', trendDirection: 'up', icon: 'group', iconColorClass: 'text-primary', iconBgClass: 'bg-primary/10' },
      { label: 'Active Customers', value: `${activeCustomers}`, trend: 'Current status', trendDirection: 'up', icon: 'online_prediction', iconColorClass: 'text-green-500', iconBgClass: 'bg-green-500/10' },
      { label: 'New Customers', value: `${customers.filter((c) => c.totalOrders === 1).length}`, trend: 'First-time buyers', trendDirection: 'up', icon: 'person_add', iconColorClass: 'text-blue-500', iconBgClass: 'bg-blue-500/10' },
      { label: 'Blocked', value: `${customers.filter((c) => c.status === 'Blocked').length}`, trend: 'Current status', trendDirection: 'down', icon: 'trending_down', iconColorClass: 'text-gray-500', iconBgClass: 'bg-gray-500/10' }
    ];

    switch(currentView) {
      case 'dashboard': return dashboardKpi;
      case 'orders': return orderKpi;
      case 'products': return productKpi;
      case 'customers': return customerKpi;
    }
  };

  const getHeaderInfo = () => {
    switch(currentView) {
      case 'dashboard':
        return { title: 'Dashboard', subtitle: 'Overview of your store performance', btnText: '' };
      case 'orders': 
        return { title: 'Order Management', subtitle: 'Manage and fulfill customer orders for Vietnamese specialties', btnText: '' };
      case 'products':
        return { title: 'Product Inventory', subtitle: 'Manage your catalog, stock levels, and product details', btnText: 'Add Product' };
      case 'customers':
        return { title: 'Customer Base', subtitle: 'View and manage your registered customers and VIPs', btnText: 'Add Customer' };
      case 'chatting':
        return { title: 'Chatting', subtitle: 'Chat with customers in real-time', btnText: '' };
    }
  };

  // Filter Logic
  const filteredData = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();

    if (currentView === 'orders') {
      return orders.filter(order => {
        const matchesSearch = 
          order.id.toLowerCase().includes(lowerSearch) ||
          order.customer.fullname.toLowerCase().includes(lowerSearch) ||
          order.customer.email.toLowerCase().includes(lowerSearch);
        const matchesStatus = primaryFilter === 'All' || order.paymentStatus === primaryFilter;
        return matchesSearch && matchesStatus;
      });
    } else if (currentView === 'products') {
       return products.filter(product => {
        const matchesSearch = 
          product.name.toLowerCase().includes(lowerSearch) ||
          (product.sku && product.sku.toLowerCase().includes(lowerSearch));
        const matchesCategory = primaryFilter === 'All' || product.categoryName === primaryFilter || product.category === primaryFilter;
        const matchesStatus = secondaryFilter === 'All' || product.status === secondaryFilter;
        return matchesSearch && matchesCategory && matchesStatus;
      });
    } else if (currentView === 'customers') {
      return customers.filter(customer => {
        const matchesSearch = 
          customer.fullname.toLowerCase().includes(lowerSearch) ||
          customer.email.toLowerCase().includes(lowerSearch) ||
          (customer.phoneNumber && customer.phoneNumber.includes(lowerSearch));
        const matchesStatus = primaryFilter === 'All' || customer.status === primaryFilter;
        return matchesSearch && matchesStatus;
      });
    }
    return [];
  }, [currentView, searchTerm, primaryFilter, secondaryFilter, orders, products, customers]);

  // Paginated products (20 per page)
  const paginatedProducts = useMemo(() => {
    if (currentView !== 'products') return [];
    const filtered = filteredData as Product[];
    const start = (productPage - 1) * PRODUCTS_PAGE_SIZE;
    return filtered.slice(start, start + PRODUCTS_PAGE_SIZE);
  }, [currentView, filteredData, productPage]);

  const productsTotalPages = useMemo(() => {
    if (currentView !== 'products') return 1;
    return Math.max(1, Math.ceil((filteredData as Product[]).length / PRODUCTS_PAGE_SIZE));
  }, [currentView, filteredData]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setProductPage(1);
  }, [searchTerm, primaryFilter, secondaryFilter]);

  const headerInfo = getHeaderInfo();

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar with Exit Button */}
      <AdminSidebar currentView={currentView} onNavigate={handleViewChange} onExit={onExit} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-background-light dark:bg-background-dark relative">
        {/* Header */}
        <header className="flex h-20 items-center justify-between border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-8">
          <div>
            <h2 className="text-xl font-bold text-text-light dark:text-text-dark">{headerInfo.title}</h2>
            <p className="text-sm text-subtext-light dark:text-subtext-dark">{headerInfo.subtitle}</p>
          </div>
          <div className="flex items-center gap-4">
            {currentView !== 'dashboard' && currentView !== 'chatting' && (
                <button className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-4 text-sm font-bold text-text-light dark:text-text-dark hover:bg-background-light dark:hover:bg-background-dark transition-colors">
                  <span className="material-symbols-outlined text-[20px]">file_download</span>
                  Export
                </button>
            )}
            
            {currentView === 'products' ? (
              <>
                  <input
                    type="file"
                    accept=".csv"
                    ref={csvInputRef}
                    onChange={handleCsvImport}
                    className="hidden"
                  />
                  <button 
                      onClick={() => setShowAddCategory(true)}
                      className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-4 text-sm font-bold text-text-light dark:text-text-dark hover:bg-background-light dark:hover:bg-background-dark transition-colors"
                  >
                      <span className="material-symbols-outlined text-[20px]">category</span>
                      Add Category
                  </button>
                  {onImportProductsFromCsv && (
                    <button 
                        onClick={() => csvInputRef.current?.click()}
                        disabled={isImporting}
                        className="flex h-10 items-center justify-center gap-2 rounded-lg border border-primary bg-primary/5 px-4 text-sm font-bold text-primary hover:bg-primary/10 disabled:opacity-50 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">upload_file</span>
                        {isImporting ? 'Importing...' : 'Import CSV'}
                    </button>
                  )}
                  <button 
                      onClick={handleAddProduct}
                      className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-white hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
                  >
                      <span className="material-symbols-outlined text-[20px]">add</span>
                      Add Product
                  </button>
              </>
            ) : currentView !== 'orders' && currentView !== 'dashboard' && currentView !== 'chatting' && (
                <button className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-white hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20">
                  <span className="material-symbols-outlined text-[20px]">add</span>
                  {headerInfo.btnText}
                </button>
            )}
          </div>
        </header>

        {/* Scrollable Content */}
        <div className={`flex-1 flex flex-col min-h-0 max-h-[calc(100vh-5rem)] ${currentView === 'chatting' ? 'overflow-hidden p-4' : 'overflow-y-auto overflow-x-hidden p-8'}`}>
          {/* Chatting View - full width Messenger */}
          {currentView === 'chatting' && (
            <AdminChatView
              customers={customers}
              conversations={chatConversations}
              messagesByUser={chatMessagesByUser}
              onSendMessage={handleSendChatMessage}
              onLoadMessages={handleLoadChatMessages}
              onRefresh={loadChatConversations}
              onWebSocketMessage={handleChatWebSocketMessage}
            />
          )}

          {/* Dashboard View */}
          {currentView === 'dashboard' && (
              <Dashboard 
                  kpiData={getKPIs()} 
                  recentOrders={orders} 
                  topProducts={products}
                  onOrderClick={handleOrderClick}
                  isLoading={isLoading}
              />
          )}

          {/* List Views */}
          {currentView !== 'dashboard' && currentView !== 'chatting' && (
             <div className="flex flex-col gap-6">
                <KPICards data={getKPIs()} isLoading={isLoading} />

                <Filters 
                    view={currentView}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    primaryFilter={primaryFilter}
                    onPrimaryFilterChange={setPrimaryFilter}
                    secondaryFilter={secondaryFilter}
                    onSecondaryFilterChange={setSecondaryFilter}
                    resultCount={filteredData.length}
                    productCategories={categories}
                    productsPage={currentView === 'products' ? productPage : 1}
                    productsPageSize={PRODUCTS_PAGE_SIZE}
                    productsTotalPages={currentView === 'products' ? productsTotalPages : 1}
                />

                {currentView === 'orders' && (
                    <OrdersTable 
                    orders={filteredData as any} 
                    onOrderClick={handleOrderClick}
                    onUpdateStatus={handleUpdateOrderStatus}
                    pagination={orderPagination}
                    isLoading={isLoading}
                    />
                )}
                {currentView === 'products' && (
                    <ProductsTable 
                    products={paginatedProducts as any} 
                    onEdit={handleEditProduct} 
                    onDelete={handleDeleteProduct}
                    pagination={{
                      ...productPagination,
                      page: productPage,
                      totalPages: productsTotalPages,
                      total: (filteredData as Product[]).length,
                      pageSize: PRODUCTS_PAGE_SIZE,
                    }}
                    onPageChange={setProductPage}
                    isLoading={isLoading}
                    />
                )}
                {currentView === 'customers' && (
                    <CustomersTable 
                        customers={filteredData as any} 
                        isLoading={isLoading}
                    />
                )}
             </div>
          )}
        </div>
      </main>
      
      {/* Modals */}
      <CategoryManagementModal
        isOpen={showAddCategory}
        onClose={() => setShowAddCategory(false)}
        categories={categories}
        onAddCategory={onAddCategory}
        onUpdateCategory={onUpdateCategory}
        onDeleteCategory={onDeleteCategory}
      />
      <ProductFormModal 
        isOpen={showProductModal} 
        onClose={() => setShowProductModal(false)} 
        product={editingProduct}
        categories={categories}
        onSave={handleSaveProduct}
      />
      <OrderDetailsModal 
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        order={selectedOrder}
        onUpdateStatus={handleUpdateOrderStatus}
        onCancelOrder={handleCancelOrder}
      />
    </div>
  );
};

export default AdminPanel;
