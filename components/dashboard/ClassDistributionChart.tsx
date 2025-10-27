import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from '../ui/Card';
import { Booking } from '../../types';
import { useStudioData } from '../../hooks/useStudioData';

interface ClassDistributionChartProps {
    bookings: Booking[];
}

const PIE_COLORS = ['#3b82f6', '#60a5fa', '#9ca3af', '#d1d5db'];

const ClassDistributionChart: React.FC<ClassDistributionChartProps> = ({ bookings }) => {
  const { classTypes } = useStudioData();
  const data = classTypes.map(ct => ({
      name: ct.name,
      value: bookings.filter(b => b.classTypeId === ct.id).length
  })).filter(d => d.value > 0);

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Class Distribution</h3>
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
            <div className="flex items-center justify-center h-full text-gray-500">
                No class data for the selected period.
            </div>
        )}
      </div>
    </Card>
  );
};

export default ClassDistributionChart;