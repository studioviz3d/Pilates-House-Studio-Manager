import React, { useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import { Booking, BookingStatus } from '../../types';
import { useStudioData } from '../../hooks/useStudioData';
import { format, isSameDay } from 'date-fns';
import { Link } from 'react-router-dom';
import BookingModal from '../BookingModal';
import { Plus, Edit } from 'lucide-react';
import { formatDateTime } from '../../utils';

interface DailyAgendaModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: Date | null;
    onEditBooking: (booking: Booking) => void;
}

const statusColors: Record<BookingStatus, string> = {
    [BookingStatus.Booked]: 'bg-blue-100 text-blue-700',
    [BookingStatus.Completed]: 'bg-green-100 text-green-700',
    [BookingStatus.Cancelled]: 'bg-gray-100 text-gray-700',
    [BookingStatus.CancelledLate]: 'bg-yellow-100 text-yellow-700',
    [BookingStatus.Deleted]: 'bg-red-100 text-red-700',
};

const DailyAgendaModal: React.FC<DailyAgendaModalProps> = ({ isOpen, onClose, selectedDate, onEditBooking }) => {
    const { bookings, getTrainer, getCustomer, getClassType } = useStudioData();
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

    const bookingsForDay = useMemo(() => {
        if (!selectedDate) return [];
        return bookings
            .filter(b => isSameDay(new Date(b.dateTime), selectedDate) && b.status !== BookingStatus.Deleted)
            .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    }, [bookings, selectedDate]);
    
    const handleAddNew = () => {
        // This will open the booking modal with the correct date pre-selected
        onEditBooking({} as Booking); // A bit of a hack, the DashboardPage will handle it
    };

    if (!selectedDate) return null;

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={`Agenda for ${format(selectedDate, 'EEEE, MMM dd')}`}
            >
                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                    {bookingsForDay.length > 0 ? (
                        bookingsForDay.map(booking => {
                            const trainer = getTrainer(booking.trainerId);
                            const classType = getClassType(booking.classTypeId);
                            const customers = booking.customerIds.map(id => getCustomer(id)).filter(Boolean);

                            return (
                                <div key={booking.id} className="p-3 rounded-lg bg-gray-50 border flex items-start justify-between">
                                    <div>
                                        <p className="font-bold text-gray-800">{format(new Date(booking.dateTime), 'HH:mm')}</p>
                                        <p className="font-semibold">{classType?.name} w/ {trainer?.firstName}</p>
                                        <div className="text-sm text-gray-600">
                                            {customers.map(c => (
                                                <Link key={c.id} to={`/customers/${c.id}`} className="hover:text-blue-600 block truncate">
                                                    {c.firstName} {c.lastName}
                                                </Link>
                                            ))}
                                        </div>
                                        <span className={`mt-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[booking.status]}`}>
                                            {booking.status}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => onEditBooking(booking)}
                                        className="p-2 text-gray-500 hover:text-blue-600"
                                    >
                                        <Edit size={16} />
                                    </button>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-center text-gray-500 py-8">No sessions scheduled for this day.</p>
                    )}
                </div>
                 <div className="mt-6 flex justify-end">
                    <button
                        onClick={() => onEditBooking({ dateTime: selectedDate } as Booking)}
                        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700"
                    >
                        <Plus size={16} className="mr-2" />
                        Add Session
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default DailyAgendaModal;