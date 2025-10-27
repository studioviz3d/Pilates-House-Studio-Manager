import React, { useState, useMemo, useEffect } from 'react';
import { SessionDebt, PaymentMethod, TrainerLevel } from '../types';
import Modal from './ui/Modal';
import { useStudioData } from '../hooks/useStudioData';
import Select, { SelectOption } from './ui/Select';
import { addMonths } from 'date-fns';
import { formatDate } from '../utils';

interface SettleDebtModalProps {
    isOpen: boolean;
    onClose: () => void;
    debt: SessionDebt;
}

const inputBaseClasses = "w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm";


const SettleDebtModal: React.FC<SettleDebtModalProps> = ({ isOpen, onClose, debt }) => {
    const { 
        getCustomer, 
        getClassType, 
        addPackage,
        studioSettings,
        classTypes,
    } = useStudioData();

    // State for new package purchase
    const [packageForm, setPackageForm] = useState({
        totalSessions: '10',
        customSessions: 1,
        price: 0,
        paymentMethod: studioSettings.paymentMethods[0] || 'Credit Card' as PaymentMethod,
    });
    
    const customer = useMemo(() => getCustomer(debt.customerId), [debt.customerId, getCustomer]);
    const classType = useMemo(() => getClassType(debt.classTypeId), [debt.classTypeId, getClassType]);

    // Auto-update price for new package
    useEffect(() => {
        if (classType && packageForm.totalSessions !== 'other') {
            const sessionKey = packageForm.totalSessions as '1' | '5' | '10';
            const newPrice = classType.pricing[debt.trainerLevel][sessionKey];
            setPackageForm(p => ({ ...p, price: newPrice || 0 }));
        }
    }, [classType, debt.trainerLevel, packageForm.totalSessions]);


    useEffect(() => {
        if(isOpen) {
            setPackageForm(prev => ({
                ...prev,
                totalSessions: '10',
                customSessions: 1,
                paymentMethod: studioSettings.paymentMethods[0] || 'Credit Card'
            }));
        }
    }, [isOpen, studioSettings.paymentMethods]);

    const handlePurchaseAndSettle = () => {
        const finalTotalSessions = packageForm.totalSessions === 'other' ? packageForm.customSessions : Number(packageForm.totalSessions);
        if (finalTotalSessions <= 0) {
            alert("Number of sessions must be greater than 0.");
            return;
        }

        const newPackageData = {
            classTypeId: debt.classTypeId,
            trainerLevel: debt.trainerLevel,
            price: packageForm.price,
            totalSessions: finalTotalSessions,
            sessionsRemaining: finalTotalSessions,
            purchaseDate: new Date(),
            expirationDate: addMonths(new Date(), 3),
            isArchived: false,
        };

        addPackage(debt.customerId, newPackageData, packageForm.paymentMethod);
        onClose();
    };
    
    const paymentMethodOptions: SelectOption[] = useMemo(() => 
        studioSettings.paymentMethods.map(method => ({ value: method, label: method })),
    [studioSettings.paymentMethods]);
    
     const sessionOptions: SelectOption[] = [
        { value: '1', label: '1 Session' },
        { value: '5', label: '5 Sessions' },
        { value: '10', label: '10 Sessions' },
        { value: 'other', label: 'Other...' },
    ];

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Settle Debt for ${customer?.firstName}`}>
            <div className="space-y-4">
                <p className="text-sm text-gray-600">
                    Owed session: <span className="font-semibold">{classType?.name} ({debt.trainerLevel})</span> from <span className="font-semibold">{formatDate(debt.date)}</span>.
                </p>
                <div className="space-y-4 pt-2">
                     <p className="text-sm text-blue-700 bg-blue-50 p-3 rounded-md">
                        Upon purchase, <span className="font-bold">1 session</span> will be immediately deducted from this new package to settle the debt.
                     </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Class Type</label>
                            <input type="text" value={`${classType?.name} (${debt.trainerLevel})`} disabled className={`${inputBaseClasses} bg-gray-100`} />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Sessions</label>
                            <Select options={sessionOptions} value={packageForm.totalSessions} onChange={(val) => setPackageForm(p => ({ ...p, totalSessions: val }))} />
                        </div>
                    </div>

                    {packageForm.totalSessions === 'other' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Custom Session Count</label>
                            <input type="number" value={packageForm.customSessions} onChange={e => setPackageForm(p => ({...p, customSessions: Number(e.target.value)}))} required min="1" className={inputBaseClasses} />
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                            <input type="number" value={packageForm.price} onChange={e => setPackageForm(p => ({...p, price: Number(e.target.value)}))} required className={inputBaseClasses} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                            <Select options={paymentMethodOptions} value={packageForm.paymentMethod} onChange={(val) => setPackageForm(p => ({...p, paymentMethod: val as PaymentMethod}))} />
                        </div>
                    </div>

                     <div className="flex justify-end pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 mr-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                        <button onClick={handlePurchaseAndSettle} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                            Purchase & Settle Debt
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default SettleDebtModal;
