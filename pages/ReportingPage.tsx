
import React, { useState, useMemo } from 'react';
import { endOfDay } from 'date-fns/endOfDay';
import { useStudioData } from '../hooks/useStudioData';
import TrainerPerformanceChart from '../components/dashboard/TrainerPerformanceChart';
import StudioKPIs from '../components/reporting/CustomerActivity';
import DateRangePicker from '../components/ui/DateRangePicker';
import PeakActivityChart from '../components/reporting/PeakActivityChart';
import TopCustomersList from '../components/reporting/TopCustomersList';
import MonthlySessionChart from '../components/reporting/MonthlySessionChart';
import AtAGlance from '../components/reporting/AtAGlance';

const ReportingPage: React.FC = () => {
    const { bookings: allBookings, trainers, customers, classTypes, getClassType } = useStudioData();
    
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
        from: new Date('2025-01-01'),
        to: new Date('2025-12-31'),
    });

    const filteredBookings = useMemo(() => {
        const { from, to } = dateRange;
        if (!from || !to) return [];
        const periodEnd = endOfDay(to);
        return allBookings.filter(booking => {
            const bookingDate = new Date(booking.dateTime);
            return bookingDate >= from && bookingDate <= periodEnd;
        });
    }, [allBookings, dateRange]);

    return (
        <div className="space-y-8">
             <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <h2 className="text-3xl font-bold text-gray-800">Studio Overview</h2>
                 <DateRangePicker range={dateRange} onRangeChange={setDateRange} />
            </div>

            <StudioKPIs 
                bookings={filteredBookings} 
                allBookings={allBookings} 
                dateRange={dateRange}
                getClassType={getClassType}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <MonthlySessionChart bookings={filteredBookings} />
                </div>
                <AtAGlance
                    bookings={filteredBookings}
                    trainers={trainers}
                    customers={customers}
                    classTypes={classTypes}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <TrainerPerformanceChart bookings={filteredBookings} trainers={trainers} />
                <PeakActivityChart bookings={filteredBookings} />
                <TopCustomersList bookings={filteredBookings} />
            </div>
        </div>
    );
};

export default ReportingPage;