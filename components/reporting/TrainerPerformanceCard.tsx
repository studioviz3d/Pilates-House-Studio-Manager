import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import { Booking, Trainer, Customer } from '../../types';
import { StudioAverages } from '../../pages/TrainerPayoutReportPage';
import TrainerSessionBreakdownCell from './TrainerSessionBreakdownCell';
import MiniActivityByDayChart from './MiniActivityByDayChart';
import { Users, ArrowUp, ArrowDown } from 'lucide-react';

type TrainerMetric = Trainer & {
    sessionsTaught: number;
    uniqueCustomers: number;
    lateCancellationRate: number;
    sessionBreakdown: Record<string, number>;
    bookingsForPeriod: Booking[];
    topCustomers: { customer: Customer | undefined; sessionCount: number }[];
};

interface TrainerPerformanceCardProps {
    metric: TrainerMetric;
    averages: StudioAverages;
}

const KpiRow: React.FC<{label: string; value: number; average: number; higherIsBetter?: boolean; isPercentage?: boolean}> = 
    ({ label, value, average, higherIsBetter = true, isPercentage = false }) => {
    
    if (average === 0 && value === 0) return null; // Don't show if no data

    const diff = value - average;
    const isPositive = (higherIsBetter && diff > 0) || (!higherIsBetter && diff < 0);
    const isNegative = (higherIsBetter && diff < 0) || (!higherIsBetter && diff > 0);

    const diffText = Math.abs(diff).toFixed(isPercentage ? 1 : 0);
    const valueText = isPercentage ? `${value.toFixed(1)}%` : value;

    return (
        <div className="flex justify-between items-center text-sm">
            <p className="text-gray-600">{label}</p>
            <div className="flex items-center gap-2">
                 {isPositive && <span className="flex items-center text-xs text-green-600"><ArrowUp size={12} className="mr-0.5"/> (+{diffText})</span>}
                 {isNegative && <span className="flex items-center text-xs text-red-600"><ArrowDown size={12} className="mr-0.5"/> (-{diffText})</span>}
                <p className="font-bold text-gray-800 w-12 text-right">{valueText}</p>
            </div>
        </div>
    );
};


const TrainerPerformanceCard: React.FC<TrainerPerformanceCardProps> = ({ metric, averages }) => {
    return (
        <Card className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center mb-4">
                    <img className="h-12 w-12 rounded-full object-cover" src={metric.avatarUrl} alt="" />
                    <div className="ml-4">
                        <Link to={`/trainers/${metric.id}`} className="text-lg font-bold text-gray-800 hover:text-blue-600">
                            {metric.firstName} {metric.lastName}
                        </Link>
                        <p className="text-sm text-gray-500">
                           {metric.level} Trainer
                        </p>
                    </div>
                </div>
                <TrainerSessionBreakdownCell breakdown={metric.sessionBreakdown} />
            </div>

            {/* Main Content */}
            <div className="flex-grow space-y-4">
                 {/* KPIs with Comparison */}
                <div className="space-y-2 border-y py-3 px-2 bg-gray-50/50">
                    <KpiRow label="Sessions Taught" value={metric.sessionsTaught} average={averages.sessions} />
                    <KpiRow label="Unique Customers" value={metric.uniqueCustomers} average={averages.customers} />
                    <KpiRow label="Late Cancel Rate" value={metric.lateCancellationRate} average={averages.cancelRate} higherIsBetter={false} isPercentage />
                </div>


                {/* Activity Chart */}
                <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Weekly Activity Pattern</h4>
                    <MiniActivityByDayChart bookings={metric.bookingsForPeriod} />
                </div>
            </div>

            {/* Footer */}
            <div className="border-t mt-4 pt-4">
                 <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Top Customers this Period</h4>
                 {metric.topCustomers.length > 0 ? (
                     <ul className="space-y-2">
                        {metric.topCustomers.map(({ customer, sessionCount }) => (
                            customer && (
                                <li key={customer.id} className="flex items-center justify-between text-sm">
                                    <Link to={`/customers/${customer.id}`} className="flex items-center group">
                                        <img className="h-6 w-6 rounded-full object-cover" src={customer.avatarUrl} alt="" />
                                        <p className="ml-2 font-medium text-gray-700 group-hover:text-blue-600">{customer.firstName} {customer.lastName}</p>
                                    </Link>
                                    <span className="font-semibold text-gray-500">{sessionCount} sessions</span>
                                </li>
                            )
                        ))}
                     </ul>
                 ) : (
                    <div className="flex items-center text-sm text-gray-400 py-2">
                        <Users size={16} className="mr-2" />
                        <span>No repeat customers.</span>
                    </div>
                 )}
            </div>
        </Card>
    );
};

export default TrainerPerformanceCard;