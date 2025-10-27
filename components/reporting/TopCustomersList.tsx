import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import { Booking } from '../../types';
import { useStudioData } from '../../hooks/useStudioData';
import { Users } from 'lucide-react';

interface TopCustomersListProps {
    bookings: Booking[];
}

const TopCustomersList: React.FC<TopCustomersListProps> = ({ bookings }) => {
    const { getCustomer } = useStudioData();

    const topCustomers = useMemo(() => {
        const customerSessionCounts: Record<string, number> = {};

        bookings.forEach(booking => {
            booking.customerIds.forEach(customerId => {
                customerSessionCounts[customerId] = (customerSessionCounts[customerId] || 0) + 1;
            });
        });

        return Object.entries(customerSessionCounts)
            .map(([customerId, sessionCount]) => {
                const customer = getCustomer(customerId);
                return {
                    customer,
                    sessionCount,
                };
            })
            .filter(item => item.customer) // Ensure customer exists
            .sort((a, b) => b.sessionCount - a.sessionCount)
            .slice(0, 7); // Show top 7 customers
    }, [bookings, getCustomer]);

    return (
        <Card className="h-full">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Top Customers</h3>
            {topCustomers.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                    {topCustomers.map(({ customer, sessionCount }) => (
                        customer && (
                            <li key={customer.id} className="py-3">
                                <div className="flex items-center justify-between">
                                    <Link to={`/customers/${customer.id}`} className="flex items-center group">
                                        <img className="h-10 w-10 rounded-full object-cover" src={customer.avatarUrl} alt="" />
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                                                {customer.firstName} {customer.lastName}
                                            </p>
                                        </div>
                                    </Link>
                                    <div className="text-sm font-semibold text-gray-800">
                                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                                            {sessionCount} Session{sessionCount > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                            </li>
                        )
                    ))}
                </ul>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 py-10">
                    <Users size={40} className="mb-2 text-gray-400"/>
                    <p>No customer activity</p>
                    <p className="text-xs">in the selected period.</p>
                </div>
            )}
        </Card>
    );
};

export default TopCustomersList;
