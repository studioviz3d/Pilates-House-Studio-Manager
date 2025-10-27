
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface TrainerSessionBreakdownCellProps {
  breakdown: Record<string, number>;
}

const CELL_COLORS = ['#3b82f6', '#60a5fa', '#9ca3af', '#fbbf24', '#f87171'];

const TrainerSessionBreakdownCell: React.FC<TrainerSessionBreakdownCellProps> = ({ breakdown }) => {
  const data = Object.entries(breakdown)
    .map(([name, value]) => ({ name: `${value} ${name}`, value }))
    .filter(d => typeof d.value === 'number' && d.value > 0);

  if (data.length === 0) {
    return <div className="text-xs text-gray-400">N/A</div>;
  }

  return (
    <div style={{ width: 40, height: 40 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            dataKey="value"
            nameKey="name"
            innerRadius={10}
            outerRadius={20}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CELL_COLORS[index % CELL_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '0.5rem',
                border: '1px solid #e2e8f0',
                fontSize: '12px',
                padding: '4px 8px',
            }}
            formatter={(value, name) => [value, name.split(' ')[1]]}
            labelFormatter={(label) => label.split(' ')[1]}
            itemSorter={(item) => -item.value!}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrainerSessionBreakdownCell;