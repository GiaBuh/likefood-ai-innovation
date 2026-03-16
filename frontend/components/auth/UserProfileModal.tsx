import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { validateProfile } from '../../utils/validation';
import { uploadAvatar } from '../../services/authApi';
import { fetchOrders } from '../../services/shopApi';
import VoucherWalletTab from './VoucherWalletTab';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdateUser: (data: Partial<User> & { avatarKey?: string }) => void | Promise<void>;
}

interface UserStats {
  totalOrders: number;
  totalSpent: number;
  memberSince: string;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, user, onUpdateUser }) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showError, showSuccess } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'INFO' | 'VOUCHERS'>('INFO');
  const [stats, setStats] = useState<UserStats>({ totalOrders: 0, totalSpent: 0, memberSince: '2024' });
  const [formData, setFormData] = useState({
    name: user.name || '',
    phone: user.phone || '',
    address: user.address || '',
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'name' | 'phone' | 'address', string>>>({});

  useEffect(() => {
    if (!isOpen) return;
    setIsEditing(false);
    setFieldErrors({});
    setFormData({
      name: user.name || '',
      phone: user.phone || '',
      address: user.address || '',
    });

    // Fetch user stats
    fetchOrders()
      .then((orders) => {
        const completedOrders = orders.filter(o => o.status !== 'CANCELLED');
        const totalSpent = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        setStats({
          totalOrders: completedOrders.length,
          totalSpent,
          memberSince: '2024',
        });
      })
      .catch(() => {
        // silently fail, keep default stats
      });
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showError(t('profile.avatarOnlyImage'));
      return;
    }
    setIsUploadingAvatar(true);
    try {
      const key = await uploadAvatar(file);
      await onUpdateUser({ avatarKey: key });
      showSuccess(t('profile.avatarUpdated'));
    } catch (err) {
      showError(err instanceof Error ? err.message : t('profile.avatarError'));
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const field = e.target.name as 'name' | 'phone' | 'address';
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmitEdit = async () => {
    const errors = validateProfile(formData);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setIsSaving(true);
    try {
      await onUpdateUser({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
      });
      setIsEditing(false);
      showSuccess(t('profile.profileUpdated'));
    } catch (err) {
      showError(err instanceof Error ? err.message : t('profile.profileError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFieldErrors({});
    setFormData({
      name: user.name || '',
      phone: user.phone || '',
      address: user.address || '',
    });
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl transition-all border border-neutral-200 dark:border-neutral-800">

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            <span className="material-symbols-outlined !text-lg">close</span>
          </button>

          {/* ─── Gradient Header ─── */}
          <div className="relative h-28 bg-gradient-to-br from-primary via-emerald-500 to-teal-400 overflow-hidden">
            {/* Decorative pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-[-20px] right-[-20px] w-40 h-40 rounded-full bg-white/20" />
              <div className="absolute bottom-[-30px] left-[-10px] w-32 h-32 rounded-full bg-white/15" />
              <div className="absolute top-4 left-[40%] w-16 h-16 rounded-full bg-white/10" />
            </div>
          </div>

          {/* ─── Avatar (overlapping header) ─── */}
          <div className="flex flex-col items-center -mt-14 relative z-10 px-6">
            <div
              className={`group relative h-28 w-28 rounded-full p-1 bg-white dark:bg-neutral-900 shadow-lg ${isUploadingAvatar ? 'cursor-wait' : 'cursor-pointer'}`}
              onClick={isUploadingAvatar ? undefined : handleAvatarClick}
            >
              <img
                src={user.avatar}
                alt="Avatar"
                className="h-full w-full rounded-full object-cover bg-neutral-100 dark:bg-neutral-800"
              />
              {/* Hover overlay */}
              <div className="absolute inset-1 rounded-full bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span className="material-symbols-outlined text-white !text-xl">photo_camera</span>
                <span className="text-white text-[10px] font-medium mt-0.5">{t('profile.changeAvatar')}</span>
              </div>
              {/* Uploading spinner */}
              {isUploadingAvatar && (
                <div className="absolute inset-1 rounded-full bg-black/50 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
              {/* Online indicator */}
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 rounded-full border-[3px] border-white dark:border-neutral-900" />
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            {/* User Name & Badge */}
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mt-3" id="modal-title">
              {formData.name || user.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm">
                <span className="material-symbols-outlined !text-[12px]">star</span>
                {t('profile.premiumMember')}
              </span>
            </div>
          </div>

          {/* ─── Stats Row ─── */}
          <div className="grid grid-cols-3 gap-3 px-6 mt-5">
            <div className="text-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-700/50">
              <div className="text-xl font-bold text-primary">{stats.totalOrders}</div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium mt-0.5">{t('profile.totalOrders')}</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-700/50">
              <div className="text-xl font-bold text-emerald-500">${stats.totalSpent.toFixed(0)}</div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium mt-0.5">{t('profile.totalSpent')}</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-700/50">
              <div className="text-xl font-bold text-amber-500">{stats.memberSince}</div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium mt-0.5">{t('profile.memberSince')}</div>
            </div>
          </div>

          {/* ─── Tabs ─── */}
          <div className="flex px-6 mt-4 border-b border-neutral-100 dark:border-neutral-800">
            <button
              onClick={() => setActiveTab('INFO')}
              className={`pb-2.5 px-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'INFO' ? 'border-primary-500 text-primary-500' : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
            >
              Cá nhân
            </button>
            <button
              onClick={() => setActiveTab('VOUCHERS')}
              className={`pb-2.5 px-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'VOUCHERS' ? 'border-primary-500 text-primary-500' : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
            >
              Ví Voucher
            </button>
          </div>

          <div className="max-h-[50vh] overflow-y-auto scrollbar-hide pt-4">
            {activeTab === 'INFO' ? (
              <>
                {/* ─── Form Fields ─── */}
                <div className="px-6 pb-2 space-y-3.5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-neutral-400 dark:text-neutral-500 mb-1 tracking-wider">
                      {t('auth.fullName')}
                    </label>
                    <div className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-colors ${
                      fieldErrors.name
                        ? 'border-red-400 dark:border-red-500 bg-red-50/50 dark:bg-red-900/10'
                        : isEditing
                          ? 'border-primary/40 bg-primary/5 dark:bg-primary/5'
                          : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50'
                    }`}>
                      <span className="material-symbols-outlined !text-lg text-neutral-400">person</span>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="flex-1 bg-transparent text-sm font-medium text-neutral-800 dark:text-neutral-200 outline-none disabled:opacity-60"
                      />
                    </div>
                    {fieldErrors.name && <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p>}
                  </div>

                  {/* Email (read-only) */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-neutral-400 dark:text-neutral-500 mb-1 tracking-wider">
                      {t('auth.email')}
                    </label>
                    <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 opacity-60">
                      <span className="material-symbols-outlined !text-lg text-neutral-400">mail</span>
                      <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{user.email}</span>
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-neutral-400 dark:text-neutral-500 mb-1 tracking-wider">
                      {t('auth.phone')}
                    </label>
                    <div className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-colors ${
                      fieldErrors.phone
                        ? 'border-red-400 dark:border-red-500 bg-red-50/50 dark:bg-red-900/10'
                        : isEditing
                          ? 'border-primary/40 bg-primary/5 dark:bg-primary/5'
                          : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50'
                    }`}>
                      <span className="material-symbols-outlined !text-lg text-neutral-400">phone</span>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="flex-1 bg-transparent text-sm font-medium text-neutral-800 dark:text-neutral-200 outline-none disabled:opacity-60"
                      />
                    </div>
                    {fieldErrors.phone && <p className="mt-1 text-xs text-red-500">{fieldErrors.phone}</p>}
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-neutral-400 dark:text-neutral-500 mb-1 tracking-wider">
                      {t('checkout.shippingAddress')}
                    </label>
                    <div className={`flex items-start gap-3 px-3.5 py-2.5 rounded-xl border transition-colors ${
                      fieldErrors.address
                        ? 'border-red-400 dark:border-red-500 bg-red-50/50 dark:bg-red-900/10'
                        : isEditing
                          ? 'border-primary/40 bg-primary/5 dark:bg-primary/5'
                          : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50'
                    }`}>
                      <span className="material-symbols-outlined !text-lg text-neutral-400 mt-0.5">location_on</span>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        rows={2}
                        className="flex-1 bg-transparent text-sm font-medium text-neutral-800 dark:text-neutral-200 outline-none resize-none disabled:opacity-60"
                      />
                    </div>
                    {fieldErrors.address && <p className="mt-1 text-xs text-red-500">{fieldErrors.address}</p>}
                  </div>
                </div>

                {/* ─── Action Buttons ─── */}
                <div className="px-6 pb-6 pt-3 flex gap-3">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleCancel}
                        className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        onClick={handleSubmitEdit}
                        disabled={isSaving}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary to-emerald-500 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSaving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {isSaving ? t('profile.saving') : t('profile.saveChanges')}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-emerald-500 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined !text-lg">edit</span>
                      {t('profile.editProfile')}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <VoucherWalletTab />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;