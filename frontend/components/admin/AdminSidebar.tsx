import React from 'react';

type AdminViewType = 'dashboard' | 'orders' | 'products' | 'customers' | 'chatting' | 'trends';

interface AdminSidebarProps {
  currentView: AdminViewType;
  onNavigate: (view: AdminViewType) => void;
  onExit: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ currentView, onNavigate, onExit }) => {
  const getLinkClass = (view: AdminViewType) => {
    const isActive = currentView === view;
    if (isActive) {
      return "group flex items-center gap-3 rounded-lg bg-primary/10 px-4 py-3 text-primary dark:text-primary transition-colors cursor-pointer";
    }
    return "group flex items-center gap-3 rounded-lg px-4 py-3 text-subtext-light dark:text-subtext-dark hover:bg-background-light dark:hover:bg-background-dark hover:text-primary dark:hover:text-primary transition-colors cursor-pointer";
  };

  const getIconClass = (view: AdminViewType) => {
    return currentView === view ? "material-symbols-outlined fill-1" : "material-symbols-outlined";
  };

  const getTextClass = (view: AdminViewType) => {
    return currentView === view ? "text-sm font-bold" : "text-sm font-medium";
  };

  return (
    <aside className="flex w-72 flex-col border-r border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark transition-all duration-300 h-full">
      <div className="flex h-20 items-center gap-3 px-6 border-b border-border-light dark:border-border-dark">
        <img src="/logo_likefood.png" alt="LikeFood Logo" className="h-12 w-12 rounded-full object-cover drop-shadow-sm" />
        <div className="flex flex-col">
          <h1 className="text-base font-bold leading-none text-text-light dark:text-text-dark">LIKEFOOD</h1>
          <p className="text-xs font-medium text-subtext-light dark:text-subtext-dark mt-1">Admin Panel</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between overflow-y-auto p-4">
        <nav className="flex flex-col gap-2">
          <div onClick={() => onNavigate('dashboard')} className={getLinkClass('dashboard')}>
            <span className={getIconClass('dashboard')}>dashboard</span>
            <span className={getTextClass('dashboard')}>Dashboard</span>
          </div>

          <div onClick={() => onNavigate('orders')} className={getLinkClass('orders')}>
            <span className={getIconClass('orders')}>shopping_bag</span>
            <span className={getTextClass('orders')}>Orders</span>
          </div>

          <div onClick={() => onNavigate('products')} className={getLinkClass('products')}>
            <span className={getIconClass('products')}>inventory_2</span>
            <span className={getTextClass('products')}>Products</span>
          </div>

          <div onClick={() => onNavigate('customers')} className={getLinkClass('customers')}>
            <span className={getIconClass('customers')}>group</span>
            <span className={getTextClass('customers')}>Customers</span>
          </div>

          <div onClick={() => onNavigate('chatting')} className={getLinkClass('chatting')}>
            <span className={getIconClass('chatting')}>chat</span>
            <span className={getTextClass('chatting')}>Chatting</span>
          </div>

          <div onClick={() => onNavigate('trends')} className={getLinkClass('trends')}>
            <span className={getIconClass('trends')}>trending_up</span>
            <span className={getTextClass('trends')}>AI Trends</span>
          </div>
        </nav>

        <div className="flex flex-col gap-2 border-t border-border-light dark:border-border-dark pt-4">
          <button onClick={onExit} className="group flex items-center gap-3 rounded-lg px-4 py-3 text-subtext-light dark:text-subtext-dark hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors w-full text-left">
            <span className="material-symbols-outlined">logout</span>
            <span className="text-sm font-medium">Exit to Shop</span>
          </button>

          <div className="mt-2 flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-background-light dark:hover:bg-background-dark rounded-lg transition-colors">
            <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <img
                src="https://ui-avatars.com/api/?name=Admin+User&background=ea580c&color=fff"
                alt="Admin User"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-bold text-text-light dark:text-text-dark">Admin User</span>
              <span className="truncate text-xs text-subtext-light dark:text-subtext-dark">admin@likefood.vn</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;