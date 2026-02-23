
import React, { useState, useEffect } from 'react';
import CheckoutStepper from './CheckoutStepper';
import CartReview from './CartReview';
import ShippingForm from './ShippingForm';
import OrderSuccess from './OrderSuccess';
import { useAuth } from '../../contexts/AuthContext';
import { useShop } from '../../contexts/ShopContext';
import { useToast } from '../../contexts/ToastContext';
import { validateCheckout } from '../../utils/validation';

interface CheckoutProps {
  onBackToHome: () => void;
  onPlaceOrder: (payload: { name: string; phone: string; address: string; note?: string }) => Promise<void>;
  onViewOrders: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ 
  onBackToHome,
  onPlaceOrder,
  onViewOrders
}) => {
  const { user } = useAuth();
  const { cart, updateCartQuantity, removeFromCart } = useShop();
  const { showError } = useToast();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    note: ''
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'name' | 'phone' | 'address', string>>>({});

  // Ensure form updates if user data loads late or changes (optional safety)
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

  const handleNextStep = () => {
    setStep(step + 1);
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
      await onPlaceOrder({
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        note: formData.note,
      });
      setStep(3);
    } catch (error) {
      console.error('Cannot place order.', error);
      showError(error instanceof Error ? error.message : 'Cannot place order. Please check your cart and try again.');
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <CheckoutStepper step={step} onStepClick={(s) => {
        // Only allow clicking back to previous steps, not forward to future steps (unless already completed, but keeping simple for now)
        if (s < step && step !== 3) setStep(s);
      }} />

      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-100 dark:border-stone-800 p-6 sm:p-8 mt-12">
        {step === 1 && (
          <CartReview 
            cart={cart}
            onUpdateQuantity={updateCartQuantity}
            onRemoveItem={removeFromCart}
            onBackToHome={onBackToHome}
            onNext={handleNextStep}
          />
        )}
        
        {step === 2 && (
          <ShippingForm 
            cart={cart}
            formData={formData}
            errors={fieldErrors}
            onInputChange={handleInputChange}
            onBack={() => setStep(1)}
            onPlaceOrder={handlePlaceOrderClick}
          />
        )}
        
        {step === 3 && (
          <OrderSuccess 
            onBackToHome={onBackToHome}
            onViewOrder={onViewOrders}
          />
        )}
      </div>
    </div>
  );
};

export default Checkout;
