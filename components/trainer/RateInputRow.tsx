import React from 'react';
import { ClassType } from '../../types';

interface RateInputRowProps {
  classType: ClassType;
  rate: number;
  onRateChange: (classTypeId: string, rate: number) => void;
}

const inputBaseClasses = "w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm";


const RateInputRow: React.FC<RateInputRowProps> = ({ classType, rate, onRateChange }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value === '' ? 0 : parseFloat(value);
    if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 100) {
      onRateChange(classType.id, numericValue / 100);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <label htmlFor={`rate-${classType.id}`} className="w-24 text-sm font-medium text-gray-700">
        {classType.name}
      </label>
      <div className="relative flex-grow rounded-md shadow-sm">
        <input
          type="number"
          id={`rate-${classType.id}`}
          value={isNaN(rate) ? '' : (rate * 100).toFixed(0)}
          onChange={handleInputChange}
          className={`${inputBaseClasses} pr-12 text-right`}
          min="0"
          max="100"
          step="1"
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <span className="text-gray-500 sm:text-sm">%</span>
        </div>
      </div>
    </div>
  );
};

export default RateInputRow;