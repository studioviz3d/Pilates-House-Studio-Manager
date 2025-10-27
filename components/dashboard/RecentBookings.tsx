

import React from 'react';
import { useStudioData } from '../../hooks/useStudioData';
import Card from '../ui/Card';
import { BookingStatus } from '../../types';
import { formatDateTime } from '../../utils';
import { Link } from 'react-router-dom';

const RecentBookings: React.FC = () => {
    const { bookings, getTrainer, getCustomer, getClassType, now } = useStudioData();

    // Get upcoming bookings, sort them by date, and take the first 5
    const upcomingBookings = bookings
        .filter(b => b.status === BookingStatus.Booked && new Date(b.dateTime) >= now)
        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
        .slice(0, 5);

    return (
        <Card>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Upcoming Bookings</h3>
            {upcomingBookings.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                    {upcomingBookings.map(booking => {
                        const trainer = getTrainer(booking.trainerId);
                        const classType = getClassType(booking.classTypeId);
                        const customers = booking.customerIds.map(id => getCustomer(id)).filter(Boolean);

                        return (
                            <li key={booking.id} className="py-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">
                                            {classType?.name || 'Class'} with {trainer?.firstName || 'Trainer'}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            For: {' '}
                                            {customers.map((c, index) => (
                                                <React.Fragment key={c.id}>
                                                    <Link to={`/customers/${c.id}`} className="hover:text-blue-600">
                                                        {`${c.firstName} ${c.lastName}`}
                                                    </Link>
                                                    {index < customers.length - 1 && ', '}
                                                </React.Fragment>
                                            ))}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-gray-800">
                                            {formatDateTime(booking.dateTime)}
                                        </p>
                                        <Link to="/dashboard" className="text-sm text-blue-600 hover:text-blue-800">
                                            View Calendar
                                        </Link>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="text-sm text-gray-500">No upcoming bookings.</p>
            )}
        </Card>
    );
};

export default RecentBookings;