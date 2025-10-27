

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from '../ui/Card';
import { Booking, Trainer, BookingStatus } from '../../types';
import { format } from 'date-fns/format';
import { useStudioData } from '../../hooks/useStudioData';

interface RevenueChartProps {
    bookings: Booking[];
    trainers: Trainer[];
}

const RevenueChart: React.FC<RevenueChartProps> = ({ bookings, trainers }) => {
    const { getClassType, formatCurrency } = useStudioData();
    
    const revenueData = useMemo(() => {
        const revenueByMonth: { [key: string]: number } = {};
        
        const payableBookings = bookings.filter(
            b => b.status === BookingStatus.Completed || b.status === BookingStatus.CancelledLate
        );

        payableBookings.forEach(booking => {
            const month = format(new Date(booking.dateTime), 'yyyy-MM');
            const trainer = trainers.find(t => t.id === booking.trainerId);
            const classType = getClassType(booking.classTypeId);
            
            if (trainer && classType) {
                const revenue = classType.pricing[trainer.level]['1'];
                if (!revenueByMonth[month]) {
                    revenueByMonth[month] = 0;
                }
                revenueByMonth[month] += revenue;
            }
        });

        return Object.entries(revenueByMonth)
            .map(([month, revenue]) => ({
                name: format(new Date(month + '-02'), 'MMM yyyy'), // Use day 02 to avoid timezone issues
                revenue,
            }))
            .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
            
    }, [bookings, trainers, getClassType]);

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Revenue Trend</h3>
      <div style={{ width: '100%', height: 300 }}>
        {revenueData.length > 0 ? (
            <ResponsiveContainer>
              <BarChart data={revenueData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatCurrency(Number(value))} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '0.5rem',
                    border: '1px solid #e2e8f0',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Legend wrapperStyle={{fontSize: "14px"}} />
                <Bar dataKey="revenue" fill="#3b82f6" name="Monthly Revenue" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
        ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
                No revenue data for the selected period.
            </div>
        )}
      </div>
    </Card>
  );
};

export default RevenueChart;