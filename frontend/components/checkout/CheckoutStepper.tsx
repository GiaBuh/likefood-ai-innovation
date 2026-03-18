import React from 'react';
import { useTranslation } from 'react-i18next';

interface CheckoutStepperProps {
  step: number;
  onStepClick?: (step: number) => void;
}

const CheckoutStepper: React.FC<CheckoutStepperProps> = ({ step, onStepClick }) => {
  const { t } = useTranslation();

  const steps = [
    { id: 1, label: t('checkout.step1'), icon: 'shopping_cart' },
    { id: 2, label: t('checkout.step2'), icon: 'local_shipping' },
    { id: 3, label: t('checkout.step3'), icon: 'payments' },
    { id: 4, label: t('checkout.step4'), icon: 'check_circle' },
  ];

  return (
    <div className="mb-8 sm:mb-12 max-w-2xl mx-auto px-2">
      <div className="flex items-center justify-between w-full relative">
        {steps.map((s, index) => {
          const isCompleted = step > s.id;
          const isActive = step === s.id;
          const isClickable = s.id < step && step !== 4;

          return (
            <React.Fragment key={s.id}>
              {/* Step Circle */}
              <div className="flex flex-col items-center relative z-10">
                <button
                  onClick={() => isClickable && onStepClick?.(s.id)}
                  disabled={!isClickable}
                  className={`
                    relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center 
                    font-bold text-lg transition-all duration-500 border-[3px]
                    ${isCompleted
                      ? 'bg-gradient-to-br from-green-400 to-emerald-600 border-green-400 text-white shadow-lg shadow-green-500/30 hover:scale-110'
                      : isActive
                        ? 'bg-gradient-to-br from-primary-400 to-primary-600 border-primary-400 text-white shadow-lg shadow-orange-500/40'
                        : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-600 text-neutral-400 dark:text-neutral-500'
                    }
                    ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                  `}
                >
                  {/* Pulse ring for active step */}
                  {isActive && (
                    <span className="absolute inset-0 rounded-full border-[3px] border-primary-400 animate-ping opacity-30" />
                  )}
                  <span className={`material-symbols-outlined !text-xl sm:!text-2xl ${isCompleted || isActive ? 'text-white' : ''}`}>
                    {isCompleted ? 'check' : s.icon}
                  </span>
                </button>
                <span className={`
                  absolute top-full mt-2 sm:mt-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap
                  transition-colors duration-300
                  ${isCompleted
                    ? 'text-green-500' 
                    : isActive 
                      ? 'text-primary-500' 
                      : 'text-neutral-400 dark:text-neutral-500'
                  }
                `}>
                  {s.label}
                </span>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-1 mx-2 sm:mx-4 bg-neutral-200 dark:bg-neutral-700 rounded-full relative overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: step > s.id ? '100%' : '0%',
                      background: step > s.id
                        ? 'linear-gradient(90deg, #4ade80, #10b981)'
                        : 'linear-gradient(90deg, #f97316, #ea580c)',
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default CheckoutStepper;
