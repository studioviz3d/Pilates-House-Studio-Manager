import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Booking } from '../../types';
import { format } from 'date-fns';

interface MiniActivityByDayChartProps {
    bookings: Booking[];
}

const MiniActivityByDayChart: React.FC<MiniActivityByDayChartProps> = ({ bookings }) => {
    const data = useMemo(() => {
        const dayCounts: Record<string, number> = {
            'Sun': 0, 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0
        };
        const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        bookings.forEach(booking => {
            const dayName = format(new Date(booking.dateTime), 'E');
            if (dayCounts.hasOwnProperty(dayName)) {
                dayCounts[dayName]++;
            }
        });

        return dayOrder.map(day => ({
            name: day,
            sessions: dayCounts[day]
        }));
    }, [bookings]);

    const hasData = useMemo(() => data.some(d => d.sessions > 0), [data]);

    return (
        <div style={{ width: '100%', height: 100 }}>
            {hasData ? (
                <ResponsiveContainer>
                    <BarChart data={data} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip
                            cursor={{ fill: 'rgba(239, 246, 255, 0.7)' }}
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                borderRadius: '0.5rem',
                                border: '1px solid #e2e8f0',
                                fontSize: '12px',
                                padding: '4px 8px',
                            }}
                            formatter={(value: number) => [value, 'Sessions']}
                            labelStyle={{ display: 'none' }}
                        />
                        <Bar dataKey="sessions" fill="#8884d8" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-sm text-gray-400">
                    No session activity this period.
                </div>
            )}
        </div>
    );
};

export default MiniActivityByDayChart;