import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from '../ui/Card';
import { Booking } from '../../types';
import { useStudioData } from '../../hooks/useStudioData';
import { PieChart as PieIcon } from 'lucide-react';

interface TrainerSessionBreakdownProps {
    bookings: Booking[];
}

const PIE_COLORS = ['#3b82f6', '#60a5fa', '#9ca3af', '#d1d5db'];

const TrainerSessionBreakdown: React.FC<TrainerSessionBreakdownProps> = ({ bookings }) => {
  const { classTypes } = useStudioData();
  const data = classTypes.map(ct => ({
      name: ct.name,
      value: bookings.filter(b => b.classTypeId === ct.id).length
  })).filter(d => d.value > 0);

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Session Breakdown</h3>
      <div style={{ width: '100%', height: 300 }}>
        {data.length > 0 ? (
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '0.5rem',
                    border: '1px solid #e2e8f0',
                  }}
                />
                <Legend wrapperStyle={{fontSize: "14px"}}/>
              </PieChart>
            </ResponsiveContainer>
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <PieIcon size={40} className="mb-2 text-gray-400" />
                <p>No session data for this period.</p>
            </div>
        )}
      </div>
    </Card>
  );
};

export default TrainerSessionBreakdown;