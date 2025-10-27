

import React, { useState, useMemo } from 'react';
import { useStudioData } from '../../hooks/useStudioData';
import { format } from 'date-fns/format';
import { endOfWeek } from 'date-fns/endOfWeek';
import { addWeeks } from 'date-fns/addWeeks';
import { isBefore } from 'date-fns/isBefore';
import { startOfWeek } from 'date-fns/startOfWeek';
import { startOfYear } from 'date-fns/startOfYear';
import { BookingStatus, Trainer, Payment, SettledPeriod, Booking, PayoutCalculation, Customer, ClassType } from '../../types';
import { Link } from 'react-router-dom';
import { 
    ChevronLeft, ChevronRight, History, Plus, ChevronDown, 
    Trash2, FilePenLine,
    DollarSign, CalendarCheck, CheckCircle
} from 'lucide-react';
import AdvancePaymentModal from '../../components/AdvancePaymentModal';
import KpiCard from '../../components/dashboard/KpiCard';
import Card from '../../components/ui/Card';
import BookingModal from '../../components/BookingModal';
import { formatDateTime } from '../../utils';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

const inputBaseClasses = "w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm";


const TrainerPaymentsPage: React.FC = () => {
    const { 
        trainers, bookings, payments, advancePayments, getClassType, 
        getCustomer, addPayment, formatCurrency, studioSettings, now, updateBooking 
    } = useStudioData();
    
    const [currentDate, setCurrentDate] = useState(now);
    const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
    const [expandedPayoutId, setExpandedPayoutId] = useState<string | null>(null);
    const [manualAdjustments, setManualAdjustments] = useState<Record<string, number>>({});
    
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const currentPeriodString = `Week of ${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'dd, yyyy')}`;

    const handlePrevWeek = () => setCurrentDate(prev => addWeeks(prev, -1));
    const handleNextWeek = () => setCurrentDate(prev => addWeeks(prev, 1));
    
    const handleAdjustmentChange = (trainerId: string, value: string) => {
        const amount = value === '' ? 0 : parseFloat(value);
        setManualAdjustments(prev => ({ ...prev, [trainerId]: isNaN(amount) ? 0 : amount }));
    };
    
    const handleEditSession = (booking: Booking) => {
        setSelectedBooking(booking);
        setIsBookingModalOpen(true);
    };

    const handleDeleteSession = (bookingId: string) => {
        setConfirmDelete(bookingId);
    };

    const trainerPayouts = useMemo<PayoutCalculation[]>(() => {
        const allSettledPeriodStrings = new Set(payments.flatMap(p => p.settledPeriods.map(sp => sp.periodString)));
        
        return trainers.map(trainer => {
            // 1. Calculate this week's earnings
            const thisWeekEarnings = bookings.filter(b => {
                const bookingDate = new Date(b.dateTime);
                return b.trainerId === trainer.id &&
                    bookingDate >= weekStart &&
                    bookingDate <= weekEnd &&
                    (b.status === BookingStatus.Completed || b.status === BookingStatus.CancelledLate);
            }).reduce((sum, b) => {
                const classType = getClassType(b.classTypeId);
                const trainerRate = trainer.paymentRates[b.classTypeId] || 0;
                if (!classType) return sum;
                const pricePerSession = classType.pricing[trainer.level]['1'] || 0;
                return sum + (pricePerSession * trainerRate);
            }, 0);
            
            // 2. Calculate balance brought forward from previous unpaid weeks
            let balanceBroughtForward = 0;
            const unpaidPeriods: { start: Date; end: Date; periodString: string }[] = [];
            let dateCursor = startOfWeek(startOfYear(now), { weekStartsOn: 1 });
            
            while(isBefore(dateCursor, weekStart)) {
                const periodStart = dateCursor;
                const periodEnd = endOfWeek(dateCursor, { weekStartsOn: 1 });
                const periodStr = `Week of ${format(periodStart, 'MMM dd')} - ${format(periodEnd, 'dd, yyyy')}`;
                
                if (!allSettledPeriodStrings.has(periodStr)) {
                     const periodEarnings = bookings.filter(b => {
                        const bookingDate = new Date(b.dateTime);
                        return b.trainerId === trainer.id &&
                            bookingDate >= periodStart &&
                            bookingDate <= periodEnd &&
                            (b.status === BookingStatus.Completed || b.status === BookingStatus.CancelledLate);
                    }).reduce((sum, b) => {
                        const classType = getClassType(b.classTypeId);
                        const trainerRate = trainer.paymentRates[b.classTypeId] || 0;
                        if (!classType) return sum;
                        const pricePerSession = classType.pricing[trainer.level]['1'] || 0;
                        return sum + (pricePerSession * trainerRate);
                    }, 0);

                    if (periodEarnings > 0) {
                        balanceBroughtForward += periodEarnings;
                        unpaidPeriods.push({ start: periodStart, end: periodEnd, periodString: periodStr });
                    }
                }
                dateCursor = addWeeks(dateCursor, 1);
            }
            
            // 3. Calculate advance deductions
            const advanceDeductions = advancePayments
                .filter(adv => adv.trainerId === trainer.id && !adv.isApplied)
                .reduce((sum, adv) => sum + adv.amount, 0);

            // 4. Final calculation
            const manualAdjustment = manualAdjustments[trainer.id] || 0;
            const totalDue = thisWeekEarnings + balanceBroughtForward + manualAdjustment - advanceDeductions;
            
            const isPeriodSettled = allSettledPeriodStrings.has(currentPeriodString);
            const paymentForPeriod = payments.find(p => p.trainerId === trainer.id && p.settledPeriods.some(sp => sp.periodString === currentPeriodString));
            
            // 5. Aggregate included sessions
            const includedSessions = (paymentForPeriod ? 
                bookings.filter(b => {
                    if (b.trainerId !== trainer.id || (b.status !== 'Completed' && b.status !== 'Cancelled - Late')) return false;
                    const bookingDate = new Date(b.dateTime);
                    return paymentForPeriod.settledPeriods.some(period => bookingDate >= period.start && bookingDate <= period.end);
                })
                :
                bookings.filter(b => {
                    if (b.trainerId !== trainer.id || (b.status !== 'Completed' && b.status !== 'Cancelled - Late')) return false;
                    const bookingDate = new Date(b.dateTime);
                    const isInCurrentWeek = bookingDate >= weekStart && bookingDate <= weekEnd;
                    const isInUnpaidPeriod = unpaidPeriods.some(p => bookingDate >= p.start && bookingDate <= p.end);
                    return isInCurrentWeek || isInUnpaidPeriod;
                 })
            ).sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
            
            const totalSessionEarnings = paymentForPeriod 
                ? (paymentForPeriod.earningsForPeriod || 0) + (paymentForPeriod.balanceBroughtForward || 0)
                : thisWeekEarnings + balanceBroughtForward;

            return {
                trainer,
                thisWeekEarnings,
                balanceBroughtForward,
                unpaidPeriods,
                advanceDeductions,
                totalDue,
                isSettled: isPeriodSettled,
                paymentRecord: paymentForPeriod,
                manualAdjustment,
                includedSessions,
                totalSessionEarnings,
            } as PayoutCalculation; // Cast to ensure type match
        });
    }, [trainers, bookings, payments, advancePayments, weekStart, weekEnd, currentPeriodString, getClassType, manualAdjustments, now]);

    const weeklyKpis = useMemo(() => {
        const totalDueThisWeek = trainerPayouts.reduce((sum, p) => !p.isSettled ? sum + p.totalDue : sum, 0);
        const totalPaidThisWeek = trainerPayouts.reduce((sum, p) => p.isSettled ? sum + p.paymentRecord!.amount : sum, 0);
        const totalSessionsThisWeek = trainerPayouts.reduce((sum, p) => {
            const sessionsInCurrentPeriod = p.includedSessions.filter(s => {
                const d = new Date(s.dateTime);
                return d >= weekStart && d <= weekEnd;
            }).length;
            return sum + sessionsInCurrentPeriod;
        }, 0);
        return { totalDueThisWeek, totalPaidThisWeek, totalSessionsThisWeek };
    }, [trainerPayouts, weekStart, weekEnd]);
    
    const handleLogPayment = (payout: PayoutCalculation) => {
        if(payout.totalDue <= 0) {
            alert("Cannot log a payment of zero or less.");
            return;
        }
        if (window.confirm(`Are you sure you want to log a payment of ${formatCurrency(payout.totalDue)} for ${payout.trainer.firstName}?`)) {
            const settledPeriods: SettledPeriod[] = [...payout.unpaidPeriods];
            
            // Settle the current period only if its net contribution to the payout is positive.
            // This prevents settling an empty week if the payment is only for past debt.
            if ((payout.thisWeekEarnings + payout.manualAdjustment) > 0) {
                settledPeriods.push({ start: weekStart, end: weekEnd, periodString: currentPeriodString });
            }

            addPayment({
                trainerId: payout.trainer.id,
                amount: payout.totalDue,
                paymentDate: new Date(),
                settledPeriods,
                balanceBroughtForward: payout.balanceBroughtForward,
                manualAdjustment: manualAdjustments[payout.trainer.id] || 0,
                advanceDeductionsTotal: payout.advanceDeductions,
                earningsForPeriod: payout.thisWeekEarnings,
            });
            // Clear manual adjustment after payment
            setManualAdjustments(prev => ({ ...prev, [payout.trainer.id]: 0 }));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <h2 className="text-3xl font-bold text-gray-800">Trainer Payments</h2>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-1 rounded-md border border-gray-300 bg-white p-1 shadow-sm">
                        <button onClick={handlePrevWeek} className="p-1.5 rounded-md hover:bg-gray-100">
                            <ChevronLeft size={18} className="text-gray-600"/>
                        </button>
                        <div className="text-sm font-semibold text-gray-700 text-center mx-2 whitespace-nowrap">{currentPeriodString}</div>
                        <button onClick={handleNextWeek} className="p-1.5 rounded-md hover:bg-gray-100">
                            <ChevronRight size={18} className="text-gray-600"/>
                        </button>
                    </div>
                     <button onClick={() => setIsAdvanceModalOpen(true)} className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700">
                        <Plus size={16} className="mr-1" /> Add Advance
                    </button>
                    <Link to="/financial/payout-history" className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-white border rounded-md shadow-sm hover:bg-gray-50">
                        <History size={16} className="mr-1" /> View History
                    </Link>
                </div>
            </div>

             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <KpiCard title="Total Payments Due" value={formatCurrency(weeklyKpis.totalDueThisWeek)} icon={DollarSign} />
                <KpiCard title="Total Paid This Week" value={formatCurrency(weeklyKpis.totalPaidThisWeek)} icon={CheckCircle} />
                <KpiCard title="Total Payable Sessions" value={weeklyKpis.totalSessionsThisWeek} icon={CalendarCheck} />
            </div>

            <div className="space-y-4">
                {trainerPayouts.map(payout => {
                    const isExpanded = expandedPayoutId === payout.trainer.id;
                    return (
                        <Card key={payout.trainer.id} className={`!p-0 transition-all duration-300 ${payout.isSettled ? 'bg-gray-50' : 'bg-white'}`}>
                            {/* Header */}
                            <div className="flex items-center justify-between p-4">
                                <div className="flex items-center">
                                    <img src={payout.trainer.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                                    <div className="ml-3">
                                        <h4 className="text-lg font-bold text-gray-800">{payout.trainer.firstName} {payout.trainer.lastName}</h4>
                                        <p className="text-sm font-medium text-gray-600 mt-1">
                                            Period Earnings:
                                            <span className="font-bold text-gray-800 ml-2">
                                                {formatCurrency(payout.isSettled ? (payout.paymentRecord?.earningsForPeriod || 0) : payout.thisWeekEarnings)}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">{payout.isSettled ? 'Amount Paid' : 'Total Due'}</p>
                                    <p className={`text-2xl font-bold ${payout.isSettled ? 'text-gray-600' : 'text-gray-900'}`}>{formatCurrency(payout.isSettled ? payout.paymentRecord!.amount : payout.totalDue)}</p>
                                </div>
                            </div>

                            {/* Sub-header / Status */}
                            <div className="px-4 pb-4 flex justify-between items-center border-b">
                                {payout.isSettled ? (
                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                        Paid on {format(new Date(payout.paymentRecord!.paymentDate), 'MMM dd, yyyy')}
                                    </span>
                                ) : (
                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                        Pending Payment
                                    </span>
                                )}
                                <button
                                    onClick={() => setExpandedPayoutId(isExpanded ? null : payout.trainer.id)}
                                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                                >
                                    <span>View Details</span>
                                    <ChevronDown size={16} className={`ml-1 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                            </div>

                            {/* Collapsible Details */}
                            {isExpanded && (
                                <div className="p-4 border-b bg-white animate-in fade-in duration-300">
                                    <div className="space-y-6">
                                        {payout.includedSessions.length > 0 && (
                                            <div>
                                                <h5 className="text-sm font-semibold text-gray-700 mb-2">
                                                    {payout.isSettled ? `Included Sessions (${payout.includedSessions.length})` : `Payable Sessions (${payout.includedSessions.length})`}
                                                </h5>
                                                <div className="border rounded-lg overflow-hidden">
                                                    <div className="max-h-64 overflow-y-auto">
                                                        <div className="overflow-x-auto">
                                                            <table className="min-w-full text-sm">
                                                                <thead className="bg-gray-100 text-xs text-gray-500 uppercase sticky top-0">
                                                                    <tr>
                                                                        <th className="px-4 py-2 font-medium text-left">Date</th>
                                                                        <th className="px-4 py-2 font-medium text-left">Customers</th>
                                                                        <th className="px-4 py-2 font-medium text-right">Earning</th>
                                                                        {!payout.isSettled && <th className="relative px-4 py-2"><span className="sr-only">Actions</span></th>}
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-200 bg-white">
                                                                    {payout.includedSessions.map(session => {
                                                                        const customers = session.customerIds.map(id => getCustomer(id)).filter(Boolean);
                                                                        const classType = getClassType(session.classTypeId);
                                                                        const sessionEarning = (classType?.pricing[payout.trainer.level]['1'] || 0) * (payout.trainer.paymentRates[session.classTypeId] || 0);
                                                                        return (
                                                                            <tr key={session.id}>
                                                                                <td className="px-4 py-2 whitespace-nowrap">{formatDateTime(session.dateTime)}</td>
                                                                                <td className="px-4 py-2">
                                                                                    {customers.map((c, i) => (
                                                                                        <React.Fragment key={c.id}>
                                                                                        <Link to={`/customers/${c.id}`} className="hover:text-blue-600">{`${c.firstName} ${c.lastName.charAt(0)}.`}</Link>
                                                                                        {i < customers.length - 1 && ', '}
                                                                                        </React.Fragment>
                                                                                    ))}
                                                                                </td>
                                                                                <td className="px-4 py-2 text-right font-medium text-gray-800">{formatCurrency(sessionEarning)}</td>
                                                                                {!payout.isSettled && (
                                                                                    <td className="px-4 py-2 text-right">
                                                                                        <div className="flex items-center justify-end gap-2">
                                                                                            <button onClick={() => handleEditSession(session)} title="Edit session" className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-md">
                                                                                                <FilePenLine size={16} />
                                                                                            </button>
                                                                                            <button onClick={() => handleDeleteSession(session.id)} title="Delete session" className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-md">
                                                                                                <Trash2 size={16} />
                                                                                            </button>
                                                                                        </div>
                                                                                    </td>
                                                                                )}
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                                <tfoot className="bg-gray-100">
                                                                    <tr>
                                                                        <td colSpan={payout.isSettled ? 2 : 3} className="px-4 py-2 text-right font-bold text-gray-600">Total Session Earnings</td>
                                                                        <td className="px-4 py-2 text-right font-bold text-gray-800">{formatCurrency(payout.totalSessionEarnings)}</td>
                                                                        {!payout.isSettled && <td />}
                                                                    </tr>
                                                                </tfoot>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-4 border-t">
                                            <div className="space-y-4">
                                                {payout.isSettled && payout.paymentRecord?.settledPeriods && (
                                                    <div>
                                                        <h5 className="text-sm font-semibold text-gray-700 mb-2">Period(s) Settled</h5>
                                                        <ul className="text-xs text-gray-600 list-disc list-inside bg-blue-50/50 p-3 rounded-md">
                                                            {payout.paymentRecord.settledPeriods.map(p => <li key={p.periodString}>{p.periodString}</li>)}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-2 text-sm bg-gray-100 p-4 rounded-lg self-start">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Total Session Earnings</span>
                                                    <span className="font-medium text-gray-800">{formatCurrency(payout.totalSessionEarnings)}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600">Manual Adjustment</span>
                                                    <span className="font-medium text-gray-800">{formatCurrency(payout.isSettled ? (payout.paymentRecord?.manualAdjustment || 0) : payout.manualAdjustment)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Advance Deductions</span>
                                                    <span className="font-medium text-red-600">-{formatCurrency(payout.isSettled ? (payout.paymentRecord?.advanceDeductionsTotal || 0) : payout.advanceDeductions)}</span>
                                                </div>
                                                <div className="!mt-4 pt-3 border-t flex justify-between font-bold text-lg text-gray-800">
                                                    <span>{payout.isSettled ? 'Total Paid' : 'Total Payout'}</span>
                                                    <span>{formatCurrency(payout.isSettled ? payout.paymentRecord!.amount : payout.totalDue)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!payout.isSettled && (
                                <div className="p-4 bg-gray-50/70">
                                    <div className="flex items-center justify-end gap-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm mr-2 text-gray-600">Manual Adjustment:</span>
                                            <div className="relative w-32">
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                    <span className="text-gray-500 sm:text-sm">{studioSettings.currencySymbol}</span>
                                                </div>
                                                <input 
                                                    type="number" 
                                                    value={manualAdjustments[payout.trainer.id] || ''} 
                                                    onChange={e => handleAdjustmentChange(payout.trainer.id, e.target.value)} 
                                                    placeholder="0.00" 
                                                    className={`${inputBaseClasses} pl-7 text-right`} 
                                                />
                                            </div>
                                        </div>
                                        <button onClick={() => handleLogPayment(payout)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 disabled:bg-gray-400" disabled={payout.totalDue <= 0}>
                                            Log Payment
                                        </button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>
            
            <AdvancePaymentModal isOpen={isAdvanceModalOpen} onClose={() => setIsAdvanceModalOpen(false)} />
            <BookingModal
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
                booking={selectedBooking}
                selectedDateTime={null}
            />
             <ConfirmationModal
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={() => {
                    if (confirmDelete) {
                        updateBooking(confirmDelete, { status: BookingStatus.Deleted });
                    }
                }}
                title="Delete Session"
                confirmText="Delete"
            >
                Are you sure you want to delete this session? This will remove it from the calendar and cannot be undone.
            </ConfirmationModal>
        </div>
    );
};

export default TrainerPaymentsPage;