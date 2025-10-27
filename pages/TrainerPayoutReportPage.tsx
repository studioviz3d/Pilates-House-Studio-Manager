

import React, { useState, useMemo } from 'react';
import { useStudioData } from '../../hooks/useStudioData';
import { endOfMonth } from 'date-fns/endOfMonth';
import { endOfDay } from 'date-fns/endOfDay';
import { format } from 'date-fns/format';
import { startOfMonth } from 'date-fns/startOfMonth';
import { startOfDay } from 'date-fns/startOfDay';
import { BookingStatus, Booking, Trainer, Customer } from '../../types';
import DateRangePicker from '../components/ui/DateRangePicker';
import TrainerPerformanceCard from '../components/reporting/TrainerPerformanceCard';
import Select, { SelectOption } from '../components/ui/Select';
import Card from '../components/ui/Card';

type TrainerMetric = Trainer & {
    sessionsTaught: number;
    uniqueCustomers: number;
    lateCancellationRate: number;
    sessionBreakdown: Record<string, number>;
    bookingsForPeriod: Booking[];
    topCustomers: { customer: Customer | undefined; sessionCount: number }[];
};

export type StudioAverages = {
    sessions: number;
    customers: number;
    cancelRate: number;
};

const TrainerReportPage: React.FC = () => {
    // FIX: Add `customers` to destructuring to resolve potential scope issues.
    const { trainers, bookings, getClassType, getCustomer, now, customers } = useStudioData();
    
    const referenceDate = now;
    const currentMonthStart = startOfMonth(referenceDate);
    const currentMonthEnd = endOfMonth(referenceDate);

    const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
        from: currentMonthStart,
        to: currentMonthEnd,
    });
    const [sort, setSort] = useState('sessions-desc');

    const sortOptions: SelectOption[] = [
        { value: 'sessions-desc', label: 'Most Sessions' },
        { value: 'sessions-asc', label: 'Fewest Sessions' },
        { value: 'customers-desc', label: 'Most Customers' },
        { value: 'cancel-rate-desc', label: 'Highest Late Cancel %' },
    ];

    const reportData = useMemo<TrainerMetric[]>(() => {
        const periodStart = startOfDay(dateRange.from);
        const periodEnd = endOfDay(dateRange.to);
        
        const filteredBookings = bookings.filter(b => {
             const bookingDate = new Date(b.dateTime);
             return bookingDate >= periodStart && bookingDate <= periodEnd && b.status !== BookingStatus.Deleted;
        });

        const metrics = trainers.map(trainer => {
            const trainerBookings = filteredBookings.filter(b => b.trainerId === trainer.id);
            
            const completedSessions = trainerBookings.filter(b => b.status === BookingStatus.Completed);
            const lateCancellations = trainerBookings.filter(b => b.status === BookingStatus.CancelledLate);
            
            const totalPayableSessions = completedSessions.length + lateCancellations.length;
            const lateCancellationRate = totalPayableSessions > 0
                ? (lateCancellations.length / totalPayableSessions) * 100
                : 0;
                
            const uniqueCustomerIds = new Set(completedSessions.flatMap(b => b.customerIds));

            const sessionBreakdown = completedSessions.reduce((acc, booking) => {
                const classType = getClassType(booking.classTypeId);
                if (classType) {
                    const abbr = classType.abbreviation;
                    acc[abbr] = (acc[abbr] || 0) + 1;
                }
                return acc;
            }, {} as Record<string, number>);
            
            const customerCounts: Record<string, number> = {};
            completedSessions.forEach(b => {
                b.customerIds.forEach(id => {
                    customerCounts[id] = (customerCounts[id] || 0) + 1;
                });
            });
    
            const topCustomers = Object.entries(customerCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([customerId, sessionCount]) => ({
                    customer: getCustomer(customerId),
                    sessionCount
                }));

            return {
                ...trainer,
                sessionsTaught: completedSessions.length,
                uniqueCustomers: uniqueCustomerIds.size,
                lateCancellationRate,
                sessionBreakdown,
                bookingsForPeriod: completedSessions,
                topCustomers
            };
        });

        return metrics.sort((a, b) => {
            switch (sort) {
                case 'sessions-asc':
                    return a.sessionsTaught - b.sessionsTaught;
                case 'customers-desc':
                    return b.uniqueCustomers - a.uniqueCustomers;
                case 'cancel-rate-desc':
                    return b.lateCancellationRate - a.lateCancellationRate;
                case 'sessions-desc':
                default:
                    return b.sessionsTaught - a.sessionsTaught;
            }
        });

    }, [trainers, dateRange, bookings, getClassType, sort, getCustomer]);
    
    // FIX: Complete the `useMemo` calculation which was cut off.
    const studioAverages = useMemo<StudioAverages>(() => {
        const activeTrainers = reportData.filter(m => m.sessionsTaught > 0);
        if (activeTrainers.length === 0) {
            return { sessions: 0, customers: 0, cancelRate: 0 };
        }
        const totalSessions = activeTrainers.reduce((sum, t) => sum + t.sessionsTaught, 0);
        const totalCustomers = activeTrainers.reduce((sum, t) => sum + t.uniqueCustomers, 0);
        const totalCancelRate = activeTrainers.reduce((sum, t) => sum + t.lateCancellationRate, 0);
        return {
            sessions: totalSessions / activeTrainers.length,
            customers: totalCustomers / activeTrainers.length,
            cancelRate: totalCancelRate / activeTrainers.length,
        };
    }, [reportData]);

    // FIX: Add the missing JSX return for the component.
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <h2 className="text-3xl font-bold text-gray-800">Trainer Performance Report</h2>
                <div className="flex items-center gap-4">
                    <DateRangePicker range={dateRange} onRangeChange={setDateRange} />
                    <div className="w-56">
                        <Select options={sortOptions} value={sort} onChange={setSort} labelPrefix="Sort by:" />
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {reportData.map(metric => (
                    <TrainerPerformanceCard key={metric.id} metric={metric} averages={studioAverages} />
                ))}
            </div>
            {reportData.length === 0 && (
                <Card>
                    <div className="text-center py-12">
                        <p className="text-gray-500">No trainer data for the selected period.</p>
                    </div>
                </Card>
            )}
        </div>
    );
};

// FIX: Add missing default export.
export default TrainerReportPage;
