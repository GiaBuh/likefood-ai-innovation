import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePermission } from '../../hooks/usePermission';

type AdminViewType = 'dashboard' | 'orders' | 'products' | 'customers' | 'vouchers' | 'flashsale' | 'chatting' | 'trends' | 'aicombo' | 'staff';

interface AdminSidebarProps {
  onExit: () => void;
}

const viewToPath: Record<AdminViewType, string> = {
  dashboard: '/admin',
  orders: '/admin/orders',
  products: '/admin/products',
  customers: '/admin/customers',
  vouchers: '/admin/vouchers',
  flashsale: '/admin/flash-sale',
  chatting: '/admin/chat',
  trends: '/admin/trends',
  aicombo: '/admin/combo',
  staff: '/admin/staff',
};

// Map view to required permission resource for VIEW access
const viewPermissionMap: Record<AdminViewType, string | null> = {
  dashboard: 'DASHBOARD',
  orders: 'ORDERS',
  products: 'PRODUCTS',
  customers: 'CUSTOMERS',
  vouchers: 'VOUCHERS',
  flashsale: null,  // accessible to all admin
  chatting: 'CHAT',
  trends: null,    // accessible to all admin
  aicombo: null,   // accessible to all admin
  staff: 'STAFF',
};

const menuItems: { view: AdminViewType; icon: string; label: string }[] = [
  { view: 'dashboard', icon: 'dashboard', label: 'Tổng quan' },
  { view: 'orders', icon: 'shopping_bag', label: 'Đơn hàng' },
  { view: 'products', icon: 'inventory_2', label: 'Sản phẩm' },
  { view: 'customers', icon: 'group', label: 'Khách hàng' },
  { view: 'vouchers', icon: 'loyalty', label: 'Khuyến mãi' },
  { view: 'flashsale', icon: 'bolt', label: 'Flash Sale' },
  { view: 'chatting', icon: 'chat', label: 'Chat' },
  { view: 'staff', icon: 'admin_panel_settings', label: 'Nhân viên' },
  { view: 'trends', icon: 'trending_up', label: 'Xu hướng AI' },
  { view: 'aicombo', icon: 'magic_button', label: 'Tạo Combo Đu Trend' },
];

const AdminSidebar: React.FC<AdminSidebarProps> = ({ onExit }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = usePermission();

  const getActiveView = (): AdminViewType => {
    const path = location.pathname;
    if (path === '/admin' || path === '/admin/') return 'dashboard';
    if (path.startsWith('/admin/orders')) return 'orders';
    if (path.startsWith('/admin/products')) return 'products';
    if (path.startsWith('/admin/customers')) return 'customers';
    if (path.startsWith('/admin/vouchers')) return 'vouchers';
    if (path.startsWith('/admin/flash-sale')) return 'flashsale';
    if (path.startsWith('/admin/chat')) return 'chatting';
    if (path.startsWith('/admin/trends')) return 'trends';
    if (path.startsWith('/admin/combo')) return 'aicombo';
    if (path.startsWith('/admin/staff')) return 'staff';
    return 'dashboard';
  };

  const currentView = getActiveView();

  // Filter menu items by permission
  const visibleMenuItems = menuItems.filter(item => {
    const resource = viewPermissionMap[item.view];
    if (resource === null) return true; // no permission needed
    return hasPermission(resource, 'VIEW');
  });

  return (
    <aside className="flex w-72 flex-col border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 transition-all duration-300 h-full">
      {/* Logo Header */}
      <div className="flex h-20 items-center gap-3 px-6 border-b border-neutral-100 dark:border-neutral-800">
        <div className="relative">
          <img src="/logo_likefood.png" alt="LikeFood Logo" className="h-12 w-12 rounded-full object-cover ring-2 ring-primary-500/20" />
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-neutral-950" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-base font-extrabold leading-none text-neutral-900 dark:text-white tracking-tight">LIKEFOOD</h1>
          <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mt-1">Bảng quản trị</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-1 flex-col justify-between overflow-y-auto p-4">
        <nav className="flex flex-col gap-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 px-4 mb-2">Menu</p>
          {visibleMenuItems.map((item) => {
            const isActive = currentView === item.view;
            return (
              <div
                key={item.view}
                onClick={() => navigate(viewToPath[item.view])}
                className={`
                  group flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer
                  transition-all duration-200 relative
                  ${isActive
                    ? 'bg-gradient-to-r from-primary-500/10 to-primary-500/5 text-primary-600 dark:text-primary-400 border-l-[3px] border-primary-500'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-white border-l-[3px] border-transparent'
                  }
                `}
              >
                <span className={`material-symbols-outlined !text-xl transition-all duration-200 ${isActive ? 'fill-1' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </span>
                <span className={`text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="flex flex-col gap-2 border-t border-neutral-100 dark:border-neutral-800 pt-4">
          <button
            onClick={onExit}
            className="group flex items-center gap-3 rounded-xl px-4 py-3 text-neutral-500 dark:text-neutral-400 
              hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 
              transition-all duration-200 w-full text-left"
          >
            <span className="material-symbols-outlined !text-xl group-hover:translate-x-[-2px] transition-transform">logout</span>
            <span className="text-sm font-medium">Thoát về cửa hàng</span>
          </button>

          {/* Admin Profile Card */}
          <div className="mt-2 flex items-center gap-3 px-4 py-3 cursor-pointer 
            hover:bg-neutral-50 dark:hover:bg-neutral-800/60 rounded-xl transition-all duration-200">
            <div className="relative">
              <div className="h-10 w-10 overflow-hidden rounded-full ring-2 ring-neutral-200 dark:ring-neutral-700">
                <img
                  src="https://ui-avatars.com/api/?name=Admin+User&background=ea580c&color=fff"
                  alt="Quản trị viên"
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-neutral-950" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-bold text-neutral-900 dark:text-white">Quản trị viên</span>
              <span className="truncate text-xs text-neutral-500 dark:text-neutral-400">admin@likefood.vn</span>
            </div>
            <span className="material-symbols-outlined !text-base text-neutral-400 ml-auto">unfold_more</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;