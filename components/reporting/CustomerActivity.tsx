

import React, { useMemo } from 'react';
import KpiCard from '../dashboard/KpiCard';
import { Booking, ClassType, BookingStatus, Customer } from '../../types';
import { Users, UserPlus, CalendarCheck, PieChart } from 'lucide-react';
import { isWithinInterval } from 'date-fns/isWithinInterval';

interface StudioKPIsProps {
    bookings: Booking[];
    allBookings: Booking[];
    dateRange: { from: Date; to: Date };
    getClassType: (id: string) => ClassType | undefined;
}

const StudioKPIs: React.FC<StudioKPIsProps> = ({ bookings, allBookings, dateRange, getClassType }) => {

    const activityData = useMemo(() => {
        const activeCustomerIds: Set<string> = new Set(bookings.flatMap(b => b.customerIds));
        const newCustomerIds = new Set<string>();

        const completedBookings = bookings.filter(b => b.status === BookingStatus.Completed);

        if (bookings.length > 0) {
            const customerFirstBooking: Record<string, Date> = {};
            
            const sortedAllBookings = [...allBookings].sort((a,b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

            for (const booking of sortedAllBookings) {
                for (const customerId of booking.customerIds) {
                    if (!customerFirstBooking[customerId]) {
                        customerFirstBooking[customerId] = new Date(booking.dateTime);
                    }
                }
            }

            for (const customerId of activeCustomerIds) {
                 if (customerFirstBooking[customerId] && isWithinInterval(customerFirstBooking[customerId], { start: dateRange.from, end: dateRange.to })) {
                    newCustomerIds.add(customerId);
                 }
            }
        }
        
        const totalAttendees = completedBookings.reduce((sum, b) => sum + b.customerIds.length, 0);
        const totalCapacity = completedBookings.reduce((sum, b) => {
            const classType = getClassType(b.classTypeId);
            const capacity = classType?.maxCapacity && classType.maxCapacity > 0 ? classType.maxCapacity : b.customerIds.length;
            return sum + capacity;
        }, 0);

        const occupancyRate = totalCapacity > 0 ? (totalAttendees / totalCapacity) * 100 : 0;
        
        return {
            activeCustomers: activeCustomerIds.size,
            newCustomers: newCustomerIds.size,
            completedSessions: completedBookings.length,
            occupancyRate: occupancyRate.toFixed(1)
        };
    }, [bookings, allBookings, dateRange, getClassType]);

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard title="Active Customers" value={activityData.activeCustomers} icon={Users} />
            <KpiCard title="New Customers" value={activityData.newCustomers} icon={UserPlus} />
            <KpiCard title="Completed Sessions" value={activityData.completedSessions} icon={CalendarCheck} />
            <KpiCard title="Occupancy Rate" value={`${activityData.occupancyRate}%`} icon={PieChart} />
        </div>
    );
};

export default StudioKPIs;