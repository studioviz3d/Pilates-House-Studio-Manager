

import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStudioData } from '../../hooks/useStudioData';
import Card from '../components/ui/Card';
import BookingModal from '../components/BookingModal';
import { Booking, BookingStatus } from '../types';
// FIX: Consolidated `date-fns` imports.
import { format } from 'date-fns/format';
import { endOfWeek } from 'date-fns/endOfWeek';
import { eachDayOfInterval } from 'date-fns/eachDayOfInterval';
import { eachHourOfInterval } from 'date-fns/eachHourOfInterval';
import { addWeeks } from 'date-fns/addWeeks';
import { isSameDay } from 'date-fns/isSameDay';
import { isBefore } from 'date-fns/isBefore';
import { startOfWeek } from 'date-fns/startOfWeek';
import { setHours } from 'date-fns/setHours';
import { subWeeks } from 'date-fns/subWeeks';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';

const trainerColorClasses: { [key: string]: { bg: string; border: string; text: string; darkText: string; hoverBg: string; mutedBorder: string; dot: string } } = {
    purple: { bg: 'bg-purple-100', border: 'border-purple-600', text: 'text-purple-700', darkText: 'text-purple-900', hoverBg: 'hover:bg-purple-200', mutedBorder: 'border-purple-300', dot: 'bg-purple-500' },
    sky: { bg: 'bg-sky-100', border: 'border-sky-600', text: 'text-sky-700', darkText: 'text-sky-900', hoverBg: 'hover:bg-sky-200', mutedBorder: 'border-sky-300', dot: 'bg-sky-500' },
    rose: { bg: 'bg-rose-100', border: 'border-rose-600', text: 'text-rose-700', darkText: 'text-rose-900', hoverBg: 'hover:bg-rose-200', mutedBorder: 'border-rose-300', dot: 'bg-rose-500' },
    teal: { bg: 'bg-teal-100', border: 'border-teal-600', text: 'text-teal-700', darkText: 'text-teal-900', hoverBg: 'hover:bg-teal-200', mutedBorder: 'border-teal-300', dot: 'bg-teal-500' },
};
const defaultColor = { bg: 'bg-gray-100', border: 'border-gray-500', text: 'text-gray-600', darkText: 'text-gray-800', hoverBg: 'hover:bg-gray-200', mutedBorder: 'border-gray-300', dot: 'bg-gray-500' };


const TrainerSchedulePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { getTrainer, bookings, getCustomer, getClassType, now } = useStudioData();

    const [currentDate, setCurrentDate] = useState(now);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);

    const trainer = useMemo(() => getTrainer(id), [getTrainer, id]);

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const daysInView = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const hoursInView = eachHourOfInterval({ start: setHours(now, 7), end: setHours(now, 20) });

    const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
    const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));

    const handleOpenBookingModalForNew = (date: Date) => {
        setSelectedBooking(null);
        setSelectedDateTime(date);
        setIsBookingModalOpen(true);
    };

    const handleOpenBookingModalForEdit = (booking: Booking) => {
        setSelectedBooking(booking);
        setSelectedDateTime(null);
        setIsBookingModalOpen(true);
    };

    const parseTime = (timeStr: string) => parseInt(timeStr.split(':')[0], 10);

    if (!trainer) {
        return <div>Trainer not found.</div>;
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Link to="/trainers" className="p-2 rounded-md hover:bg-gray-100">
                           <ArrowLeft className="text-gray-600" />
                        </Link>
                         <img src={trainer.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                        <div>
                            <h2 className="text-3xl font-bold text-gray-800">{trainer.firstName} {trainer.lastName}'s Schedule</h2>
                             <p className="text-md text-gray-500">Weekly Availability & Bookings</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 rounded-md border border-gray-300 bg-white p-1 shadow-sm">
                        <button onClick={handlePrevWeek} className="p-1.5 rounded-md hover:bg-gray-100">
                            <ChevronLeft size={18} className="text-gray-600"/>
                        </button>
                        <h3 className="text-sm font-semibold text-gray-700 text-center mx-2 whitespace-nowrap">
                           {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')}
                        </h3>
                        <button onClick={handleNextWeek} className="p-1.5 rounded-md hover:bg-gray-100">
                            <ChevronRight size={18} className="text-gray-600"/>
                        </button>
                    </div>
                </div>

                <Card className="!p-0 overflow-hidden">
                    <div className="flex-1 overflow-auto">
                        <div className="grid grid-cols-[auto_1fr] h-full">
                            {/* Time Column */}
                            <div className="bg-white">
                                <div className="h-16 border-b"></div> {/* Spacer */}
                                {hoursInView.map(hour => (
                                    <div key={hour.toString()} className="h-16 flex justify-end items-start border-r border-b relative pr-2">
                                        <span className="text-xs text-gray-500 relative -top-2 bg-white px-1">{format(hour, 'HH:mm')}</span>
                                    </div>
                                ))}
                            </div>
                            {/* Day Columns */}
                            <div className="grid grid-cols-7 min-w-max">
                                {daysInView.map(day => {
                                    const dayName = format(day, 'EEEE');
                                    const availabilitySlots = trainer.availability?.[dayName] || [];
                                    const bookingsForDay = bookings.filter(b => b.trainerId === trainer.id && isSameDay(new Date(b.dateTime), day) && b.status !== BookingStatus.Deleted);
                                    
                                    return (
                                        <div key={day.toString()} className="border-r relative">
                                            <div className="h-16 border-b text-center sticky top-0 bg-white z-10 p-2">
                                                <p className="text-sm font-semibold text-gray-600 uppercase">{format(day, 'EEE')}</p>
                                                <p className={`text-2xl font-bold ${isSameDay(day, now) ? 'text-blue-600' : 'text-gray-800'}`}>{format(day, 'd')}</p>
                                            </div>
                                            {hoursInView.map(hour => {
                                                const currentHour = hour.getHours();
                                                const isAvailable = availabilitySlots.some(slot => currentHour >= parseTime(slot.start) && currentHour < parseTime(slot.end));
                                                
                                                const bookingsInSlot = bookingsForDay.filter(b => new Date(b.dateTime).getHours() === currentHour);

                                                return (
                                                    <div
                                                        key={hour.toString()}
                                                        onClick={() => isAvailable && handleOpenBookingModalForNew(setHours(day, currentHour))}
                                                        className={`h-16 border-b relative ${isAvailable ? 'bg-green-50 cursor-pointer hover:bg-green-100' : 'bg-gray-50'}`}
                                                    >
                                                        {bookingsInSlot.map(booking => {
                                                            const customers = booking.customerIds.map(id => getCustomer(id)).filter(Boolean);
                                                            const classType = getClassType(booking.classTypeId);
                                                            
                                                            const color = trainer ? trainerColorClasses[trainer.color] || defaultColor : defaultColor;
                                                            const isPastOrCompleted = isBefore(new Date(booking.dateTime), now) || booking.status !== BookingStatus.Booked;

                                                            const bgClass = isPastOrCompleted ? 'bg-gray-100' : color.bg;
                                                            const textClass = isPastOrCompleted ? 'text-gray-500' : color.text;
                                                            const darkTextClass = isPastOrCompleted ? 'text-gray-700 font-medium' : `font-bold ${color.darkText}`;
                                                            const hoverBgClass = isPastOrCompleted ? 'hover:bg-gray-200' : color.hoverBg;
                                                            const borderClass = isPastOrCompleted ? `border-l-4 ${color.mutedBorder}` : 'border-l-0';

                                                            return (
                                                                <div
                                                                    key={booking.id}
                                                                    onClick={(e) => { e.stopPropagation(); handleOpenBookingModalForEdit(booking); }}
                                                                    className={`absolute w-full h-full p-2 rounded-md text-xs shadow cursor-pointer overflow-hidden ${borderClass} ${bgClass} ${hoverBgClass}`}
                                                                >
                                                                    <p className={`truncate ${darkTextClass}`}>{customers.map(c => c.firstName).join(', ')}</p>
                                                                    <p className={`truncate ${textClass}`}>{classType?.name}</p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            <BookingModal
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
                booking={selectedBooking}
                selectedDateTime={selectedDateTime}
            />
        </>
    );
};

export default TrainerSchedulePage;