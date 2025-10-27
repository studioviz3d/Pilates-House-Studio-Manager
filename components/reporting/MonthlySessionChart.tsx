import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from '../ui/Card';
import { Booking, BookingStatus } from '../../types';
import { format } from 'date-fns';
import { useStudioData } from '../../hooks/useStudioData';

interface MonthlySessionChartProps {
    bookings: Booking[];
}

const BAR_COLORS = ['#3b82f6', '#60a5fa', '#9ca3af', '#d1d5db'];

const MonthlySessionChart: React.FC<MonthlySessionChartProps> = ({ bookings }) => {
    const { classTypes, getClassType } = useStudioData();
    
    const chartData = useMemo(() => {
        const completedBookings = bookings.filter(b => b.status === BookingStatus.Completed);
        
        const dataByMonth: Record<string, Record<string, any>> = {};

        completedBookings.forEach(booking => {
            const month = format(new Date(booking.dateTime), 'yyyy-MM');
            const monthLabel = format(new Date(booking.dateTime), 'MMM yyyy');
            const classType = getClassType(booking.classTypeId);

            if (classType) {
                if (!dataByMonth[month]) {
                    dataByMonth[month] = { month: monthLabel };
                }
                dataByMonth[month][classType.name] = (dataByMonth[month][classType.name] || 0) + 1;
            }
        });

        return Object.values(dataByMonth)
            .sort((a, b) => {
                const dateA = new Date(a.month.replace(/(\w{3}) (\d{4})/, '$1 1, $2'));
                const dateB = new Date(b.month.replace(/(\w{3}) (\d{4})/, '$1 1, $2'));
                return dateA.getTime() - dateB.getTime();
            });

    }, [bookings, getClassType]);

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Monthly Sessions by Type</h3>
      <div style={{ width: '100%', height: 300 }}>
        {chartData.length > 0 ? (
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '0.5rem',
                    border: '1px solid #e2e8f0',
                  }}
                />
                <Legend wrapperStyle={{fontSize: "14px"}} />
                {classTypes.map((ct, index) => (
                    <Bar 
                        key={ct.id} 
                        dataKey={ct.name} 
                        stackId="a" 
                        fill={BAR_COLORS[index % BAR_COLORS.length]} 
                        name={ct.name} 
                        radius={[4, 4, 0, 0]}
                    />
                ))}
              </BarChart>
            </ResponsiveContainer>
        ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
                No completed session data for the selected period.
            </div>
        )}
      </div>
    </Card>
  );
};

export default MonthlySessionChart;