

import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStudioData } from '../../hooks/useStudioData';
import Card from '../components/ui/Card';
import { Mail, Phone, Edit, Calendar, Star, BarChart3, Users, DollarSign, ListFilter } from 'lucide-react';
import { BookingStatus, Booking, ClassType } from '../types';
import { formatPhoneNumber, formatDateTime } from '../utils';
import TrainerModal from '../components/TrainerModal';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/ui/Pagination';
import DateRangePicker from '../components/ui/DateRangePicker';
import { endOfDay } from 'date-fns/endOfDay';
import KpiCard from '../components/dashboard/KpiCard';
import TrainerActivityByDay from '../components/reporting/TrainerActivityByDay';
import TrainerSessionBreakdown from '../components/reporting/TrainerSessionBreakdown';
import TopCustomersList from '../components/reporting/TopCustomersList';
import Select, { SelectOption } from '../components/ui/Select';

const statusColors: Record<BookingStatus, string> = {
    [BookingStatus.Booked]: 'bg-blue-100 text-blue-700',
    [BookingStatus.Completed]: 'bg-green-100 text-green-700',
    [BookingStatus.Cancelled]: 'bg-gray-100 text-gray-700',
    [BookingStatus.CancelledLate]: 'bg-yellow-100 text-yellow-700',
    [BookingStatus.Deleted]: 'bg-red-100 text-red-700',
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-t-md border-b-2 ${
            active ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
        }`}
    >
        {children}
    </button>
);


const TrainerDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { getTrainer, bookings, getClassType, formatCurrency, getCustomer, classTypes } = useStudioData();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'history'>('overview');
    
    const trainer = useMemo(() => getTrainer(id), [getTrainer, id]);

    // --- State for Performance Tab ---
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
        from: new Date('2025-01-01'),
        to: new Date('2025-12-31'),
    });
    
    // --- State for Session History Tab ---
    const [historyFilter, setHistoryFilter] = useState<{ classType: string; status: string }>({ classType: 'all', status: 'all' });
    const [historySort, setHistorySort] = useState<'newest' | 'oldest'>('newest');

    const filteredBookings = useMemo(() => {
        if (!id) return [];
        const { from, to } = dateRange;
        const periodEnd = endOfDay(to);
        return bookings.filter(b => 
            b.trainerId === id &&
            new Date(b.dateTime).getTime() >= from.getTime() &&
            new Date(b.dateTime).getTime() <= periodEnd.getTime()
        );
    }, [bookings, id, dateRange]);

    const performanceData = useMemo(() => {
        if (!trainer) return { sessionsTaught: 0, totalEarnings: 0, uniqueCustomers: 0 };
        const completedBookings = filteredBookings.filter(b => b.status === BookingStatus.Completed || b.status === BookingStatus.CancelledLate);
        
        const totalEarnings = completedBookings.reduce((sum: number, b) => {
            const classType = getClassType(b.classTypeId);
            const rate = trainer.paymentRates[b.classTypeId] || 0;
            if (!classType) return sum;
            const pricePerSession = classType.pricing[trainer.level]['1'] || 0;
            return sum + (pricePerSession * rate);
        }, 0);

        const uniqueCustomers = new Set(completedBookings.flatMap(b => b.customerIds)).size;

        return { sessionsTaught: completedBookings.length, totalEarnings, uniqueCustomers };
    }, [filteredBookings, trainer, getClassType]);

    const sessionHistoryData = useMemo(() => {
        if (!id) return [];
        return bookings
            .filter(b => {
                const typeMatch = historyFilter.classType === 'all' || b.classTypeId === historyFilter.classType;
                const statusMatch = historyFilter.status === 'all' || b.status === historyFilter.status;
                return b.trainerId === id && b.status !== BookingStatus.Booked && b.status !== BookingStatus.Deleted && typeMatch && statusMatch;
            })
            .sort((a, b) => {
                const dateA = new Date(a.dateTime).getTime();
                const dateB = new Date(b.dateTime).getTime();
                return historySort === 'newest' ? dateB - dateA : dateA - dateB;
            });
    }, [bookings, id, historyFilter, historySort]);

    const { currentPageData: paginatedHistory, currentPage, totalPages, setCurrentPage } = usePagination(sessionHistoryData, 10);
    
    const classTypeOptions: SelectOption[] = [{ value: 'all', label: 'All Class Types' }, ...classTypes.map(ct => ({ value: ct.id, label: ct.name }))];
    const statusOptions: SelectOption[] = [
        { value: 'all', label: 'All Statuses' },
        { value: BookingStatus.Completed, label: 'Completed' },
        { value: BookingStatus.Cancelled, label: 'Cancelled' },
        { value: BookingStatus.CancelledLate, label: 'Cancelled - Late' },
    ];
    const sortOptions: SelectOption[] = [{ value: 'newest', label: 'Newest First' }, { value: 'oldest', label: 'Oldest First' }];


    if (!trainer) {
        return (
            <div className="text-center py-10">
                <h2 className="text-2xl font-bold text-gray-700">Trainer not found</h2>
                <Link to="/manage/trainers" className="text-blue-600 hover:underline mt-4 inline-block">Back to Trainers List</Link>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="flex items-center space-x-4">
                        <img className="h-16 w-16 rounded-full object-cover" src={trainer.avatarUrl} alt="" />
                        <div>
                            <h2 className="text-3xl font-bold text-gray-800">{`${trainer.firstName} ${trainer.lastName}`}</h2>
                            <p className="text-md text-gray-500">{trainer.specialization}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Link to={`/manage/trainers/${trainer.id}/schedule`} className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                            <Calendar size={16} className="mr-2" /> View Schedule
                        </Link>
                        <button onClick={() => setIsEditModalOpen(true)} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">
                            <Edit size={16} className="mr-2" /> Edit Trainer
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                 <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-6">
                        <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>Overview</TabButton>
                        <TabButton active={activeTab === 'performance'} onClick={() => setActiveTab('performance')}>Performance</TabButton>
                        <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')}>Session History</TabButton>
                    </nav>
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
                        <div className="lg:col-span-1 space-y-8">
                            <Card>
                                <h3 className="text-lg font-semibold text-gray-700 mb-4">Contact & Info</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center space-x-3"><Mail className="w-5 h-5 text-gray-400"/><span className="text-gray-700">{trainer.email}</span></div>
                                    <div className="flex items-center space-x-3"><Phone className="w-5 h-5 text-gray-400"/><span className="text-gray-700">{formatPhoneNumber(trainer.phone)}</span></div>
                                    <div className="flex items-center space-x-3"><Star className="w-5 h-5 text-gray-400"/><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${trainer.level === 'Master' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>{trainer.level} Trainer</span></div>
                                </div>
                            </Card>
                             <Card>
                                <h3 className="text-lg font-semibold text-gray-700 mb-4">Payment Rates</h3>
                                <ul className="space-y-2 text-sm">
                                    {Object.entries(trainer.paymentRates).map(([classTypeId, rate]: [string, number]) => (
                                        <li key={classTypeId} className="flex justify-between"><span className="text-gray-600">{getClassType(classTypeId)?.name || 'N/A'}</span><span className="font-semibold text-gray-800">{Math.round(rate * 100)}%</span></li>
                                    ))}
                                </ul>
                            </Card>
                        </div>
                        <div className="lg:col-span-2">
                             <TopCustomersList bookings={filteredBookings} />
                        </div>
                    </div>
                )}
                
                {activeTab === 'performance' && (
                     <div className="space-y-8 animate-in fade-in duration-300">
                        <Card>
                             <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
                                <h3 className="text-lg font-semibold text-gray-700">Performance Metrics</h3>
                                <DateRangePicker range={dateRange} onRangeChange={setDateRange} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                               <KpiCard title="Sessions Taught" value={performanceData.sessionsTaught} icon={BarChart3} />
                               <KpiCard title="Est. Earnings" value={formatCurrency(performanceData.totalEarnings)} icon={DollarSign} />
                               <KpiCard title="Unique Customers" value={performanceData.uniqueCustomers} icon={Users} />
                            </div>
                        </Card>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                           <TrainerSessionBreakdown bookings={filteredBookings} />
                           <TrainerActivityByDay bookings={filteredBookings} />
                        </div>
                    </div>
                )}
                
                {activeTab === 'history' && (
                    <Card className="!p-0 animate-in fade-in duration-300">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 p-6 border-b">
                            <h3 className="text-lg font-semibold text-gray-700">Full Session History</h3>
                             <div className="flex items-center gap-4">
                                <ListFilter size={18} className="text-gray-500" />
                                <div className="w-48"><Select options={classTypeOptions} value={historyFilter.classType} onChange={(val) => setHistoryFilter(f => ({...f, classType: val}))} /></div>
                                <div className="w-48"><Select options={statusOptions} value={historyFilter.status} onChange={(val) => setHistoryFilter(f => ({...f, status: val}))} /></div>
                                <div className="w-48"><Select options={sortOptions} value={historySort} onChange={(val) => setHistorySort(val as 'newest' | 'oldest')} /></div>
                            </div>
                        </div>
                        {/* Mobile View */}
                        <div className="md:hidden divide-y divide-gray-200">
                            {paginatedHistory.map((booking: Booking) => (
                                <div key={booking.id} className="p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold">{formatDateTime(booking.dateTime)}</p>
                                            <p className="text-sm text-gray-600">{getClassType(booking.classTypeId)?.name || 'N/A'}</p>
                                            <p className="text-sm text-gray-500">{booking.customerIds.map(id => getCustomer(id)?.firstName).filter(Boolean).join(', ')}</p>
                                        </div>
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[booking.status]}`}>{booking.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Desktop View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-white"><tr className="border-b"><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customers</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th></tr></thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedHistory.map((booking: Booking) => (
                                        <tr key={booking.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{formatDateTime(booking.dateTime)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getClassType(booking.classTypeId)?.name || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.customerIds.map(id => getCustomer(id)?.firstName).filter(Boolean).join(', ')}</td>
                                            <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[booking.status]}`}>{booking.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {paginatedHistory.length === 0 && (<div className="px-6 py-4 text-center text-sm text-gray-500">No session history matching filters.</div>)}
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage}/>
                    </Card>
                )}

            </div>
            <TrainerModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} trainer={trainer}/>
        </>
    );
};

export default TrainerDetailPage;