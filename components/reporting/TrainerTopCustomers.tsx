import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import { Booking } from '../../types';
import { useStudioData } from '../../hooks/useStudioData';
import { Users } from 'lucide-react';

interface TrainerTopCustomersProps {
    bookings: Booking[];
}

const TrainerTopCustomers: React.FC<TrainerTopCustomersProps> = ({ bookings }) => {
    const { getCustomer } = useStudioData();

    const topCustomers = useMemo(() => {
        const customerSessionCounts: Record<string, number> = {};

        bookings.forEach(booking => {
            booking.customerIds.forEach(customerId => {
                customerSessionCounts[customerId] = (customerSessionCounts[customerId] || 0) + 1;
            });
        });

        return Object.entries(customerSessionCounts)
            .map(([customerId, sessionCount]) => ({
                customer: getCustomer(customerId),
                sessionCount,
            }))
            .filter(item => item.customer)
            .sort((a, b) => b.sessionCount - a.sessionCount)
            .slice(0, 5);
    }, [bookings, getCustomer]);

    return (
        <Card>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Top Customers</h3>
            {topCustomers.length > 0 ? (
                <ul className="space-y-3">
                    {topCustomers.map(({ customer, sessionCount }) => (
                        customer && (
                            <li key={customer.id} className="flex items-center justify-between">
                                <Link to={`/customers/${customer.id}`} className="flex items-center group">
                                    <img className="h-8 w-8 rounded-full object-cover" src={customer.avatarUrl} alt="" />
                                    <p className="ml-2 text-sm font-medium text-gray-800 group-hover:text-blue-600">
                                        {customer.firstName} {customer.lastName}
                                    </p>
                                </Link>
                                <span className="text-sm font-semibold text-gray-600">
                                    {sessionCount} session{sessionCount > 1 ? 's' : ''}
                                </span>
                            </li>
                        )
                    ))}
                </ul>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 py-10">
                    <Users size={32} className="mb-2 text-gray-400"/>
                    <p className="text-sm">No customer activity.</p>
                </div>
            )}
        </Card>
    );
};

export default TrainerTopCustomers;
