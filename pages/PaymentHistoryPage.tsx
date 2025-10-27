

import React, { useState, useMemo } from 'react';
import { useStudioData } from '../../hooks/useStudioData';
import Card from '../../components/ui/Card';
import { formatDate } from '../../utils';
import { Link } from 'react-router-dom';
import DateRangePicker from '../../components/ui/DateRangePicker';
import { endOfDay } from 'date-fns/endOfDay';
import { startOfDay } from 'date-fns/startOfDay';
import Select, { SelectOption } from '../../components/ui/Select';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import { Payment } from '../../types';
import { ArrowLeft } from 'lucide-react';

const PaymentHistoryPage: React.FC = () => {
    const { payments, getTrainer, formatCurrency, trainers } = useStudioData();
    const [selectedTrainer, setSelectedTrainer] = useState<string>('all');
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
        from: new Date('2025-01-01'),
        to: new Date('2025-12-31'),
    });

    const filteredPaymentsData = useMemo(() => {
        return payments.filter(p => {
            const dateMatch = new Date(p.paymentDate) >= startOfDay(dateRange.from) && new Date(p.paymentDate) <= endOfDay(dateRange.to);
            const trainerMatch = selectedTrainer === 'all' || p.trainerId === selectedTrainer;
            return dateMatch && trainerMatch;
        }).sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
    }, [payments, dateRange, selectedTrainer]);

    const {
        currentPageData: filteredPayments,
        currentPage,
        totalPages,
        setCurrentPage,
        itemsPerPage,
        totalItems
    } = usePagination(filteredPaymentsData, 10);

    const trainerOptions: SelectOption[] = useMemo(() => ([
        { value: 'all', label: 'All Trainers' },
        ...trainers.map(t => ({ value: t.id, label: `${t.firstName} ${t.lastName}` }))
    ]), [trainers]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/financial/trainer-payouts" className="p-2 rounded-md hover:bg-gray-100">
                        <ArrowLeft className="text-gray-600" />
                    </Link>
                    <h2 className="text-3xl font-bold text-gray-800">Payout History</h2>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="w-full sm:w-56">
                        <Select 
                            options={trainerOptions}
                            value={selectedTrainer}
                            onChange={setSelectedTrainer}
                            searchable
                            labelPrefix="Trainer:"
                        />
                    </div>
                    <DateRangePicker range={dateRange} onRangeChange={setDateRange} />
                </div>
            </div>

            <Card className="!p-0">
                 {/* Mobile View */}
                 <div className="md:hidden divide-y divide-gray-200">
                     {filteredPayments.map((payment: Payment) => {
                         const trainer = getTrainer(payment.trainerId);
                         const periodText = payment.settledPeriods.length > 1
                             ? `${payment.settledPeriods.length} periods`
                             : payment.settledPeriods[0]?.periodString || 'N/A';
                         return (
                            <div key={payment.id} className="p-4 space-y-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-gray-800">{formatCurrency(payment.amount)}</p>
                                        <p className="text-sm text-gray-600">to <Link to={`/manage/trainers/${trainer?.id}`} className="font-semibold text-blue-600 hover:underline">{trainer?.firstName} {trainer?.lastName}</Link></p>
                                    </div>
                                    <p className="text-xs text-gray-500">{formatDate(payment.paymentDate)}</p>
                                </div>
                                <p className="text-xs text-gray-500 bg-gray-100 p-1 rounded-md inline-block">Settled: {periodText}</p>
                            </div>
                         );
                     })}
                 </div>

                 {/* Desktop View */}
                 <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-white border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trainer</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period(s) Settled</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredPayments.map((payment: Payment) => {
                                const trainer = getTrainer(payment.trainerId);
                                const periodText = payment.settledPeriods.length > 1
                                    ? <span title={payment.settledPeriods.map(p => p.periodString).join(', ')}>{payment.settledPeriods.length} periods</span>
                                    : payment.settledPeriods[0]?.periodString || 'N/A';
                                return (
                                    <tr key={payment.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(payment.paymentDate)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {trainer ? (
                                                <Link to={`/manage/trainers/${trainer.id}`} className="hover:text-blue-600">
                                                    {`${trainer.firstName} ${trainer.lastName}`}
                                                </Link>
                                            ) : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">{formatCurrency(payment.amount)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{periodText}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                 </div>
                 <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                />
            </Card>
        </div>
    );
};

export default PaymentHistoryPage;