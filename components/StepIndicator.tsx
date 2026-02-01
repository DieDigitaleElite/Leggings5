
import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const steps = ['Set wählen', 'Foto hochladen', 'Ergebnis'];

  return (
    <div className="flex items-center justify-center w-full max-w-2xl mx-auto mb-10 px-4">
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center">
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${
                index + 1 <= currentStep 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {index + 1}
            </div>
            <span className={`text-[10px] sm:text-xs mt-2 font-medium uppercase tracking-wider ${
              index + 1 <= currentStep ? 'text-indigo-600' : 'text-gray-400'
            }`}>
              {step}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`h-1 flex-1 mx-2 sm:mx-4 rounded ${
              index + 1 < currentStep ? 'bg-indigo-600' : 'bg-gray-200'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default StepIndicator;
