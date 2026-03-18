import React, { useCallback, useEffect, useRef, useState } from 'react';
import CheckoutStepper from './CheckoutStepper';
import CartReview from './CartReview';
import ShippingForm from './ShippingForm';
import OrderSuccess from './OrderSuccess';
import PaymentStep from './PaymentStep';
import { useAuth } from '../../contexts/AuthContext';
import { useShop } from '../../contexts/ShopContext';
import { useToast } from '../../contexts/ToastContext';
import { validateCheckout } from '../../utils/validation';
import { UserVoucher } from '../../types';
import { CheckoutOrderResult } from '../../services/shopApi';

interface CheckoutProps {
  onBackToHome: () => void;
  onPlaceOrder: (payload: {
    name: string;
    phone: string;
    address: string;
    note?: string;
    paymentMethod: 'COD' | 'BANK_TRANSFER';
    shopVoucherId?: string;
    shippingVoucherId?: string;
  }) => Promise<CheckoutOrderResult>;
  onViewOrders: () => void;
}

type StoredCheckoutState = {
  orderId: string;
  paymentMethod: 'COD' | 'BANK_TRANSFER';
  paymentStatusRaw: 'PENDING' | 'PAID' | 'FAILED';
};

const LAST_CHECKOUT_KEY = 'likefood_last_checkout';

const Checkout: React.FC<CheckoutProps> = ({ onBackToHome, onPlaceOrder, onViewOrders }) => {
  const { user } = useAuth();
  const { cart, updateCartQuantity, removeFromCart, addToCartByVariantId, retryVnpayPayment } = useShop();
  const { showError } = useToast();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BANK_TRANSFER'>('COD');
  const [lastCheckout, setLastCheckout] = useState<StoredCheckoutState | null>(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    note: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'name' | 'phone' | 'address', string>>>({});
  const [selectedShopVoucher, setSelectedShopVoucher] = useState<UserVoucher | null>(null);
  const [selectedShippingVoucher, setSelectedShippingVoucher] = useState<UserVoucher | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const clearLastCheckout = useCallback(() => {
    sessionStorage.removeItem(LAST_CHECKOUT_KEY);
    setLastCheckout(null);
  }, []);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name,
        phone: prev.phone || user.phone,
        address: prev.address || user.address,
      }));
    }
  }, [user]);

  useEffect(() => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step]);

  useEffect(() => {
    const raw = sessionStorage.getItem(LAST_CHECKOUT_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as StoredCheckoutState;
      if (parsed?.orderId) {
        setLastCheckout(parsed);
        setPaymentMethod(parsed.paymentMethod);
        setStep(4);
      }
    } catch {
      sessionStorage.removeItem(LAST_CHECKOUT_KEY);
    }
  }, []);

  useEffect(() => {
    if (!lastCheckout) return;
    if (cart.length === 0) return;

    clearLastCheckout();
    setDirection('backward');
    setPaymentMethod('COD');
    setStep(1);
  }, [lastCheckout, cart.length, clearLastCheckout]);

  const handleNextStep = () => {
    setDirection('forward');
    setStep((prev) => prev + 1);
  };

  const handlePrevStep = (targetStep: number) => {
    setDirection('backward');
    setStep(targetStep);
  };

  const validateShippingForm = (): boolean => {
    const errors = validateCheckout({
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
    });
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openVnpayCheckout = (paymentUrl: string) => {
    window.location.assign(paymentUrl);
  };

  const handleProceedToPayment = () => {
    if (!validateShippingForm()) {
      return;
    }
    handleNextStep();
  };

  const handleConfirmPayment = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const result = await onPlaceOrder({
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        note: formData.note,
        paymentMethod,
        shopVoucherId: selectedShopVoucher?.id,
        shippingVoucherId: selectedShippingVoucher?.id,
      });

      const stored: StoredCheckoutState = {
        orderId: result.order.id,
        paymentMethod,
        paymentStatusRaw: result.order.paymentStatusRaw || (paymentMethod === 'BANK_TRANSFER' ? 'FAILED' : 'PENDING'),
      };
      setLastCheckout(stored);
      sessionStorage.setItem(LAST_CHECKOUT_KEY, JSON.stringify(stored));

      if (paymentMethod === 'BANK_TRANSFER') {
        if (!result.vnpayPaymentUrl) {
          throw new Error('Không nhận được URL thanh toán VNPay từ backend.');
        }
        openVnpayCheckout(result.vnpayPaymentUrl);
      }

      setDirection('forward');
      setStep(4);
    } catch (error) {
      console.error('Cannot place order.', error);
      showError(error instanceof Error ? error.message : 'Không thể tạo đơn hàng. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetryPayment = async () => {
    if (!lastCheckout?.orderId) return;

    try {
      const paymentUrl = await retryVnpayPayment(lastCheckout.orderId);
      openVnpayCheckout(paymentUrl);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Không thể mở lại VNPay. Vui lòng thử lại.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const field = e.target.name as 'name' | 'phone' | 'address' | 'note';
    setFormData({
      ...formData,
      [field]: e.target.value,
    });
    if (field !== 'note' && fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const slideClass =
    direction === 'forward'
      ? 'animate-in fade-in slide-in-from-right-4 duration-300'
      : 'animate-in fade-in slide-in-from-left-4 duration-300';

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8" ref={contentRef}>
      <CheckoutStepper
        step={step}
        onStepClick={(s) => {
          if (s < step && step !== 4) handlePrevStep(s);
        }}
      />

      <div className="bg-white dark:bg-neutral-900/80 rounded-2xl shadow-xl border border-neutral-100 dark:border-neutral-800/80 p-5 sm:p-8 mt-10 sm:mt-12 backdrop-blur-sm">
        <div key={step} className={slideClass}>
          {step === 1 && (
            <CartReview
              cart={cart}
              onUpdateQuantity={updateCartQuantity}
              onRemoveItem={removeFromCart}
              onBackToHome={onBackToHome}
              onNext={handleNextStep}
              onAddToCartByVariantId={addToCartByVariantId}
            />
          )}

          {step === 2 && (
            <ShippingForm
              cart={cart}
              formData={formData}
              errors={fieldErrors}
              onInputChange={handleInputChange}
              onBack={() => handlePrevStep(1)}
              onNext={handleProceedToPayment}
              selectedShopVoucher={selectedShopVoucher}
              setSelectedShopVoucher={setSelectedShopVoucher}
              selectedShippingVoucher={selectedShippingVoucher}
              setSelectedShippingVoucher={setSelectedShippingVoucher}
            />
          )}

          {step === 3 && (
            <PaymentStep
              cart={cart}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              onBack={() => handlePrevStep(2)}
              onConfirm={handleConfirmPayment}
              isSubmitting={isSubmitting}
            />
          )}

          {step === 4 && (
            <OrderSuccess
              paymentMethod={lastCheckout?.paymentMethod || paymentMethod}
              paymentStatusRaw={lastCheckout?.paymentStatusRaw || 'PENDING'}
              onRetryPayment={lastCheckout?.paymentMethod === 'BANK_TRANSFER' ? handleRetryPayment : undefined}
              onBackToHome={() => {
                clearLastCheckout();
                onBackToHome();
              }}
              onViewOrder={() => {
                clearLastCheckout();
                onViewOrders();
              }}
            />
          )}
        </div>
      </div>

      {step !== 4 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-neutral-400 dark:text-neutral-500">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined !text-sm">lock</span>
            Thanh toán an toàn
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined !text-sm">local_shipping</span>
            Giao hàng tận nơi
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined !text-sm">verified_user</span>
            Bảo hành chất lượng
          </span>
        </div>
      )}
    </div>
  );
};

export default Checkout;
