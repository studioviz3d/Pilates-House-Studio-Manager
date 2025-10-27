import React, { useState, useEffect, useMemo } from 'react';
import { Booking, BookingStatus } from '../types';
import Modal from './ui/Modal';
import { useStudioData } from '../hooks/useStudioData';
import { format } from 'date-fns/format';
import { isBefore } from 'date-fns/isBefore';
import { setHours } from 'date-fns/setHours';
import { setMinutes } from 'date-fns/setMinutes';
import { DatePicker } from './ui/DatePicker';
import MultiSelect, { MultiSelectOption } from './ui/MultiSelect';
import Select, { SelectOption } from './ui/Select';
import { AlertCircle, CheckCircle } from 'lucide-react';
import TimePicker from './ui/TimePicker';
import ConfirmationModal from './ui/ConfirmationModal';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: Booking | null;
    selectedDateTime: Date | null;
}

const inputBaseClasses = "w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm";

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, booking, selectedDateTime }) => {
    const {
        customers, trainers, classTypes, addBooking, updateBooking, getTrainer, getClassType, addRecurringBookings, now
    } = useStudioData();

    const [customerIds, setCustomerIds] = useState<string[]>([]);
    const [trainerId, setTrainerId] = useState<string>('');
    const [classTypeId, setClassTypeId] = useState<string>('');
    const [dateTime, setDateTime] = useState<Date>(new Date());
    const [status, setStatus] = useState<BookingStatus>(BookingStatus.Booked);
    const [notes, setNotes] = useState<string>('');
    
    // State for recurring bookings
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrenceWeeks, setRecurrenceWeeks] = useState(4);
    
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (booking) {
                // Editing existing booking
                setTrainerId(booking.trainerId);
                setClassTypeId(booking.classTypeId);
                setCustomerIds(booking.customerIds);
                setDateTime(new Date(booking.dateTime));
                setStatus(booking.status);
                setNotes(booking.notes || '');
            } else {
                // Creating new booking
                const initialDate = selectedDateTime || new Date();
                setDateTime(initialDate);
                setTrainerId(trainers[0]?.id || '');
                setClassTypeId(classTypes[0]?.id || '');
                setCustomerIds([]);
                setStatus(BookingStatus.Booked);
                setNotes('');
                setIsRecurring(false);
                setRecurrenceWeeks(4);
            }
        }
    }, [booking, selectedDateTime, isOpen, trainers, classTypes]);

    const customerOptions: MultiSelectOption[] = useMemo(() =>
        [...customers]
            .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
            .map(c => ({ value: c.id, label: `${c.firstName} ${c.lastName}` })),
        [customers]
    );

    const trainerOptions: SelectOption[] = useMemo(() =>
        trainers.map(t => ({ value: t.id, label: `${t.firstName} ${t.lastName}` })),
        [trainers]
    );

    const classTypeOptions: SelectOption[] = useMemo(() =>
        classTypes.map(ct => ({ value: ct.id, label: ct.name })),
        [classTypes]
    );
    
    const statusOptions: SelectOption[] = useMemo(() => {
        const allStatuses = Object.values(BookingStatus).filter(s => s !== BookingStatus.Deleted);
        return allStatuses.map(s => ({ value: s, label: s }));
    }, []);


    const validationError = useMemo(() => {
        // Capacity validation
        if (classTypeId && customerIds.length > 0) {
            const classType = getClassType(classTypeId);
            if (classType) {
                const className = classType.name.toLowerCase();
                const customerCount = customerIds.length;
                if (className === 'private' && customerCount !== 1) return 'Private classes must have exactly 1 customer.';
                if (className === 'duet' && customerCount !== 2) return 'Duet classes must have exactly 2 customers.';
                if (className === 'group' && (customerCount > classType.maxCapacity)) return `Group classes cannot exceed ${classType.maxCapacity} customers.`;
                if (className === 'group' && (customerCount < 1)) return `Group classes must have at least 1 customer.`;
            }
        }
        
        // Time-based validation
        const isPast = isBefore(dateTime, now);
        if (isPast && status === BookingStatus.Booked) {
            return "Past bookings must have a final status (e.g., Completed, Cancelled).";
        }
        if (!isPast && (status === BookingStatus.Completed || status === BookingStatus.CancelledLate)) {
            return "Future bookings cannot be marked as 'Completed' or 'Cancelled - Late'.";
        }

        return null;
    }, [classTypeId, customerIds, getClassType, dateTime, status, now]);
    
    const closeOnSelectCount = useMemo(() => {
        if (!classTypeId) return undefined;
        const classType = getClassType(classTypeId);
        if (!classType) return undefined;
    
        const className = classType.name.toLowerCase();
        if (className === 'private') return 1;
        if (className === 'duet') return 2;
        if (className === 'group') return classType.maxCapacity; 
        
        return undefined;
    }, [classTypeId, getClassType]);
    
    const packageValidation = useMemo(() => {
        if (customerIds.length === 0 || !trainerId || !classTypeId) {
            return { hasWarning: false, message: null };
        }

        const trainer = getTrainer(trainerId);
        if (!trainer) return { hasWarning: false, message: null };

        const customersWithoutPackage: string[] = [];

        customerIds.forEach(id => {
            const customer = customers.find(c => c.id === id);
            if (customer) {
                const hasValidPackage = customer.packages.some(p =>
                    p.classTypeId === classTypeId &&
                    p.trainerLevel === trainer.level &&
                    p.sessionsRemaining > 0 &&
                    !p.isArchived &&
                    new Date(p.expirationDate) >= new Date()
                );
                if (!hasValidPackage) {
                    customersWithoutPackage.push(`${customer.firstName} ${customer.lastName}`);
                }
            }
        });

        if (customersWithoutPackage.length > 0) {
            return {
                hasWarning: true,
                isError: false,
                message: `Warning: ${customersWithoutPackage.join(', ')} do not have a valid package. If completed, this will create a session debt.`,
            };
        }
        
        const classType = getClassType(classTypeId);
        return {
            hasWarning: true,
            isError: false,
            isConfirmation: true,
            message: `A session for a ${classType?.name} class with a ${trainer.level} trainer will be deducted from each customer's package upon completion.`,
        };

    }, [customerIds, trainerId, classTypeId, customers, getTrainer, getClassType]);


    const handleTimeChange = (time: string) => { // time is "HH:mm"
        const [hours, minutes] = time.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
            setDateTime(prev => setMinutes(setHours(prev, hours), minutes));
        }
    };

    const handleDelete = () => {
        if (booking) {
            setIsConfirmOpen(true);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validationError) {
            alert(validationError);
            return;
        }
        if (customerIds.length === 0 || !trainerId || !classTypeId) {
            alert('Please select a trainer, class type, and at least one customer.');
            return;
        }
        
        if (isRecurring && recurrenceWeeks <= 0) {
            alert('Number of weeks for recurrence must be greater than 0.');
            return;
        }

        const bookingData = {
            customerIds,
            trainerId,
            classTypeId,
            dateTime,
            status,
            notes,
        };

        if (booking) {
            updateBooking(booking.id, bookingData);
        } else {
             if (isRecurring && recurrenceWeeks > 0) {
                addRecurringBookings(bookingData, recurrenceWeeks);
            } else {
                addBooking(bookingData);
            }
        }
        onClose();
    };

    const title = booking ? 'Edit Booking' : 'New Booking';
    const isSaveDisabled = !!validationError;

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={title}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Trainer</label>
                        <Select
                            options={trainerOptions}
                            value={trainerId}
                            onChange={setTrainerId}
                            placeholder="Select a trainer"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Class Type</label>
                        <Select
                            options={classTypeOptions}
                            value={classTypeId}
                            onChange={setClassTypeId}
                            placeholder="Select a class type"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Customer(s)</label>
                        <MultiSelect 
                            options={customerOptions} 
                            selected={customerIds} 
                            onChange={setCustomerIds} 
                            placeholder="Select customers..."
                            closeOnSelectCount={closeOnSelectCount}
                        />
                    </div>
                    {packageValidation.hasWarning && !validationError && (
                        <div className={`p-3 rounded-md text-sm flex items-start ${packageValidation.isConfirmation ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {packageValidation.isConfirmation ? 
                                <CheckCircle size={16} className="mr-2 flex-shrink-0 mt-0.5" /> : 
                                <AlertCircle size={16} className="mr-2 flex-shrink-0 mt-0.5" />}
                            <span>{packageValidation.message}</span>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <DatePicker selected={dateTime} onChange={setDateTime} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                            <TimePicker 
                            value={format(dateTime, 'HH:mm')}
                            onChange={handleTimeChange}
                        />
                        </div>
                    </div>

                    {!booking && (
                        <div>
                            <div className="flex items-center">
                                <input
                                    id="isRecurring"
                                    type="checkbox"
                                    checked={isRecurring}
                                    onChange={(e) => setIsRecurring(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="isRecurring" className="ml-2 block text-sm font-medium text-gray-700">
                                    Make this a recurring booking
                                </label>
                            </div>
                            {isRecurring && (
                                <div className="mt-4 pl-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Repeat for</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={recurrenceWeeks}
                                            onChange={(e) => setRecurrenceWeeks(Number(e.target.value))}
                                            min="1"
                                            className={`${inputBaseClasses} w-20`}
                                        />
                                        <span className="text-sm text-gray-600">weeks</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <Select
                            options={statusOptions}
                            value={status}
                            onChange={(val) => setStatus(val as BookingStatus)}
                            disabled={!booking && isBefore(dateTime, now)}
                        />
                        {!booking && isBefore(dateTime, now) && (
                            <p className="mt-2 text-xs text-gray-500">Note: For new past bookings, please set a final status.</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={inputBaseClasses} />
                    </div>
                    {validationError && (
                        <div className="p-3 rounded-md text-sm flex items-start bg-red-100 text-red-800">
                            <AlertCircle size={16} className="mr-2 flex-shrink-0 mt-0.5" />
                            <span>{validationError}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center pt-4">
                        <div>
                            {booking && <button type="button" onClick={handleDelete} className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100">Delete</button>}
                        </div>
                        <div className="flex space-x-3">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                            <button type="submit" disabled={isSaveDisabled} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">Save Booking</button>
                        </div>
                    </div>
                </form>
            </Modal>
             <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={() => {
                    if (booking) {
                        updateBooking(booking.id, { status: BookingStatus.Deleted });
                        onClose(); // Close the main modal
                    }
                }}
                title="Delete Booking"
                confirmText="Delete"
            >
                Are you sure you want to delete this booking? This will remove it from the calendar.
            </ConfirmationModal>
        </>
    );
};

export default BookingModal;