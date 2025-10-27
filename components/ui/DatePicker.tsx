

import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns/format';
import { endOfMonth } from 'date-fns/endOfMonth';
import { endOfWeek } from 'date-fns/endOfWeek';
import { eachDayOfInterval } from 'date-fns/eachDayOfInterval';
import { isSameMonth } from 'date-fns/isSameMonth';
import { isSameDay } from 'date-fns/isSameDay';
import { addMonths } from 'date-fns/addMonths';
import { subMonths } from 'date-fns/subMonths';
import { startOfMonth } from 'date-fns/startOfMonth';
import { startOfWeek } from 'date-fns/startOfWeek';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface DatePickerProps {
    selected: Date | null;
    onChange: (date: Date) => void;
    disabled?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({ selected, onChange, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(selected || new Date());
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (selected) {
            setCurrentMonth(selected);
        }
    }, [selected]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDateClick = (day: Date) => {
        onChange(day);
        setIsOpen(false);
    };

    const monthStart = startOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(endOfMonth(monthStart)) });

    return (
        <div className="relative w-full" ref={pickerRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
                <span className="flex items-center">
                    <CalendarIcon className="mr-2 h-5 w-5 text-gray-400" />
                    <span className="block truncate">{selected ? format(selected, 'dd MMMM, yyyy') : 'Select a date'}</span>
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                </span>
            </button>
            {isOpen && (
                <div className="absolute z-20 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="p-3">
                        <div className="flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                className="-my-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <div className="text-sm font-semibold">{format(currentMonth, 'MMMM yyyy')}</div>
                            <button
                                type="button"
                                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                className="-my-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="mt-4 grid grid-cols-7 text-center text-xs leading-6 text-gray-500">
                            <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
                        </div>
                        <div className="mt-2 grid grid-cols-7 text-sm">
                            {days.map((day) => {
                                const isSelected = selected && isSameDay(day, selected);
                                return (
                                    <div key={day.toString()} className="py-1">
                                        <button
                                            type="button"
                                            onClick={() => handleDateClick(day)}
                                            className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full transition-colors
                                                ${!isSameMonth(day, currentMonth) ? 'text-gray-400' : ''}
                                                ${isSelected ? 'bg-blue-600 text-white font-semibold' : ''}
                                                ${!isSelected ? 'hover:bg-gray-200' : ''}
                                            `}
                                        >
                                            <time dateTime={format(day, 'yyyy-MM-dd')}>{format(day, 'd')}</time>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};