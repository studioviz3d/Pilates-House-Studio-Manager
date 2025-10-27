
import React from 'react';
import Modal from '../ui/Modal';
import { PayoutCalculation, Customer, ClassType, Booking } from '../../types';
import { formatDateTime } from '../../utils';
import { FilePenLine, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PayoutDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    payout: PayoutCalculation | null;
    formatCurrency: (amount: number) => string;
    getCustomer: (id: string) => Customer | undefined;
    getClassType: (id: string) => ClassType | undefined;
    onEditSession: (booking: Booking) => void;
    onDeleteSession: (bookingId: string) => void;
}

const PayoutDetailsModal: React.FC<PayoutDetailsModalProps> = ({ 
    isOpen, onClose, payout, formatCurrency, getCustomer, getClassType, onEditSession, onDeleteSession
}) => {
    if (!isOpen || !payout) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Payout Details: ${payout.trainer.firstName} ${payout.trainer.lastName}`}>
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
                                                                    <button onClick={() => onEditSession(session)} title="Edit session" className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-md">
                                                                        <FilePenLine size={16} />
                                                                    </button>
                                                                    <button onClick={() => onDeleteSession(session.id)} title="Delete session" className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-md">
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
                 <div className="flex justify-end pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default PayoutDetailsModal;
