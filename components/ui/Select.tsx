import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  labelPrefix?: string;
}

const Select: React.FC<SelectProps> = ({ options, value, onChange, placeholder = 'Select an option', disabled = false, searchable = false, labelPrefix }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(() => options.find(option => option.value === value), [options, value]);

  const filteredOptions = useMemo(() =>
    options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    ), [options, searchTerm]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen && searchable) {
        setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleSelect = (newValue: string) => {
    onChange(newValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={selectRef}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <span className="flex items-center truncate">
            {labelPrefix && <span className="text-gray-500 mr-2">{labelPrefix}</span>}
            <span className={`truncate ${selectedOption ? 'text-gray-800' : 'text-gray-500'}`}>
                {selectedOption ? selectedOption.label : placeholder}
            </span>
        </span>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronDown className="h-5 w-5 text-gray-400" />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {searchable && (
            <div className="p-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>
          )}
          <ul className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
                filteredOptions.map(option => (
                    <li
                        key={option.value}
                        onClick={() => handleSelect(option.value)}
                        className={`p-2 cursor-pointer hover:bg-blue-50 text-sm ${option.value === value ? 'font-semibold bg-blue-50' : ''}`}
                    >
                        {option.label}
                    </li>
                ))
            ) : (
                <li className="p-2 text-gray-500 text-sm">No options found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Select;