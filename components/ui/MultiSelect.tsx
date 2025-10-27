import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, ChevronDown } from 'lucide-react';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  closeOnSelectCount?: number;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ options, selected, onChange, placeholder = 'Select...', closeOnSelectCount }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOptions = useMemo(() => options.filter(option => selected.includes(option.value)), [options, selected]);
  
  const filteredOptions = useMemo(() => 
    options.filter(option => 
      !selected.includes(option.value) && 
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    ), [options, selected, searchTerm]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
        setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleSelect = (value: string) => {
    const newSelected = [...selected, value];
    onChange(newSelected);
    setSearchTerm('');
    if (closeOnSelectCount && newSelected.length >= closeOnSelectCount) {
        setIsOpen(false);
    }
  };

  const handleRemove = (value: string) => {
    onChange(selected.filter(item => item !== value));
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
      <div
        onClick={handleToggle}
        className="flex flex-wrap gap-2 items-center w-full min-h-[42px] p-2 border border-gray-300 bg-white rounded-md shadow-sm cursor-text"
      >
        {selectedOptions.map(option => (
            <span key={option.value} className="flex items-center gap-1.5 bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-md">
              {option.label}
              <button onClick={(e) => { e.stopPropagation(); handleRemove(option.value); }} className="text-blue-600 hover:text-blue-800">
                <X size={14} />
              </button>
            </span>
        ))}
        {!isOpen && selectedOptions.length === 0 && <span className="text-gray-500 ml-1">{placeholder}</span>}
        <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>

      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="p-2">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full px-2 py-1 border border-gray-200 rounded-md"
            />
          </div>
          <ul className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
                filteredOptions.map(option => (
                    <li
                        key={option.value}
                        onClick={() => handleSelect(option.value)}
                        className="p-2 cursor-pointer hover:bg-blue-50"
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

export default MultiSelect;