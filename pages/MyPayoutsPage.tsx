import React, { useMemo } from 'react';
import { useStudioData } from '../hooks/useStudioData';
import Card from '../components/ui/Card';
import { formatDate } from '../utils';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/ui/Pagination';
import { Payment } from '../types';
import Spinner from '../components/ui/Spinner';

const MyPayoutsPage: React.FC = () => {
    const { payments, formatCurrency, loggedInTrainer } = useStudioData();

    const myPayments = useMemo(() => {
        if (!loggedInTrainer) return [];
        return payments
            .filter(p => p.trainerId === loggedInTrainer.id)
            .sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
    }, [payments, loggedInTrainer]);

    const {
        currentPageData: paginatedPayments,
        currentPage,
        totalPages,
        setCurrentPage,
        itemsPerPage,
        totalItems
    } = usePagination(myPayments, 10);

    if (!loggedInTrainer) {
        return <div className="flex items-center justify-center h-full"><Spinner /></div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">My Payouts</h2>
            
            <Card className="!p-0">
                 <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-white border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Date</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period(s) Settled</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedPayments.map((payment: Payment) => {
                                const periodText = payment.settledPeriods.length > 1
                                    ? <span title={payment.settledPeriods.map(p => p.periodString).join(', ')}>{payment.settledPeriods.length} periods</span>
                                    : payment.settledPeriods[0]?.periodString || 'N/A';
                                return (
                                    <tr key={payment.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(payment.paymentDate)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">{formatCurrency(payment.amount)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{periodText}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                 </div>
                 {paginatedPayments.length === 0 && (
                     <div className="text-center py-10 text-gray-500">
                         You have no payment history yet.
                     </div>
                 )}
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

export default MyPayoutsPage;
