import React from 'react';
import { LucideProps } from 'lucide-react';
import Card from '../ui/Card';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<LucideProps>;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon: Icon }) => {
  return (
    <Card>
      <div className="flex items-center">
        <div className="p-3 rounded-full bg-blue-100">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
      </div>
    </Card>
  );
};

export default KpiCard;