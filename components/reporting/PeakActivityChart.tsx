import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '../ui/Card';
import { Booking, BookingStatus } from '../../types';
import { format } from 'date-fns';

interface PeakActivityChartProps {
    bookings: Booking[];
}

const PeakActivityChart: React.FC<PeakActivityChartProps> = ({ bookings }) => {
    const data = useMemo(() => {
        const dayCounts: Record<string, number> = {
            'Sun': 0, 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0
        };
        const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        const validBookings = bookings.filter(b => b.status !== BookingStatus.Deleted);

        validBookings.forEach(booking => {
            const dayName = format(new Date(booking.dateTime), 'E');
            if (dayCounts.hasOwnProperty(dayName)) {
                dayCounts[dayName]++;
            }
        });

        return dayOrder.map(day => ({
            name: day,
            bookings: dayCounts[day]
        }));
    }, [bookings]);

    const busiestDay = useMemo(() => {
        if (!data || data.every(d => d.bookings === 0)) return null;
        return data.reduce((max, day) => day.bookings > max.bookings ? day : max, data[0]);
    }, [data]);

    return (
        <Card className="flex flex-col h-full">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Peak Days</h3>
            <div className="flex-grow" style={{ width: '100%', height: 280 }}>
                {data.some(d => d.bookings > 0) ? (
                    <ResponsiveContainer>
                        <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                    borderRadius: '0.5rem',
                                    border: '1px solid #e2e8f0',
                                }}
                                formatter={(value: number) => [value, 'Bookings']}
                            />
                            <Bar dataKey="bookings" fill="#8884d8" name="Total Bookings" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        No booking data for the selected period.
                    </div>
                )}
            </div>
             {busiestDay && (
                <div className="text-center text-sm text-gray-500 pt-4 mt-auto border-t">
                    <strong>Insight:</strong> {busiestDay.name} is your busiest day with {busiestDay.bookings} booking{busiestDay.bookings !== 1 ? 's' : ''}.
                </div>
            )}
        </Card>
    );
};

export default PeakActivityChart;