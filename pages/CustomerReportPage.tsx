

import React, { useState, useMemo } from 'react';
import { useStudioData } from '../hooks/useStudioData';
import { Booking, BookingStatus } from '../types';
import DateRangePicker from '../components/ui/DateRangePicker';
import Card from '../components/ui/Card';
import KpiCard from '../components/dashboard/KpiCard';
import { Users, UserPlus, CalendarCheck, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Link } from 'react-router-dom';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/ui/Pagination';
import { formatDate } from '../utils';
// FIX: Consolidated `date-fns` imports.
import { isWithinInterval } from 'date-fns/isWithinInterval';
import { endOfDay } from 'date-fns/endOfDay';
import { startOfDay } from 'date-fns/startOfDay';


const PIE_COLORS = ['#3b82f6', '#93c5fd'];

// FIX: Define a type for the report data metric to ensure type safety.
type CustomerMetric = {
    id: string;
    avatarUrl: string;
    firstName: string;
    lastName: string;
    email: string;
    totalSessions: number;
    lastActivityDate: Date | null;
    isNew: boolean;
};


const CustomerReportPage: React.FC = () => {
    const { customers, bookings: allBookings, now } = useStudioData();

    const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
        from: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: endOfDay(now),
    });

    const reportData = useMemo(() => {
        const { from, to } = dateRange;
        const periodEnd = endOfDay(to);

        const bookingsInPeriod = allBookings.filter(b => {
            const bookingDate = new Date(b.dateTime);
            return bookingDate >= from && bookingDate <= periodEnd && (b.status === BookingStatus.Completed || b.status === BookingStatus.CancelledLate);
        });

        const activeCustomerIds = new Set(bookingsInPeriod.flatMap(b => b.customerIds));

        const customerFirstBookingDate: Record<string, Date> = {};
        const sortedAllBookings = [...allBookings]
            .filter(b => b.status === BookingStatus.Completed || b.status === BookingStatus.CancelledLate)
            .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

        // FIX: Replaced for...of with forEach and added explicit types to resolve type inference issues.
        sortedAllBookings.forEach((booking: Booking) => {
            booking.customerIds.forEach((customerId: string) => {
                if (!customerFirstBookingDate[customerId]) {
                    customerFirstBookingDate[customerId] = new Date(booking.dateTime);
                }
            });
        });

        const newCustomerIds = new Set<string>();
        // FIX: Add explicit type to `id` to resolve type inference issues.
        activeCustomerIds.forEach((id: string) => {
            if (customerFirstBookingDate[id] && isWithinInterval(customerFirstBookingDate[id], { start: from, end: periodEnd })) {
                newCustomerIds.add(id);
            }
        });

        const totalActiveCustomers = activeCustomerIds.size;
        const totalNewCustomers = newCustomerIds.size;
        // FIX: Explicitly type the accumulator to prevent 'unknown' type errors.
        const totalSessionsCompleted = bookingsInPeriod.reduce((acc: number, b) => acc + b.customerIds.length, 0);
        const avgSessionsPerCustomer = totalActiveCustomers > 0 ? totalSessionsCompleted / totalActiveCustomers : 0;
        const returningCustomers = totalActiveCustomers - totalNewCustomers;

        const customerSessionCounts: Record<string, number> = {};
        // FIX: Add explicit types to forEach callbacks to resolve type inference issues.
        bookingsInPeriod.forEach((b: Booking) => {
            b.customerIds.forEach((id: string) => {
                customerSessionCounts[id] = (customerSessionCounts[id] || 0) + 1;
            });
        });

        const mostFrequentVisitors = Object.entries(customerSessionCounts)
            .map(([customerId, sessionCount]) => ({
                customer: customers.find(c => c.id === customerId),
                sessionCount
            }))
            .filter(item => item.customer)
            .sort((a, b) => b.sessionCount - a.sessionCount)
            .slice(0, 5);

        // FIX: Add explicit type to `id` in map callback to resolve type inference issues.
        const tableData: CustomerMetric[] = Array.from(activeCustomerIds).map((id: string) => {
            const customer = customers.find(c => c.id === id);
            const sessionsInPeriod = customerSessionCounts[id] || 0;
            const customerBookings = allBookings.filter(b => b.customerIds.includes(id) && (b.status === BookingStatus.Completed || b.status === BookingStatus.CancelledLate));
            const lastActivityDate = customerBookings.length > 0 ? new Date(Math.max(...customerBookings.map(b => new Date(b.dateTime).getTime()))) : null;

            return {
                ...(customer || {id, firstName: 'Unknown', lastName: 'Customer', email: '', avatarUrl: ''}),
                totalSessions: sessionsInPeriod,
                lastActivityDate,
                isNew: newCustomerIds.has(id)
            };
        });

        return {
            kpis: {
                activeCustomers: totalActiveCustomers,
                newCustomers: totalNewCustomers,
                totalSessionsCompleted,
                avgSessionsPerCustomer,
            },
            charts: {
                newVsReturning: [
                    { name: 'New Customers', value: totalNewCustomers },
                    { name: 'Returning Customers', value: returningCustomers },
                ]
            },
            leaderboards: {
                mostFrequent: mostFrequentVisitors,
            },
            tableData,
        };
    }, [dateRange, allBookings, customers]);
    
    const { currentPageData, currentPage, totalPages, setCurrentPage, itemsPerPage, totalItems } = usePagination(reportData.tableData, 10);

    return (
        <div className="space-y-8">
             <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <h2 className="text-3xl font-bold text-gray-800">Customer Report</h2>
                <DateRangePicker range={dateRange} onRangeChange={setDateRange} />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard title="Active Customers" value={reportData.kpis.activeCustomers} icon={Users} />
                <KpiCard title="New Customers" value={reportData.kpis.newCustomers} icon={UserPlus} />
                <KpiCard title="Total Sessions" value={reportData.kpis.totalSessionsCompleted} icon={CalendarCheck} />
                <KpiCard title="Avg. Sessions / Customer" value={reportData.kpis.avgSessionsPerCustomer.toFixed(2)} icon={BarChart3} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-1">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">New vs. Returning</h3>
                    <div style={{ width: '100%', height: 250 }}>
                         {reportData.kpis.activeCustomers > 0 ? (
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={reportData.charts.newVsReturning} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                        {reportData.charts.newVsReturning.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">No data for this period.</div>
                        )}
                    </div>
                </Card>
                <Card className="lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Most Active Customers</h3>
                     {reportData.leaderboards.mostFrequent.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                            {reportData.leaderboards.mostFrequent.map(({ customer, sessionCount }) => (
                                customer && (
                                    <li key={customer.id} className="py-3">
                                        <div className="flex items-center justify-between">
                                            <Link to={`/manage/customers/${customer.id}`} className="flex items-center group">
                                                <img className="h-10 w-10 rounded-full object-cover" src={customer.avatarUrl} alt="" />
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                                                        {customer.firstName} {customer.lastName}
                                                    </p>
                                                </div>
                                            </Link>
                                            <div className="text-sm font-semibold text-gray-800">
                                                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                                                    {sessionCount} Session{sessionCount > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </li>
                                )
                            ))}
                        </ul>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 py-10">
                            <Users size={40} className="mb-2 text-gray-400"/>
                            <p>No customer activity in this period.</p>
                        </div>
                    )}
                </Card>
            </div>

            <Card className="!p-0">
                <h3 className="text-lg font-semibold text-gray-700 p-6">Detailed Customer Breakdown</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                         <thead className="bg-white border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sessions in Period</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Activity</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                         <tbody className="bg-white divide-y divide-gray-200">
                            {/* FIX: Add explicit type to resolve type inference issue. */}
                            {currentPageData.map((metric: CustomerMetric) => (
                                <tr key={metric.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Link to={`/manage/customers/${metric.id}`} className="flex items-center group">
                                            <img className="h-10 w-10 rounded-full object-cover" src={metric.avatarUrl} alt="" />
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600">{metric.firstName} {metric.lastName}</div>
                                                <div className="text-sm text-gray-500">{metric.email}</div>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-800">{metric.totalSessions}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{metric.lastActivityDate ? formatDate(metric.lastActivityDate) : 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {metric.isNew ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">New</span>
                                        ) : (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Returning</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                             {currentPageData.length === 0 && (
                                <tr><td colSpan={4} className="text-center py-10 text-gray-500">No customer data for this period.</td></tr>
                            )}
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

export default CustomerReportPage;