import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch, getErrorMessageFromResponse } from '../../services/apiClient';
import { usePermission } from '../../hooks/usePermission';

// Types
interface StaffUser {
  id: string;
  username: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  role?: { id: string; name: string };
}

interface RoleItem {
  id: string;
  name: string;
  userCount: number;
  permissions: { id: string; resource: string; action: string }[];
}

interface PermissionItem {
  id: string;
  resource: string;
  action: string;
}

// ======================== API Functions ========================
async function fetchStaffList(): Promise<StaffUser[]> {
  const res = await apiFetch('/users?size=100', { requireAuth: true });
  if (!res.ok) throw new Error(await getErrorMessageFromResponse(res, 'Lỗi tải danh sách'));
  const json = await res.json() as any;
  const data = json?.data?.result || json?.result || [];
  return data.filter((u: any) => {
    const roleName = u.role?.name || '';
    return roleName !== 'USER';
  });
}

async function fetchRoles(): Promise<RoleItem[]> {
  const res = await apiFetch('/roles', { requireAuth: true });
  if (!res.ok) throw new Error(await getErrorMessageFromResponse(res, 'Lỗi tải roles'));
  const json = await res.json() as any;
  return json?.data || json || [];
}

async function fetchPermissions(): Promise<PermissionItem[]> {
  const res = await apiFetch('/permissions', { requireAuth: true });
  if (!res.ok) throw new Error(await getErrorMessageFromResponse(res, 'Lỗi tải permissions'));
  const json = await res.json() as any;
  return json?.data || json || [];
}

async function createStaffApi(data: { email: string; username: string; password: string; roleId: string }): Promise<void> {
  const res = await apiFetch('/users/staff', {
    method: 'POST',
    body: JSON.stringify(data),
    requireAuth: true,
  });
  if (!res.ok) throw new Error(await getErrorMessageFromResponse(res, 'Tạo nhân viên thất bại'));
}

async function createRoleApi(data: { name: string; permissionIds: string[] }): Promise<void> {
  const res = await apiFetch('/roles', {
    method: 'POST',
    body: JSON.stringify(data),
    requireAuth: true,
  });
  if (!res.ok) throw new Error(await getErrorMessageFromResponse(res, 'Tạo role thất bại'));
}

async function updateRoleApi(id: string, data: { name: string; permissionIds: string[] }): Promise<void> {
  const res = await apiFetch(`/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    requireAuth: true,
  });
  if (!res.ok) throw new Error(await getErrorMessageFromResponse(res, 'Cập nhật role thất bại'));
}

async function deleteRoleApi(id: string): Promise<void> {
  const res = await apiFetch(`/roles/${id}`, { method: 'DELETE', requireAuth: true });
  if (!res.ok) throw new Error(await getErrorMessageFromResponse(res, 'Xóa role thất bại'));
}

// ======================== StaffFormModal ========================
const StaffFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  roles: RoleItem[];
  onSaved: () => void;
}> = ({ isOpen, onClose, roles, onSaved }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail(''); setUsername(''); setPassword(''); setRoleId(''); setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const adminRoles = roles.filter(r => r.name !== 'USER' && r.name !== 'SUPER_ADMIN');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Tạo tài khoản nhân viên</h2>
          <button onClick={onClose} className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={async (e) => {
          e.preventDefault(); setError(''); setLoading(true);
          try {
            await createStaffApi({ email, username, password, roleId });
            onSaved(); onClose();
          } catch (err: any) { setError(err.message); } finally { setLoading(false); }
        }} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Email *</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Tên hiển thị *</label>
            <input type="text" required value={username} onChange={e => setUsername(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Mật khẩu tạm *</label>
            <input type="text" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Nhân viên sẽ phải đổi khi đăng nhập lần đầu"
              className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Vai trò *</label>
            <select required value={roleId} onChange={e => setRoleId(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">-- Chọn vai trò --</option>
              {adminRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <button type="button" onClick={onClose} disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50">Hủy</button>
            <button type="submit" disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/25 transition-all disabled:opacity-50">
              {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ======================== RoleFormModal ========================
const RESOURCE_LABELS: Record<string, string> = {
  DASHBOARD: 'Tổng quan',
  PRODUCTS: 'Sản phẩm',
  CATEGORIES: 'Danh mục',
  ORDERS: 'Đơn hàng',
  CUSTOMERS: 'Khách hàng',
  VOUCHERS: 'Khuyến mãi',
  STAFF: 'Nhân viên',
  CHAT: 'Chat',
};

const ACTION_LABELS: Record<string, string> = {
  VIEW: 'Xem',
  CREATE: 'Tạo',
  EDIT: 'Sửa',
  DELETE: 'Xóa',
};

const RoleFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  allPermissions: PermissionItem[];
  editingRole: RoleItem | null;
  onSaved: () => void;
}> = ({ isOpen, onClose, allPermissions, editingRole, onSaved }) => {
  const [name, setName] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (editingRole) {
        setName(editingRole.name);
        setSelectedIds(new Set(editingRole.permissions.map(p => p.id)));
      } else {
        setName('');
        setSelectedIds(new Set());
      }
    }
  }, [isOpen, editingRole]);

  if (!isOpen) return null;

  // Group permissions by resource
  const resources = Array.from(new Set(allPermissions.map(p => p.resource)));
  const actions = Array.from(new Set(allPermissions.map(p => p.action)));

  const togglePermission = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleResource = (resource: string) => {
    const resourcePerms = allPermissions.filter(p => p.resource === resource);
    const allSelected = resourcePerms.every(p => selectedIds.has(p.id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      resourcePerms.forEach(p => allSelected ? next.delete(p.id) : next.add(p.id));
      return next;
    });
  };

  const selectAll = () => {
    const all = allPermissions.every(p => selectedIds.has(p.id));
    setSelectedIds(all ? new Set() : new Set(allPermissions.map(p => p.id)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{editingRole ? 'Chỉnh sửa vai trò' : 'Tạo vai trò mới'}</h2>
          <button onClick={onClose} className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={async (e) => {
          e.preventDefault(); setError(''); setLoading(true);
          try {
            const data = { name: name.trim(), permissionIds: Array.from(selectedIds) };
            editingRole ? await updateRoleApi(editingRole.id, data) : await createRoleApi(data);
            onSaved(); onClose();
          } catch (err: any) { setError(err.message); } finally { setLoading(false); }
        }} className="flex flex-col flex-1 min-h-0">
          <div className="p-6 overflow-y-auto flex-1">
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Tên vai trò *</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="VD: Quản lý kho"
                className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500" />
            </div>

            {/* Permission Matrix */}
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Ma trận quyền hạn</h3>
              <button type="button" onClick={selectAll}
                className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">
                {allPermissions.every(p => selectedIds.has(p.id)) ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-800/50">
                    <th className="px-4 py-3 text-left font-semibold text-neutral-600 dark:text-neutral-400 w-40">Tài nguyên</th>
                    {actions.map(a => (
                      <th key={a} className="px-4 py-3 text-center font-semibold text-neutral-600 dark:text-neutral-400 w-20">
                        {ACTION_LABELS[a] || a}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center font-semibold text-neutral-600 dark:text-neutral-400 w-20">Tất cả</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {resources.map(resource => {
                    const resourcePerms = allPermissions.filter(p => p.resource === resource);
                    const allChecked = resourcePerms.every(p => selectedIds.has(p.id));
                    return (
                      <tr key={resource} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">
                          {RESOURCE_LABELS[resource] || resource}
                        </td>
                        {actions.map(action => {
                          const perm = resourcePerms.find(p => p.action === action);
                          if (!perm) return <td key={action} className="px-4 py-3 text-center"><span className="text-neutral-300">—</span></td>;
                          return (
                            <td key={action} className="px-4 py-3 text-center">
                              <input type="checkbox" checked={selectedIds.has(perm.id)} onChange={() => togglePermission(perm.id)}
                                className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 cursor-pointer" />
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-center">
                          <input type="checkbox" checked={allChecked} onChange={() => toggleResource(resource)}
                            className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 cursor-pointer" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="mt-2 text-xs text-neutral-500">Đã chọn {selectedIds.size}/{allPermissions.length} quyền</p>

            {error && <p className="mt-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">{error}</p>}
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 shrink-0">
            <button type="button" onClick={onClose} disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50">Hủy</button>
            <button type="submit" disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/25 transition-all disabled:opacity-50">
              {loading ? 'Đang lưu...' : (editingRole ? 'Cập nhật' : 'Tạo vai trò')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ======================== Main Component ========================
type TabType = 'staff' | 'roles';

const StaffManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('staff');
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const { hasPermission } = usePermission();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [staff, roleList, perms] = await Promise.all([
        fetchStaffList().catch(() => []),
        fetchRoles().catch(() => []),
        fetchPermissions().catch(() => []),
      ]);
      setStaffList(staff);
      setRoles(roleList);
      setAllPermissions(perms);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDeleteRole = async (role: RoleItem) => {
    if (role.name === 'SUPER_ADMIN' || role.name === 'USER' || role.name === 'ADMIN') {
      alert('Không thể xóa role hệ thống');
      return;
    }
    if (role.userCount > 0) {
      alert(`Không thể xóa role đang có ${role.userCount} nhân viên. Chuyển nhân viên sang role khác trước.`);
      return;
    }
    if (!window.confirm(`Xóa vai trò "${role.name}"?`)) return;
    try {
      await deleteRoleApi(role.id);
      await loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Lỗi xóa role');
    }
  };

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'staff', label: 'Nhân viên', icon: 'badge' },
    { key: 'roles', label: 'Vai trò & Quyền hạn', icon: 'admin_panel_settings' },
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}>
              <span className="material-symbols-outlined !text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {activeTab === 'staff' && hasPermission('STAFF', 'CREATE') && (
            <button onClick={() => setShowStaffModal(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2.5 text-sm font-bold text-white hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/20 transition-all">
              <span className="material-symbols-outlined !text-lg">person_add</span>
              Thêm nhân viên
            </button>
          )}
          {activeTab === 'roles' && hasPermission('STAFF', 'CREATE') && (
            <button onClick={() => { setEditingRole(null); setShowRoleModal(true); }}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2.5 text-sm font-bold text-white hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/20 transition-all">
              <span className="material-symbols-outlined !text-lg">add</span>
              Tạo vai trò
            </button>
          )}
        </div>
      </div>

      {/* Staff Tab */}
      {activeTab === 'staff' && (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          {staffList.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center">
              <span className="material-symbols-outlined mb-2 text-4xl text-neutral-400">group</span>
              <p className="text-neutral-500 dark:text-neutral-400">Chưa có nhân viên nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-neutral-50 text-neutral-500 dark:bg-neutral-800/50 dark:text-neutral-400">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Nhân viên</th>
                    <th className="px-6 py-4 font-semibold">Email</th>
                    <th className="px-6 py-4 font-semibold">Vai trò</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {staffList.map(staff => (
                    <tr key={staff.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm">
                            {(staff.username || staff.email)[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-neutral-900 dark:text-white">{staff.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-neutral-600 dark:text-neutral-300">{staff.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                          staff.role?.name === 'SUPER_ADMIN'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                        }`}>
                          {staff.role?.name || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="grid gap-4">
          {roles.filter(r => r.name !== 'USER').map(role => (
            <div key={role.id} className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                    role.name === 'SUPER_ADMIN'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
                      : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                  }`}>
                    <span className="material-symbols-outlined !text-xl">
                      {role.name === 'SUPER_ADMIN' ? 'shield' : 'admin_panel_settings'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 dark:text-white">{role.name}</h3>
                    <p className="text-xs text-neutral-500">{role.userCount} nhân viên • {role.permissions.length} quyền</p>
                  </div>
                </div>
                {role.name !== 'SUPER_ADMIN' && role.name !== 'ADMIN' && (
                  <div className="flex gap-2">
                    {hasPermission('STAFF', 'EDIT') && (
                      <button onClick={() => { setEditingRole(role); setShowRoleModal(true); }}
                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10 transition-colors" title="Sửa">
                        <span className="material-symbols-outlined !text-xl">edit</span>
                      </button>
                    )}
                    {hasPermission('STAFF', 'DELETE') && (
                      <button onClick={() => handleDeleteRole(role)}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors" title="Xóa">
                        <span className="material-symbols-outlined !text-xl">delete</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Permission chips */}
              <div className="flex flex-wrap gap-1.5">
                {role.name === 'SUPER_ADMIN' ? (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400">
                    <span className="material-symbols-outlined !text-sm">verified</span>
                    Toàn quyền hệ thống
                  </span>
                ) : role.permissions.length === 0 ? (
                  <span className="text-xs text-neutral-400 italic">Chưa có quyền nào</span>
                ) : (
                  role.permissions.map(p => (
                    <span key={p.id} className="rounded-full px-2 py-0.5 text-[11px] font-medium bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                      {RESOURCE_LABELS[p.resource] || p.resource}:{ACTION_LABELS[p.action] || p.action}
                    </span>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <StaffFormModal isOpen={showStaffModal} onClose={() => setShowStaffModal(false)} roles={roles} onSaved={loadData} />
      <RoleFormModal isOpen={showRoleModal} onClose={() => { setShowRoleModal(false); setEditingRole(null); }}
        allPermissions={allPermissions} editingRole={editingRole} onSaved={loadData} />
    </div>
  );
};

export default StaffManagement;
