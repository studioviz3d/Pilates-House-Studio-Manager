

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Clock } from 'lucide-react';
import { format } from 'date-fns/format';
import { setMinutes } from 'date-fns/setMinutes';
import { startOfDay } from 'date-fns/startOfDay';

interface TimePickerProps {
    value: string; // "HH:mm"
    onChange: (value: string) => void;
    disabled?: boolean;
}

const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const timeOptions = useMemo(() => {
        const times = [];
        let date = startOfDay(new Date());
        for (let i = 0; i < 24 * 4; i++) { // 4 increments per hour
            times.push(format(date, 'HH:mm'));
            date = setMinutes(date, date.getMinutes() + 15);
        }
        return times;
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Scroll to selected time when opening
    useEffect(() => {
        if (isOpen && listRef.current) {
            const selectedElement = listRef.current.querySelector(`[data-time="${value}"]`);
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [isOpen, value]);

    const handleSelect = (time: string) => {
        onChange(time);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full" ref={pickerRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
                <span className="flex items-center">
                    <span className="block truncate">{value || '--:--'}</span>
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <Clock className="h-5 w-5 text-gray-400" />
                </span>
            </button>

            {isOpen && (
                <div className="absolute z-20 mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                    <ul ref={listRef} className="max-h-60 overflow-y-auto py-1">
                        {timeOptions.map(time => (
                            <li
                                key={time}
                                data-time={time}
                                onClick={() => handleSelect(time)}
                                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 text-sm hover:bg-blue-50 ${value === time ? 'font-semibold bg-blue-50' : 'text-gray-900'}`}
                            >
                                {time}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default TimePicker;