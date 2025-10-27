import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '../ui/Card';
import { Booking } from '../../types';
import { format } from 'date-fns';
import { BarChart3 } from 'lucide-react';

interface TrainerActivityByDayProps {
    bookings: Booking[];
}

const TrainerActivityByDay: React.FC<TrainerActivityByDayProps> = ({ bookings }) => {
    const data = useMemo(() => {
        const dayCounts: Record<string, number> = {
            'Sun': 0, 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0
        };
        const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        bookings.forEach(booking => {
            const dayName = format(new Date(booking.dateTime), 'E'); // 'E' gives short day name like 'Mon'
            if (dayCounts.hasOwnProperty(dayName)) {
                dayCounts[dayName]++;
            }
        });

        return dayOrder.map(day => ({
            name: day,
            sessions: dayCounts[day]
        }));
    }, [bookings]);

    return (
        <Card>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Activity by Day</h3>
            <div style={{ width: '100%', height: 300 }}>
                {data.some(d => d.sessions > 0) ? (
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
                                formatter={(value: number) => [value, 'Sessions']}
                            />
                            <Bar dataKey="sessions" fill="#8884d8" name="Completed Sessions" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <BarChart3 size={40} className="mb-2 text-gray-400" />
                        <p>No session data for this period.</p>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default TrainerActivityByDay;