
import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { validateLogin, validateRegister } from '../../utils/validation';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'login' | 'register';
  onLogin: (email: string, password: string) => Promise<void>;
  onGoogleLoginUrl?: () => Promise<string>;
  onRegister: (payload: {
    username: string;
    email: string;
    phone: string;
    address: string;
    gender: 'male' | 'female';
    password: string;
    confirmPassword: string;
  }) => Promise<void>;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode, onLogin, onGoogleLoginUrl, onRegister }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const { showError, showSuccess } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<
    'username' | 'email' | 'password' | 'confirmPassword' | 'phone' | 'address',
    string
  >>>({});
  
  // Custom Dropdown State
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: '',
    phone: '',
    address: '',
    gender: 'male' // Default gender
  });

  // Reset mode, error, and dropdown state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setFieldErrors({});
      setIsGenderDropdownOpen(false);
      setFormData({
        email: '',
        password: '',
        username: '',
        confirmPassword: '',
        phone: '',
        address: '',
        gender: 'male'
      });
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    setFieldErrors({});
  }, [mode]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const field = e.target.name as 'username' | 'email' | 'password' | 'confirmPassword' | 'phone' | 'address' | 'gender';
    setFormData({
      ...formData,
      [field]: e.target.value
    });
    if (field !== 'gender' && fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleGoogleLogin = async () => {
    if (!onGoogleLoginUrl) {
      showError('Google login is not available.');
      return;
    }
    setIsLoading(true);
    try {
      const url = await onGoogleLoginUrl();
      window.location.href = url; // redirect to Google
    } catch (err: any) {
      showError(err?.message || 'Cannot get Google login URL.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFieldErrors({});

    try {
      if (mode === 'login') {
        const loginErrors = validateLogin({
          email: formData.email,
          password: formData.password,
        });
        if (Object.keys(loginErrors).length > 0) {
          setFieldErrors(loginErrors);
          return;
        }
        await onLogin(formData.email, formData.password);
        onClose();
      } else {
        const trimmed = {
          username: formData.username.trim(),
          email: formData.email.trim(),
          phone: formData.phone.replace(/\s/g, '').trim(),
          address: formData.address.trim(),
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        };
        const registerErrors = validateRegister(trimmed);
        if (Object.keys(registerErrors).length > 0) {
          setFieldErrors(registerErrors);
          return;
        }
        await onRegister({
          username: trimmed.username,
          email: trimmed.email,
          phone: trimmed.phone,
          address: trimmed.address,
          gender: formData.gender as 'male' | 'female',
          password: trimmed.password,
          confirmPassword: trimmed.confirmPassword,
        });
        setMode('login');
        showSuccess('Register successful. Please login.');
      }
    } catch (err: any) {
      showError(err?.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
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
        <div className="relative transform rounded-2xl bg-white dark:bg-stone-900 text-left shadow-2xl transition-all sm:my-8 w-full max-w-lg animate-in zoom-in-95 duration-300 border border-stone-100 dark:border-stone-800">
          
          {/* Header */}
          <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-stone-100 dark:border-stone-800">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h3>
            <button 
              onClick={onClose}
              className="p-2 -mr-2 text-stone-400 hover:text-stone-500 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Register Fields (Top) */}
              {mode === 'register' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">Username</label>
                    <input 
                      type="text" 
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800 focus:ring-primary focus:border-primary transition-all ${
                        fieldErrors.username ? 'border-red-400 dark:border-red-500' : 'border-stone-200 dark:border-stone-700'
                      }`}
                      placeholder="johndoe"
                    />
                    {fieldErrors.username && <p className="mt-1 text-xs text-red-500">{fieldErrors.username}</p>}
                  </div>
                </div>
              )}

              {/* Common Fields */}
              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800 focus:ring-primary focus:border-primary transition-all ${
                    fieldErrors.email ? 'border-red-400 dark:border-red-500' : 'border-stone-200 dark:border-stone-700'
                  }`}
                  placeholder="name@example.com"
                />
                {fieldErrors.email && <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">Password</label>
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800 focus:ring-primary focus:border-primary transition-all ${
                    fieldErrors.password ? 'border-red-400 dark:border-red-500' : 'border-stone-200 dark:border-stone-700'
                  }`}
                  placeholder="••••••••"
                />
                {fieldErrors.password && <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>}
              </div>

              {/* Register Fields (Bottom) */}
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">Confirm Password</label>
                    <input 
                      type="password" 
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800 focus:ring-primary focus:border-primary transition-all ${
                        fieldErrors.confirmPassword ? 'border-red-400 dark:border-red-500' : 'border-stone-200 dark:border-stone-700'
                      }`}
                      placeholder="••••••••"
                    />
                    {fieldErrors.confirmPassword && <p className="mt-1 text-xs text-red-500">{fieldErrors.confirmPassword}</p>}
                  </div>
                  
                  {/* Phone and Gender Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-20">
                    <div>
                      <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">Phone Number</label>
                      <input 
                        type="tel" 
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800 focus:ring-primary focus:border-primary transition-all ${
                          fieldErrors.phone ? 'border-red-400 dark:border-red-500' : 'border-stone-200 dark:border-stone-700'
                        }`}
                        placeholder="09xxxxxxxx"
                      />
                      {fieldErrors.phone && <p className="mt-1 text-xs text-red-500">{fieldErrors.phone}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">Gender</label>
                      <div className="relative">
                        {/* Invisible backdrop to handle click outside */}
                        {isGenderDropdownOpen && (
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setIsGenderDropdownOpen(false)}
                          />
                        )}

                        <div className="relative z-20">
                          <button
                            type="button"
                            onClick={() => setIsGenderDropdownOpen(!isGenderDropdownOpen)}
                            className={`w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800 border transition-all text-left flex items-center justify-between ${
                              isGenderDropdownOpen 
                                ? 'border-primary ring-2 ring-primary/20' 
                                : 'border-stone-200 dark:border-stone-700 focus:border-primary focus:ring-2 focus:ring-primary/20'
                            }`}
                          >
                            <span className="text-slate-900 dark:text-white capitalize font-medium">
                              {formData.gender === 'male' ? 'Male' : 'Female'}
                            </span>
                            <span className={`material-symbols-outlined text-xl text-stone-500 transition-transform duration-200 ${isGenderDropdownOpen ? 'rotate-180' : ''}`}>
                              expand_more
                            </span>
                          </button>
                          
                          {isGenderDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                              {[
                                { value: 'male', label: 'Male' },
                                { value: 'female', label: 'Female' }
                              ].map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, gender: option.value }));
                                    setIsGenderDropdownOpen(false);
                                  }}
                                  className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors flex items-center justify-between ${
                                    formData.gender === option.value 
                                      ? 'bg-primary/5 text-primary' 
                                      : 'text-slate-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700'
                                  }`}
                                >
                                  {option.label}
                                  {formData.gender === option.value && (
                                    <span className="material-symbols-outlined text-lg">check</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Address Row (Full Width) */}
                  <div className="relative z-10">
                    <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">Address</label>
                    <input 
                      type="text" 
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800 focus:ring-primary focus:border-primary transition-all ${
                        fieldErrors.address ? 'border-red-400 dark:border-red-500' : 'border-stone-200 dark:border-stone-700'
                      }`}
                      placeholder="City, Country"
                    />
                    {fieldErrors.address && <p className="mt-1 text-xs text-red-500">{fieldErrors.address}</p>}
                  </div>
                </>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-4 rounded-xl bg-primary text-white font-bold text-lg hover:bg-primary-dark shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all mt-6 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {isLoading ? (
                  <span className="inline-block w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  mode === 'login' ? 'Login with Email' : 'Create Account'
                )}
              </button>
            </form>

             {/* Divider */}
             <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-stone-200 dark:border-stone-700"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase font-bold tracking-wider">
                    <span className="bg-white dark:bg-stone-900 px-3 text-stone-400 dark:text-stone-500">Or continue with</span>
                </div>
            </div>

            {/* Google Login Button */}
            <button 
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-slate-700 dark:text-white font-bold hover:bg-stone-50 dark:hover:bg-stone-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
            </button>

            <div className="mt-6 text-center text-sm">
              <span className="text-stone-500 dark:text-stone-400">
                {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button 
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="font-bold text-primary hover:underline"
              >
                {mode === 'login' ? 'Register' : 'Login'}
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
