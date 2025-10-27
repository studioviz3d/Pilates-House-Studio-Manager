
import React, { useState, useMemo, useEffect } from 'react';
import { useStudioData } from '../../hooks/useStudioData';
import Card from '../components/ui/Card';
import { formatDate } from '../../utils';
import { Link, useSearchParams } from 'react-router-dom';
import DateRangePicker from '../components/ui/DateRangePicker';
// FIX: Corrected date-fns import for startOfDay and consolidated imports.
import { endOfDay, startOfDay } from 'date-fns';
import Select, { SelectOption } from '../components/ui/Select';
import { CustomerPayment, PaymentMethod, SessionDebt } from '../types';
import KpiCard from '../components/dashboard/KpiCard';
import { DollarSign, ReceiptText, TrendingUp, AlertTriangle } from 'lucide-react';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/ui/Pagination';
import SettleDebtModal from '../components/SettleDebtModal';

type PaymentWithDetails = CustomerPayment & {
    customerName: string;
    packageDetails: string;
};

type DebtWithDetails = SessionDebt & {
    customerName: string;
    debtDetails: string;
};

const PaymentMethodTag: React.FC<{ method: PaymentMethod }> = ({ method }) => {
    const styleMap: Record<PaymentMethod, string> = {
        'Credit Card': 'bg-blue-100 text-blue-800',
        'Cash': 'bg-green-100 text-green-800',
        'Bank Transfer': 'bg-yellow-100 text-yellow-800',
    };
    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${styleMap[method] || 'bg-gray-100 text-gray-800'}`}>
            {method}
        </span>
    );
};

const CustomerPaymentsPage: React.FC = () => {
    const { customerPayments, customers, getClassType, formatCurrency, sessionDebts, bookings, getTrainer } = useStudioData();
    const [searchParams, setSearchParams] = useSearchParams();

    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'history');
    const [selectedCustomer, setSelectedCustomer] = useState(searchParams.get('customer') || 'all');
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
        from: new Date('2025-01-01'),
        to: new Date('2025-12-31'),
    });
    const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
    const [selectedDebt, setSelectedDebt] = useState<SessionDebt | null>(null);

    useEffect(() => {
        setSearchParams({ tab: activeTab, customer: selectedCustomer });
    }, [activeTab, selectedCustomer, setSearchParams]);

    const handleOpenSettleModal = (debt: SessionDebt) => {
        setSelectedDebt(debt);
        setIsSettleModalOpen(true);
    };

    const allPackages = useMemo(() => customers.flatMap(c => c.packages), [customers]);

    const enrichedPayments = useMemo<PaymentWithDetails[]>(() => {
        return customerPayments.map(payment => {
            const customer = customers.find(c => c.id === payment.customerId);
            const pkg = allPackages.find(p => p.id === payment.packageId);
            const classType = pkg ? getClassType(pkg.classTypeId) : null;
            const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'N/A';
            const packageDetails = pkg && classType ? `${pkg.totalSessions}x ${classType.name} (${pkg.trainerLevel})` : 'N/A';
            return { ...payment, customerName, packageDetails };
        });
    }, [customerPayments, customers, allPackages, getClassType]);

    const filteredPaymentsData = useMemo(() => {
        return enrichedPayments.filter(p => {
            const dateMatch = new Date(p.date) >= startOfDay(dateRange.from) && new Date(p.date) <= endOfDay(dateRange.to);
            const customerMatch = selectedCustomer === 'all' || p.customerId === selectedCustomer;
            return dateMatch && customerMatch;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [enrichedPayments, dateRange, selectedCustomer]);

    const { currentPageData: paginatedPayments, currentPage: paymentsCurrentPage, totalPages: paymentsTotalPages, setCurrentPage: setPaymentsCurrentPage } = usePagination(filteredPaymentsData, 10);

    const enrichedDebts = useMemo<DebtWithDetails[]>(() => {
        return sessionDebts.filter(debt => !debt.isResolved).map(debt => {
            const customer = customers.find(c => c.id === debt.customerId);
            const classType = getClassType(debt.classTypeId);
            const booking = bookings.find(b => b.id === debt.bookingId);
            const trainer = getTrainer(booking?.trainerId || '');
            const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'N/A';
            const debtDetails = classType ? `${classType.name} w/ ${trainer?.firstName || 'N/A'}` : 'N/A';
            return { ...debt, customerName, debtDetails };
        });
    }, [sessionDebts, customers, getClassType, bookings, getTrainer]);

    const filteredDebtsData = useMemo(() => {
        return enrichedDebts.filter(d => selectedCustomer === 'all' || d.customerId === selectedCustomer)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [enrichedDebts, selectedCustomer]);

    const { currentPageData: paginatedDebts, currentPage: debtsCurrentPage, totalPages: debtsTotalPages, setCurrentPage: setDebtsCurrentPage } = usePagination(filteredDebtsData, 10);

    const kpis = useMemo(() => {
        const totalRevenue = filteredPaymentsData.reduce((sum, p) => sum + p.amount, 0);
        const totalPayments = filteredPaymentsData.length;
        const avgPayment = totalPayments > 0 ? totalRevenue / totalPayments : 0;
        const totalDebtCount = enrichedDebts.length;
        return { totalRevenue, totalPayments, avgPayment, totalDebtCount };
    }, [filteredPaymentsData, enrichedDebts]);

    const customerOptions: SelectOption[] = useMemo(() => ([
        { value: 'all', label: 'All Customers' },
        ...customers.map(c => ({ value: c.id, label: `${c.firstName} ${c.lastName}` }))
    ]), [customers]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <h2 className="text-3xl font-bold text-gray-800">Customer Payments</h2>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    {activeTab === 'history' && <DateRangePicker range={dateRange} onRangeChange={setDateRange} />}
                    <div className="w-full sm:w-56">
                        <Select options={customerOptions} value={selectedCustomer} onChange={setSelectedCustomer} searchable labelPrefix="Customer:" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard title="Total Revenue" value={formatCurrency(kpis.totalRevenue)} icon={TrendingUp} />
                <KpiCard title="Total Payments" value={kpis.totalPayments} icon={ReceiptText} />
                <KpiCard title="Avg. Payment" value={formatCurrency(kpis.avgPayment)} icon={DollarSign} />
                <KpiCard title="Open Debts" value={kpis.totalDebtCount} icon={AlertTriangle} />
            </div>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6">
                    <button onClick={() => setActiveTab('history')} className={`px-4 py-2 text-sm font-semibold border-b-2 ${activeTab === 'history' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}>Payment History</button>
                    <button onClick={() => setActiveTab('debts')} className={`px-4 py-2 text-sm font-semibold border-b-2 relative ${activeTab === 'debts' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}>
                        Session Debts
                        {kpis.totalDebtCount > 0 && <span className="ml-2 px-2 py-0.5 text-xs font-bold text-red-100 bg-red-600 rounded-full">{kpis.totalDebtCount}</span>}
                    </button>
                </nav>
            </div>

            {activeTab === 'history' && (
                <Card className="!p-0">
                    {/* Mobile View */}
                    <div className="md:hidden divide-y divide-gray-200">
                        {paginatedPayments.map((payment: PaymentWithDetails) => (
                            <div key={payment.id} className="p-4 space-y-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-gray-800">{formatCurrency(payment.amount)}</p>
                                        <Link to={`/manage/customers/${payment.customerId}`} className="text-sm font-semibold text-blue-600 hover:underline">{payment.customerName}</Link>
                                    </div>
                                    <p className="text-xs text-gray-500">{formatDate(payment.date)}</p>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <p className="text-gray-500 bg-gray-100 p-1 rounded-md">{payment.packageDetails}</p>
                                    <PaymentMethodTag method={payment.method} />
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-white border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Package Details</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedPayments.map((payment: PaymentWithDetails) => (
                                    <tr key={payment.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(payment.date)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><Link to={`/manage/customers/${payment.customerId}`} className="text-gray-900 hover:text-blue-600">{payment.customerName}</Link></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">{formatCurrency(payment.amount)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.packageDetails}</td>
                                        <td className="px-6 py-4 whitespace-nowrap"><PaymentMethodTag method={payment.method} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination currentPage={paymentsCurrentPage} totalPages={paymentsTotalPages} onPageChange={setPaymentsCurrentPage} />
                </Card>
            )}
            {activeTab === 'debts' && (
                <Card className="!p-0">
                    {/* Mobile View */}
                    <div className="md:hidden divide-y divide-gray-200">
                        {paginatedDebts.map((debt: DebtWithDetails) => (
                             <div key={debt.id} className="p-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <Link to={`/manage/customers/${debt.customerId}`} className="text-sm font-semibold text-blue-600 hover:underline">{debt.customerName}</Link>
                                        <p className="text-sm text-gray-600">{debt.debtDetails}</p>
                                        <p className="text-xs text-gray-500">From: {formatDate(debt.date)}</p>
                                    </div>
                                    <button onClick={() => handleOpenSettleModal(debt)} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700">Settle</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-white border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date of Session</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owed Session</th>
                                    <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedDebts.map((debt: DebtWithDetails) => (
                                    <tr key={debt.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(debt.date)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><Link to={`/manage/customers/${debt.customerId}`} className="text-gray-900 hover:text-blue-600">{debt.customerName}</Link></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{debt.debtDetails}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleOpenSettleModal(debt)} className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700">Settle Debt</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination currentPage={debtsCurrentPage} totalPages={debtsTotalPages} onPageChange={setDebtsCurrentPage} />
                </Card>
            )}
            {selectedDebt && <SettleDebtModal isOpen={isSettleModalOpen} onClose={() => setIsSettleModalOpen(false)} debt={selectedDebt} />}
        </div>
    );
};

export default CustomerPaymentsPage;
