
import React, { useState, useEffect, useRef } from 'react';
import CheckoutStepper from './CheckoutStepper';
import CartReview from './CartReview';
import ShippingForm from './ShippingForm';
import PaymentStep from './PaymentStep';
import OrderSuccess from './OrderSuccess';
import BoxAnimation from './BoxAnimation';
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

const Checkout: React.FC<CheckoutProps> = ({ 
  onBackToHome,
  onPlaceOrder,
  onViewOrders
}) => {
  const { user } = useAuth();
  const { cart, updateCartQuantity, removeFromCart, addToCartByVariantId, retryVnpayPayment } = useShop();
  const { showError } = useToast();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BANK_TRANSFER'>('COD');
  const [lastCheckoutResult, setLastCheckoutResult] = useState<CheckoutOrderResult | null>(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    note: ''
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'name' | 'phone' | 'address', string>>>({});
  const [selectedShopVoucher, setSelectedShopVoucher] = useState<UserVoucher | null>(null);
  const [selectedShippingVoucher, setSelectedShippingVoucher] = useState<UserVoucher | null>(null);
  const [isPacking, setIsPacking] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.name,
        phone: prev.phone || user.phone,
        address: prev.address || user.address
      }));
    }
  }, [user]);

  // Scroll to top of content on step change
  useEffect(() => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step]);

  const handleNextStep = () => {
    setDirection('forward');
    setStep(step + 1);
  };

  const handlePrevStep = (s: number) => {
    setDirection('backward');
    setStep(s);
  };

  const handlePlaceOrderClick = async () => {
    const errors = validateCheckout({
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
    });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      setIsPacking(true);
      const [result] = await Promise.all([
        onPlaceOrder({
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          note: formData.note,
          paymentMethod,
          shopVoucherId: selectedShopVoucher?.id,
          shippingVoucherId: selectedShippingVoucher?.id,
        }),
        new Promise(resolve => setTimeout(resolve, 3000))
      ]);
      setLastCheckoutResult(result as CheckoutOrderResult);
      setDirection('forward');

      // If VNPay payment is required, redirect to VNPay
      const checkoutResult = result as CheckoutOrderResult;
      if (checkoutResult.paymentRequired && checkoutResult.vnpayPaymentUrl) {
        window.location.href = checkoutResult.vnpayPaymentUrl;
        return;
      }

      setStep(4);
    } catch (error) {
      console.error('Cannot place order.', error);
      showError(error instanceof Error ? error.message : 'Không thể đặt hàng. Vui lòng kiểm tra giỏ hàng và thử lại.');
    } finally {
      setIsPacking(false);
    }
  };

  const handleRetryPayment = async () => {
    if (!lastCheckoutResult?.order?.id) return;
    try {
      const paymentUrl = await retryVnpayPayment(lastCheckoutResult.order.id);
      window.location.href = paymentUrl;
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Không thể mở thanh toán VNPay.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const field = e.target.name as 'name' | 'phone' | 'address' | 'note';
    setFormData({
      ...formData,
      [field]: e.target.value
    });
    if (field !== 'note' && fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const slideClass = direction === 'forward'
    ? 'animate-in fade-in slide-in-from-right-4 duration-300'
    : 'animate-in fade-in slide-in-from-left-4 duration-300';

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8" ref={contentRef}>
      {isPacking && <BoxAnimation />}

      {/* Stepper */}
      <CheckoutStepper step={step} onStepClick={(s) => {
        if (s < step && step !== 4) handlePrevStep(s);
      }} />

      {/* Content Card */}
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
              onPlaceOrder={handleNextStep}
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
              onConfirm={handlePlaceOrderClick}
              isSubmitting={isPacking}
            />
          )}
          
          {step === 4 && (
            <OrderSuccess 
              onBackToHome={onBackToHome}
              onViewOrder={onViewOrders}
              paymentMethod={paymentMethod}
              paymentStatusRaw={lastCheckoutResult?.order?.paymentStatusRaw}
              onRetryPayment={paymentMethod === 'BANK_TRANSFER' ? handleRetryPayment : undefined}
            />
          )}
        </div>
      </div>

      {/* Trust badges */}
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
