

import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns/format';
import { endOfMonth } from 'date-fns/endOfMonth';
import { endOfWeek } from 'date-fns/endOfWeek';
import { eachDayOfInterval } from 'date-fns/eachDayOfInterval';
import { isSameMonth } from 'date-fns/isSameMonth';
import { isSameDay } from 'date-fns/isSameDay';
import { addMonths } from 'date-fns/addMonths';
import { isWithinInterval } from 'date-fns/isWithinInterval';
import { isAfter } from 'date-fns/isAfter';
import { startOfMonth } from 'date-fns/startOfMonth';
import { startOfWeek } from 'date-fns/startOfWeek';
import { startOfDay } from 'date-fns/startOfDay';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateRangePickerProps {
    range: { from: Date; to: Date };
    onRangeChange: (range: { from: Date; to: Date }) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ range, onRangeChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(range.from || new Date());
    const [selecting, setSelecting] = useState<'from' | 'to'>('from');
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    useEffect(() => {
        if (isOpen) {
            setSelecting('from');
        }
    }, [isOpen]);

    const handleDateClick = (day: Date) => {
        const dayStart = startOfDay(day);
        if (selecting === 'from') {
            onRangeChange({ from: dayStart, to: dayStart });
            setSelecting('to');
        } else { // selecting 'to'
            let newRange = { from: range.from, to: dayStart };
            if (isAfter(newRange.from, newRange.to)) {
                newRange = { from: newRange.to, to: newRange.from };
            }
            onRangeChange(newRange);
            setIsOpen(false);
        }
    };

    const monthStart = startOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(endOfMonth(monthStart)) });

    return (
        <div className="relative" ref={pickerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
                <CalendarIcon className="mr-2 h-5 w-5 text-gray-400" />
                <span>
                    {`${format(range.from, 'MMM d, yyyy')} - ${format(range.to, 'MMM d, yyyy')}`}
                </span>
            </button>
            {isOpen && (
                <div className="absolute right-0 z-20 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="p-3">
                        <div className="flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
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
                                const isSelected = isWithinInterval(day, { start: range.from, end: range.to });
                                const isStart = isSameDay(day, range.from);
                                const isEnd = isSameDay(day, range.to);
                                
                                return (
                                    <div key={day.toString()} className={`py-1.5 
                                        ${isStart && isEnd ? '' : ''}
                                        ${isStart && !isEnd ? 'bg-blue-100 rounded-l-full' : ''}
                                        ${isEnd && !isStart ? 'bg-blue-100 rounded-r-full' : ''}
                                        ${isSelected && !isStart && !isEnd ? 'bg-blue-100' : ''}
                                    `}>
                                        <button
                                            type="button"
                                            onClick={() => handleDateClick(day)}
                                            className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full transition-colors
                                                ${!isSameMonth(day, currentMonth) ? 'text-gray-400' : ''}
                                                ${(isStart || isEnd) ? 'bg-blue-600 text-white font-semibold' : ''}
                                                ${!(isStart || isEnd) && isSelected ? 'text-blue-900' : ''}
                                                ${!(isStart || isEnd) && !isSelected ? 'hover:bg-gray-200' : ''}
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

export default DateRangePicker;