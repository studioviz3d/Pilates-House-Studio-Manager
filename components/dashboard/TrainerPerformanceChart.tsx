import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '../ui/Card';
import { Booking, Trainer, BookingStatus } from '../../types';
import { useNavigate } from 'react-router-dom';

interface TrainerPerformanceChartProps {
    bookings: Booking[];
    trainers: Trainer[];
}

const TrainerPerformanceChart: React.FC<TrainerPerformanceChartProps> = ({ bookings, trainers }) => {
  const navigate = useNavigate();
  
  const data = useMemo(() => {
    const validBookings = bookings.filter(b => b.status !== BookingStatus.Deleted);

    return trainers.map(trainer => {
        const trainerBookings = validBookings.filter(b => b.trainerId === trainer.id);
        return {
          id: trainer.id,
          name: trainer.firstName,
          sessions: trainerBookings.length,
        };
      })
      .filter(d => d.sessions > 0)
      .sort((a, b) => b.sessions - a.sessions);

  }, [bookings, trainers]);

  const handleBarClick = (data: any) => {
    if (data && data.id) {
        navigate(`/trainers/${data.id}`);
    }
  };


  return (
    <Card className="h-full">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Trainer Sessions</h3>
      <div className="h-[320px]">
        {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
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
                <Bar 
                    dataKey="sessions" 
                    fill="#3b82f6" 
                    name="Sessions Taught" 
                    radius={[4, 4, 0, 0]} 
                    onClick={handleBarClick}
                    style={{ cursor: 'pointer' }}
                />
              </BarChart>
            </ResponsiveContainer>
        ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
                No performance data for the selected period.
            </div>
        )}
      </div>
    </Card>
  );
};

export default TrainerPerformanceChart;