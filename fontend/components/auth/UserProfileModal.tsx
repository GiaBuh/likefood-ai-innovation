import React, { useEffect, useRef, useState } from 'react';
import { User } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { validateProfile } from '../../utils/validation';
import { uploadAvatar } from '../../services/authApi';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdateUser: (data: Partial<User> & { avatarKey?: string }) => void | Promise<void>;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, user, onUpdateUser }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showError, showSuccess } = useToast();
  const [isEditing, setIsEditing] = useState(false);
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
  }, [isOpen, user]);

  if (!isOpen) return null;

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showError('Only image files are allowed.');
      return;
    }
    setIsUploadingAvatar(true);
    try {
      const key = await uploadAvatar(file);
      await onUpdateUser({ avatarKey: key });
      showSuccess('Avatar updated.');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Upload avatar failed.');
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
      showSuccess('Profile updated.');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Update profile failed.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-stone-900 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg animate-in zoom-in-95 duration-300 border border-stone-100 dark:border-stone-800">
          
          {/* Header */}
          <div className="bg-stone-50 dark:bg-stone-800/50 px-4 py-6 sm:px-6 border-b border-stone-100 dark:border-stone-800 flex flex-col items-center">
             
             {/* Avatar with edit overlay */}
             <div 
                className={`group relative h-24 w-24 rounded-full bg-white dark:bg-stone-700 p-1 shadow-md mb-3 ${isUploadingAvatar ? 'cursor-wait opacity-70' : 'cursor-pointer'}`}
                onClick={isUploadingAvatar ? undefined : handleAvatarClick}
                title={isUploadingAvatar ? 'Uploading...' : 'Click to change avatar'}
             >
               <img 
                 src={user.avatar} 
                 alt="User Avatar" 
                 className="h-full w-full rounded-full bg-stone-100 dark:bg-stone-800 object-cover"
               />
               <div className="absolute inset-0 m-1 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                 <span className="material-symbols-outlined text-white">photo_camera</span>
               </div>
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 className="hidden" 
                 accept="image/*"
                 onChange={handleFileChange}
               />
             </div>

             <h3 className="text-xl font-bold text-slate-900 dark:text-white" id="modal-title">{formData.name || user.name}</h3>
             <p className="text-sm text-stone-500 dark:text-stone-400">Premium Member</p>
             <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-500 dark:hover:text-stone-300"
             >
               <span className="material-symbols-outlined">close</span>
             </button>
          </div>

          {/* Body */}
          <div className="px-4 py-6 sm:p-6 space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`w-full px-4 py-3 rounded-lg bg-stone-50 dark:bg-stone-800/50 border text-slate-700 dark:text-stone-200 font-medium ${
                  fieldErrors.name ? 'border-red-400 dark:border-red-500' : 'border-stone-200 dark:border-stone-700'
                } ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
              />
              {fieldErrors.name && <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">Email Address</label>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 text-slate-700 dark:text-stone-200 font-medium opacity-70">
                <span className="material-symbols-outlined text-stone-400">mail</span>
                {user.email}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">Phone Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`w-full px-4 py-3 rounded-lg bg-stone-50 dark:bg-stone-800/50 border text-slate-700 dark:text-stone-200 font-medium ${
                  fieldErrors.phone ? 'border-red-400 dark:border-red-500' : 'border-stone-200 dark:border-stone-700'
                } ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
              />
              {fieldErrors.phone && <p className="mt-1 text-xs text-red-500">{fieldErrors.phone}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">Default Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                disabled={!isEditing}
                rows={3}
                className={`w-full px-4 py-3 rounded-lg bg-stone-50 dark:bg-stone-800/50 border text-slate-700 dark:text-stone-200 font-medium resize-none ${
                  fieldErrors.address ? 'border-red-400 dark:border-red-500' : 'border-stone-200 dark:border-stone-700'
                } ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
              />
              {fieldErrors.address && <p className="mt-1 text-xs text-red-500">{fieldErrors.address}</p>}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-stone-50 dark:bg-stone-800/30 px-4 py-4 sm:flex sm:flex-row-reverse sm:px-6 gap-3">
            <button 
              type="button" 
              onClick={() => {
                if (!isEditing) {
                  setIsEditing(true);
                  return;
                }
                handleSubmitEdit();
              }}
              disabled={isSaving}
              className="inline-flex w-full justify-center rounded-xl bg-primary px-3 py-2 text-sm font-bold text-white shadow-sm hover:bg-primary-dark sm:w-auto transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Edit Profile'}
            </button>
            {isEditing && (
              <button 
                type="button" 
                className="mt-3 inline-flex w-full justify-center rounded-xl bg-white dark:bg-stone-800 px-3 py-2 text-sm font-bold text-slate-900 dark:text-stone-200 shadow-sm ring-1 ring-inset ring-stone-300 dark:ring-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700 sm:mt-0 sm:w-auto transition-colors" 
                onClick={() => {
                  setIsEditing(false);
                  setFieldErrors({});
                  setFormData({
                    name: user.name || '',
                    phone: user.phone || '',
                    address: user.address || '',
                  });
                }}
              >
                Cancel
              </button>
            )}
            <button 
              type="button" 
              className="mt-3 inline-flex w-full justify-center rounded-xl bg-white dark:bg-stone-800 px-3 py-2 text-sm font-bold text-slate-900 dark:text-stone-200 shadow-sm ring-1 ring-inset ring-stone-300 dark:ring-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700 sm:mt-0 sm:w-auto transition-colors" 
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;