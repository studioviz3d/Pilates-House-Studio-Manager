

import React, { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns/format';
import { endOfMonth } from 'date-fns/endOfMonth';
import { endOfWeek } from 'date-fns/endOfWeek';
import { eachDayOfInterval } from 'date-fns/eachDayOfInterval';
import { isSameMonth } from 'date-fns/isSameMonth';
import { isSameDay } from 'date-fns/isSameDay';
import { addMonths } from 'date-fns/addMonths';
import { addWeeks } from 'date-fns/addWeeks';
import { addDays } from 'date-fns/addDays';
import { getHours } from 'date-fns/getHours';
import { getMinutes } from 'date-fns/getMinutes';
import { eachHourOfInterval } from 'date-fns/eachHourOfInterval';
import { isBefore } from 'date-fns/isBefore';
import { startOfMonth } from 'date-fns/startOfMonth';
import { startOfWeek } from 'date-fns/startOfWeek';
import { subMonths } from 'date-fns/subMonths';
import { subWeeks } from 'date-fns/subWeeks';
import { subDays } from 'date-fns/subDays';
import { setHours } from 'date-fns/setHours';
import { setMinutes } from 'date-fns/setMinutes';
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useStudioData } from '../../hooks/useStudioData';
import { Booking, BookingStatus } from '../../types';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import DailyAgendaModal from './DailyAgendaModal';
import Select, { SelectOption } from '../ui/Select';

type CalendarView = 'month' | 'week' | 'day';

interface CalendarProps {
    onBookingClick: (booking: Booking) => void;
    onCellClick: (date: Date) => void;
}

const trainerColorClasses: { [key: string]: { bg: string; border: string; text: string; darkText: string; hoverBg: string; mutedBorder: string; dot: string } } = {
    purple: { bg: 'bg-purple-100', border: 'border-purple-600', text: 'text-purple-700', darkText: 'text-purple-900', hoverBg: 'hover:bg-purple-200', mutedBorder: 'border-purple-300', dot: 'bg-purple-500' },
    sky: { bg: 'bg-sky-100', border: 'border-sky-600', text: 'text-sky-700', darkText: 'text-sky-900', hoverBg: 'hover:bg-sky-200', mutedBorder: 'border-sky-300', dot: 'bg-sky-500' },
    rose: { bg: 'bg-rose-100', border: 'border-rose-600', text: 'text-rose-700', darkText: 'text-rose-900', hoverBg: 'hover:bg-rose-200', mutedBorder: 'border-rose-300', dot: 'bg-rose-500' },
    teal: { bg: 'bg-teal-100', border: 'border-teal-600', text: 'text-teal-700', darkText: 'text-teal-900', hoverBg: 'hover:bg-teal-200', mutedBorder: 'border-teal-300', dot: 'bg-teal-500' },
};
const defaultColor = { bg: 'bg-gray-100', border: 'border-gray-500', text: 'text-gray-600', darkText: 'text-gray-800', hoverBg: 'hover:bg-gray-200', mutedBorder: 'border-gray-300', dot: 'bg-gray-500' };

const StatusIcon: React.FC<{ status: BookingStatus }> = ({ status }) => {
    switch (status) {
        case BookingStatus.Completed:
            return <CheckCircle2 size={14} className="text-green-600" aria-label="Completed" />;
        case BookingStatus.CancelledLate:
            return <Clock size={14} className="text-yellow-600" aria-label="Late Cancellation" />;
        case BookingStatus.Cancelled:
            return <XCircle size={14} className="text-red-600" aria-label="Cancelled" />;
        default:
            return null;
    }
};

const Calendar: React.FC<CalendarProps> = ({ onBookingClick, onCellClick: onDesktopCellClick }) => {
    const { bookings, getTrainer, getCustomer, updateBooking, getClassType, now, trainers } = useStudioData();
    const [currentDate, setCurrentDate] = useState(now);
    const [view, setView] = useState<CalendarView>('week');
    const [draggedBooking, setDraggedBooking] = useState<Booking | null>(null);
    const [statusUpdateInfo, setStatusUpdateInfo] = useState<{ booking: Booking, newDate: Date } | null>(null);
    const [trainerFilter, setTrainerFilter] = useState<string>('all');
    
    // State for mobile agenda view
    const [isAgendaOpen, setIsAgendaOpen] = useState(false);
    const [selectedDateForAgenda, setSelectedDateForAgenda] = useState<Date | null>(null);
    
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const checkSize = () => {
            setIsMobileView(window.innerWidth < 1024); // Tailwind's 'lg' breakpoint
        };
        window.addEventListener('resize', checkSize);
        return () => window.removeEventListener('resize', checkSize);
    }, []);

    const isToday = (date: Date) => isSameDay(date, now);
    
    const filteredBookings = useMemo(() => {
        if (trainerFilter === 'all') {
            return bookings;
        }
        return bookings.filter(b => b.trainerId === trainerFilter);
    }, [bookings, trainerFilter]);
    
    const trainerOptions: SelectOption[] = useMemo(() => ([
        { value: 'all', label: 'All Trainers' },
        ...trainers.map(t => ({ value: t.id, label: `${t.firstName} ${t.lastName}` }))
    ]), [trainers]);


    const handleGridCellClick = (date: Date) => {
        if (isMobileView) {
            setSelectedDateForAgenda(date);
            setIsAgendaOpen(true);
        } else {
            onDesktopCellClick(date);
        }
    };

    const handleNext = () => {
        if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
        else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
        else setCurrentDate(addDays(currentDate, 1));
    };

    const handlePrev = () => {
        if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
        else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
        else setCurrentDate(subDays(currentDate, 1));
    };
    
    const handleSetToday = () => {
        setCurrentDate(now);
    };

    const handleBookingClick = (booking: Booking) => {
        onBookingClick(booking);
    };

    // --- Drag and Drop Logic ---
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, booking: Booking) => {
        e.dataTransfer.effectAllowed = 'move';
        setDraggedBooking(booking);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, date: Date, hour?: number) => {
        e.preventDefault();
        if (!draggedBooking) return;

        let newDateTime = date;
        if(hour !== undefined) {
            newDateTime = setMinutes(setHours(date, hour), 0);
        } else {
             newDateTime = setMinutes(setHours(date, getHours(new Date(draggedBooking.dateTime))), getMinutes(new Date(draggedBooking.dateTime)));
        }

        const isPastDrop = isBefore(newDateTime, new Date());
        const isFutureOrPresentDrop = !isPastDrop;
        
        const isFinalStatus = [
            BookingStatus.Completed, 
            BookingStatus.Cancelled, 
            BookingStatus.CancelledLate
        ].includes(draggedBooking.status);

        if (isFutureOrPresentDrop && isFinalStatus) {
            updateBooking(draggedBooking.id, { dateTime: newDateTime, status: BookingStatus.Booked });
        } else if (isPastDrop) {
            setStatusUpdateInfo({ booking: draggedBooking, newDate: newDateTime });
        } else {
            updateBooking(draggedBooking.id, { dateTime: newDateTime });
        }
        
        setDraggedBooking(null);
    };
    
    const closeModal = () => {
        setStatusUpdateInfo(null);
    }

    const handleStatusUpdate = (status: BookingStatus) => {
        if (statusUpdateInfo) {
            updateBooking(statusUpdateInfo.booking.id, {
                dateTime: statusUpdateInfo.newDate,
                status: status
            });
        }
        closeModal();
    };

    const renderHeader = () => (
        <div className="p-4 border-b space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-2">
                    <button onClick={handlePrev} className="p-1.5 rounded-md hover:bg-gray-100">
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <button onClick={handleNext} className="p-1.5 rounded-md hover:bg-gray-100">
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                    <button onClick={handleSetToday} className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-300 rounded-md shadow-sm text-gray-700 hover:bg-gray-50">
                        Today
                    </button>
                </div>
                <h2 className="text-xl font-bold text-gray-800 text-center order-first sm:order-none">
                    {view === 'day' ? format(currentDate, 'EEEE, dd MMMM yyyy') : format(currentDate, 'MMMM yyyy')}
                </h2>
                <div className="flex items-center justify-center gap-4">
                    <div className="bg-gray-100 rounded-lg p-1 flex items-center">
                        {(['month', 'week', 'day'] as CalendarView[]).map(v => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                className={`px-3 py-1.5 text-sm rounded-lg capitalize transition-colors duration-200 ease-in-out focus:outline-none ${view === v ? 'bg-white text-gray-800 font-semibold shadow-sm' : 'text-gray-500 font-medium hover:bg-gray-200/60'}`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="w-full sm:w-48 sm:ml-auto">
                <Select
                    options={trainerOptions}
                    value={trainerFilter}
                    onChange={setTrainerFilter}
                    labelPrefix="Filter by:"
                />
            </div>
        </div>
    );
    
    const renderEvent = (booking: Booking) => {
        const customers = booking.customerIds
            .map(id => {
                const customer = getCustomer(id);
                return customer ? `${customer.firstName} ${customer.lastName.charAt(0)}.` : 'Unknown';
            })
            .join(', ');

        const trainer = getTrainer(booking.trainerId);
        const color = trainer ? trainerColorClasses[trainer.color] || defaultColor : defaultColor;
        const isPastOrCompleted = booking.status !== BookingStatus.Booked;

        const bgClass = isPastOrCompleted ? 'bg-gray-50' : color.bg;
        const textClass = isPastOrCompleted ? 'text-gray-500' : color.text;
        const darkTextClass = isPastOrCompleted ? 'text-gray-700 font-medium' : `font-bold ${color.darkText}`;
        const hoverBgClass = isPastOrCompleted ? 'hover:bg-gray-100' : color.hoverBg;
        const borderClass = isPastOrCompleted ? `border-l-4 ${color.mutedBorder}` : 'border-l-0';
        
        return (
            <div
                key={booking.id}
                draggable
                onDragStart={(e) => handleDragStart(e, booking)}
                onClick={(e) => { e.stopPropagation(); handleBookingClick(booking); }}
                className={`relative p-2 rounded text-xs shadow-sm cursor-pointer ${borderClass} ${bgClass} ${hoverBgClass}`}
            >
                <p className={`truncate ${darkTextClass}`}>{customers}</p>
                <p className={`text-[10px] truncate ${textClass}`}>{format(new Date(booking.dateTime), 'HH:mm')}</p>
                {booking.status !== BookingStatus.Booked && (
                    <span className="absolute bottom-1 right-1">
                        <StatusIcon status={booking.status} />
                    </span>
                )}
            </div>
        );
    };

    const renderMonthView = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase">{day}</div>
        ));

        return (
            <div className="flex-1 overflow-auto">
                 <div className="grid grid-cols-7 sticky top-0 bg-white z-10 border-b">
                    {dayHeaders}
                </div>
                <div className="grid grid-cols-7 grid-rows-6 h-full">
                    {days.map(day => {
                        const bookingsForDay = filteredBookings.filter(b => isSameDay(new Date(b.dateTime), day) && b.status !== BookingStatus.Deleted);
                        return (
                            <div
                                key={day.toString()}
                                className={`relative border-r border-b p-2 group cursor-pointer ${!isSameMonth(day, monthStart) ? 'bg-gray-50' : 'bg-white'}`}
                                onClick={() => handleGridCellClick(day)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, day)}
                            >
                                <span className={`absolute top-1 right-1 flex items-center justify-center h-6 w-6 text-sm rounded-full ${isToday(day) ? 'bg-blue-600 text-white' : ''} ${!isSameMonth(day, monthStart) ? 'text-gray-400' : 'text-gray-700'}`}>
                                    {format(day, 'd')}
                                </span>
                                {/* DESKTOP VIEW */}
                                <div className="hidden lg:block mt-8 space-y-1 overflow-y-hidden group-hover:overflow-y-auto max-h-[100px]">
                                    {bookingsForDay.map(booking => renderEvent(booking))}
                                </div>
                                {/* MOBILE VIEW */}
                                <div className="lg:hidden flex flex-wrap justify-start items-center gap-1 mt-1">
                                    {bookingsForDay.slice(0, 4).map(booking => {
                                        const trainer = getTrainer(booking.trainerId);
                                        const color = trainer ? trainerColorClasses[trainer.color] || defaultColor : defaultColor;
                                        return <div key={booking.id} className={`w-2 h-2 rounded-full ${color.dot}`}></div>
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderTimeGridView = (viewType: 'week' | 'day') => {
        const weekStart = startOfWeek(currentDate);
        const daysInView = viewType === 'week' ? eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart) }) : [currentDate];
        const hours = eachHourOfInterval({ start: setHours(new Date(), 8), end: setHours(new Date(), 20) });
        
        const getBookingsForSlot = (day: Date, hour: Date) => {
            return filteredBookings.filter(b => 
                isSameDay(new Date(b.dateTime), day) && 
                new Date(b.dateTime).getHours() === hour.getHours() &&
                b.status !== BookingStatus.Deleted
            );
        };
        
        const totalMinutesFrom8AM = (now.getHours() - 8) * 60 + now.getMinutes();
        const timeIndicatorTop = (totalMinutesFrom8AM / 60) * 64; // 64px = h-16

        return (
            <div className="flex-1 overflow-auto">
                <div className="grid grid-cols-[auto_1fr] h-full">
                    {/* Time Column */}
                    <div className="sticky left-0 bg-white z-20">
                        <div className="h-10 border-b"></div> {/* Spacer for day headers */}
                        {hours.map(hour => (
                             <div key={hour.toString()} className="h-16 flex justify-end items-start border-r border-b relative pr-2">
                                <span className="text-xs text-gray-500 relative -top-2 bg-white px-1">{format(hour, 'HH:mm')}</span>
                            </div>
                        ))}
                    </div>
                    {/* Day Columns */}
                    <div className={`grid grid-cols-${viewType === 'week' ? 7 : 1} min-w-max`}>
                         {daysInView.map(day => (
                            <div key={day.toString()} className="border-r relative">
                                <div className="h-10 border-b text-center sticky top-0 bg-white z-10">
                                    <p className="text-xs font-semibold text-gray-500 uppercase">{format(day, 'EEE')}</p>
                                    <p className={`text-lg font-bold ${isToday(day) ? 'text-blue-600' : 'text-gray-800'}`}>{format(day, 'd')}</p>
                                </div>
                                {isToday(day) && timeIndicatorTop > 0 && (
                                    <div className="absolute w-full z-10" style={{ top: `${timeIndicatorTop}px`}}>
                                        <div className="relative h-px bg-red-500">
                                            <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
                                        </div>
                                    </div>
                                )}
                                {hours.map(hour => (
                                    <div 
                                        key={hour.toString()} 
                                        className="h-16 border-b relative cursor-pointer"
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, day, hour.getHours())}
                                        onClick={() => handleGridCellClick(setHours(day, hour.getHours()))}
                                    >
                                        {/* DESKTOP VIEW */}
                                        <div className="hidden lg:block h-full">
                                            {getBookingsForSlot(day, hour).map((booking, index, arr) => {
                                                const customers = booking.customerIds
                                                    .map(id => {
                                                        const customer = getCustomer(id);
                                                        return customer ? `${customer.firstName} ${customer.lastName.charAt(0)}.` : 'Unknown';
                                                    })
                                                    .join(', ');
                                                
                                                const width = `calc(${100 / arr.length}% - 4px)`;
                                                const left = `calc(${index * (100 / arr.length)}% + 2px)`;

                                                const trainer = getTrainer(booking.trainerId);
                                                const color = trainer ? trainerColorClasses[trainer.color] || defaultColor : defaultColor;
                                                const isPastOrCompleted = booking.status !== BookingStatus.Booked;
                                                const classType = getClassType(booking.classTypeId);

                                                const bgClass = isPastOrCompleted ? 'bg-gray-50' : color.bg;
                                                const textClass = isPastOrCompleted ? 'text-gray-500' : color.text;
                                                const darkTextClass = isPastOrCompleted ? 'text-gray-700 font-medium' : `font-bold ${color.darkText}`;
                                                const hoverBgClass = isPastOrCompleted ? 'hover:bg-gray-100' : color.hoverBg;
                                                const borderClass = isPastOrCompleted ? `border-l-4 ${color.mutedBorder}` : 'border-l-0';

                                                return (
                                                    <div
                                                        key={booking.id}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, booking)}
                                                        onClick={(e) => { e.stopPropagation(); handleBookingClick(booking); }}
                                                        className={`absolute p-2 rounded-md text-xs shadow cursor-pointer overflow-hidden ${borderClass} ${bgClass} ${draggedBooking?.id === booking.id ? 'opacity-50' : hoverBgClass}`}
                                                        style={{ width, left, top: '2px', height: 'calc(100% - 4px)'}}
                                                    >
                                                        <p className={`truncate ${darkTextClass}`}>{customers}</p>
                                                        <p className={`truncate ${textClass}`}>{format(new Date(booking.dateTime), 'HH:mm')} - {trainer?.firstName}</p>
                                                        <p className={`absolute bottom-1.5 left-2 font-bold ${darkTextClass}`}>
                                                            {classType?.abbreviation}
                                                        </p>
                                                        {booking.status !== BookingStatus.Booked && (
                                                            <span className="absolute bottom-1.5 right-1.5">
                                                                <StatusIcon status={booking.status} />
                                                            </span>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                         {/* MOBILE VIEW */}
                                         <div className="lg:hidden flex items-center justify-center h-full">
                                            {getBookingsForSlot(day, hour).length > 0 && (
                                                 <div className={`w-2 h-2 rounded-full ${trainerColorClasses[getTrainer(getBookingsForSlot(day, hour)[0].trainerId)?.color || '']?.dot || 'bg-gray-400'}`}></div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Card className="!p-0 overflow-hidden h-[85vh] flex flex-col">
            {renderHeader()}
            {view === 'month' && renderMonthView()}
            {view === 'week' && renderTimeGridView('week')}
            {view === 'day' && renderTimeGridView('day')}

            {/* Modals */}
             <DailyAgendaModal 
                isOpen={isAgendaOpen}
                onClose={() => setIsAgendaOpen(false)}
                selectedDate={selectedDateForAgenda}
                onEditBooking={onBookingClick}
            />
            {statusUpdateInfo && (
                <Modal isOpen={true} onClose={closeModal} title="Update Booking Status">
                    <div className="text-center">
                        <p className="text-sm text-gray-600 mb-4">You moved this booking to a past date. Please select its final status.</p>
                        <div className="flex justify-center space-x-2">
                             <button onClick={() => handleStatusUpdate(BookingStatus.Completed)} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Completed</button>
                             <button onClick={() => handleStatusUpdate(BookingStatus.CancelledLate)} className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 rounded-md hover:bg-yellow-600">Cancelled - Late</button>
                             <button onClick={() => handleStatusUpdate(BookingStatus.Cancelled)} className="px-4 py-2 text-sm font-medium text-white bg-gray-500 rounded-md hover:bg-gray-600">Cancelled</button>
                        </div>
                    </div>
                </Modal>
            )}
        </Card>
    );
};

export default Calendar;