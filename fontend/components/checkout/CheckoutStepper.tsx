import React from 'react';

interface CheckoutStepperProps {
  step: number;
  onStepClick?: (step: number) => void;
}

const CheckoutStepper: React.FC<CheckoutStepperProps> = ({ step, onStepClick }) => {
  const steps = [
    { id: 1, label: 'Cart' },
    { id: 2, label: 'Info' },
    { id: 3, label: 'Done' }
  ];

  return (
    <div className="mb-12 max-w-2xl mx-auto px-2">
      <div className="flex items-center justify-between w-full relative">
        
        {/* Step 1 */}
        <div className="flex flex-col items-center relative z-10">
          <button 
            onClick={() => onStepClick && step > 1 && onStepClick(1)}
            disabled={step === 1}
            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 border-[3px] ${
              step >= 1 
                ? 'bg-primary border-primary text-white shadow-lg shadow-orange-500/30' 
                : 'bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700 text-stone-400'
            } ${step > 1 ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`}
          >
            {step > 1 ? <span className="material-symbols-outlined !text-xl font-bold">check</span> : '1'}
          </button>
          <span className={`absolute top-full mt-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap ${step >= 1 ? 'text-primary' : 'text-stone-400'}`}>
            Cart
          </span>
        </div>

        {/* Line 1-2 */}
        <div className="flex-1 h-1 mx-4 bg-stone-200 dark:bg-stone-700 rounded-full relative overflow-hidden">
          <div 
              className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: step >= 2 ? '100%' : '0%' }}
          />
        </div>

        {/* Step 2 */}
        <div className="flex flex-col items-center relative z-10">
          <div 
            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 border-[3px] ${
              step >= 2 
                ? 'bg-primary border-primary text-white shadow-lg shadow-orange-500/30' 
                : 'bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700 text-stone-400'
            }`}
          >
            {step > 2 ? <span className="material-symbols-outlined !text-xl font-bold">check</span> : '2'}
          </div>
          <span className={`absolute top-full mt-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap ${step >= 2 ? 'text-primary' : 'text-stone-400'}`}>
            Info
          </span>
        </div>

        {/* Line 2-3 */}
        <div className="flex-1 h-1 mx-4 bg-stone-200 dark:bg-stone-700 rounded-full relative overflow-hidden">
            <div 
              className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: step >= 3 ? '100%' : '0%' }}
          />
        </div>

        {/* Step 3 */}
        <div className="flex flex-col items-center relative z-10">
          <div 
            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 border-[3px] ${
              step >= 3 
                ? 'bg-primary border-primary text-white shadow-lg shadow-orange-500/30' 
                : 'bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700 text-stone-400'
            }`}
          >
            {step > 3 ? <span className="material-symbols-outlined !text-xl font-bold">check</span> : '3'}
          </div>
          <span className={`absolute top-full mt-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap ${step >= 3 ? 'text-primary' : 'text-stone-400'}`}>
            Done
          </span>
        </div>

      </div>
    </div>
  );
};

export default CheckoutStepper;