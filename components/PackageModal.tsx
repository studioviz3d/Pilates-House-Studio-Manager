

import React, { useState, useEffect, useMemo } from 'react';
import { Package, TrainerLevel, PaymentMethod } from '../types';
import Modal from './ui/Modal';
import { useStudioData } from '../hooks/useStudioData';
import { addMonths } from 'date-fns/addMonths';
import { DatePicker } from './ui/DatePicker';
import Select, { SelectOption } from './ui/Select';
import { AlertTriangle } from 'lucide-react';

interface PackageModalProps {
    isOpen: boolean;
    onClose: () => void;
    pkg: (Package & { customerId: string }) | null;
}

const inputBaseClasses = "w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm";


const PackageModal: React.FC<PackageModalProps> = ({ isOpen, onClose, pkg }) => {
    const { addPackage, updatePackage, customers, classTypes, getSessionDebtsForCustomer, getClassType, studioSettings } = useStudioData();
    const [customerId, setCustomerId] = useState('');
    const [classTypeId, setClassTypeId] = useState('');
    const [trainerLevel, setTrainerLevel] = useState<TrainerLevel>('Regular');
    const [totalSessions, setTotalSessions] = useState('10'); // Can be '1', '5', '10', or 'other'
    const [customSessions, setCustomSessions] = useState(1);
    const [price, setPrice] = useState(0);
    const [purchaseDate, setPurchaseDate] = useState(new Date());
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Credit Card');

    const expirationDate = addMonths(purchaseDate, 3); // 3 month expiration

    const customerDebts = useMemo(() => {
        if (!customerId) return [];
        return getSessionDebtsForCustomer(customerId);
    }, [customerId, getSessionDebtsForCustomer]);

    useEffect(() => {
        if (isOpen) {
            if (pkg) {
                setCustomerId(pkg.customerId);
                setClassTypeId(pkg.classTypeId);
                setTrainerLevel(pkg.trainerLevel);
                if ([1, 5, 10].includes(pkg.totalSessions)) {
                    setTotalSessions(String(pkg.totalSessions));
                } else {
                    setTotalSessions('other');
                    setCustomSessions(pkg.totalSessions);
                }
                setPrice(pkg.price);
                setPurchaseDate(new Date(pkg.purchaseDate));
                setPaymentMethod(studioSettings.paymentMethods[0] || 'Credit Card'); // Not tracked for edits
            } else {
                // Reset form
                setCustomerId(customers[0]?.id || '');
                setClassTypeId(classTypes[0]?.id || '');
                setTrainerLevel('Regular');
                setTotalSessions('10');
                setCustomSessions(1);
                setPrice(0);
                setPurchaseDate(new Date());
                setPaymentMethod(studioSettings.paymentMethods[0] || 'Credit Card');
            }
        }
    }, [pkg, isOpen, customers, classTypes, studioSettings]);
    
    useEffect(() => {
        // When a customer is selected for a new package, check for debts and pre-fill
        if (customerId && !pkg) { // !pkg ensures this is for adding, not editing
            const debts = getSessionDebtsForCustomer(customerId);
            if (debts.length > 0) {
                // Find the oldest debt to pre-fill the form
                const oldestDebt = debts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
                if (oldestDebt) {
                    setClassTypeId(oldestDebt.classTypeId);
                    setTrainerLevel(oldestDebt.trainerLevel);
                }
            }
        }
    }, [customerId, pkg, getSessionDebtsForCustomer]);

    useEffect(() => {
        // Auto-update price based on selections
        const selectedClassType = classTypes.find(ct => ct.id === classTypeId);
        if (selectedClassType && !pkg && totalSessions !== 'other') { // Don't auto-update if editing or custom
            const sessionKey = totalSessions as '1' | '5' | '10';
            const newPrice = selectedClassType.pricing[trainerLevel][sessionKey];
            setPrice(newPrice || 0);
        }
    }, [classTypeId, trainerLevel, totalSessions, classTypes, pkg]);

    const finalTotalSessions = totalSessions === 'other' ? customSessions : Number(totalSessions);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const packageData = {
            classTypeId,
            trainerLevel,
            price,
            totalSessions: finalTotalSessions,
            sessionsRemaining: finalTotalSessions,
            purchaseDate,
            expirationDate,
            isArchived: false,
        };
        if (pkg) {
            // When editing, preserve remaining sessions if total sessions hasn't changed
            const sessionsRemaining = pkg.totalSessions === finalTotalSessions ? pkg.sessionsRemaining : finalTotalSessions;
            updatePackage(customerId, { ...packageData, id: pkg.id, sessionsRemaining });
        } else {
            addPackage(customerId, packageData, paymentMethod);
        }
        onClose();
    };

    const customerOptions: SelectOption[] = useMemo(() => 
        [...customers]
            .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
            .map(c => ({ value: c.id, label: `${c.firstName} ${c.lastName}`})), 
        [customers]
    );
    const classTypeOptions: SelectOption[] = useMemo(() => classTypes.map(ct => ({ value: ct.id, label: ct.name })), [classTypes]);
    const trainerLevelOptions: SelectOption[] = [{value: 'Regular', label: 'Regular'}, {value: 'Master', label: 'Master'}];
    const sessionOptions: SelectOption[] = [
        { value: '1', label: '1 Session' },
        { value: '5', label: '5 Sessions' },
        { value: '10', label: '10 Sessions' },
        { value: 'other', label: 'Other...' },
    ];
    const paymentMethodOptions: SelectOption[] = useMemo(() => 
        studioSettings.paymentMethods.map(method => ({ value: method, label: method })),
    [studioSettings.paymentMethods]);


    return (
        <Modal isOpen={isOpen} onClose={onClose} title={pkg ? 'Edit Package' : 'Add New Package'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 {customerDebts.length > 0 && !pkg && (
                    <div className="p-3 rounded-md text-sm flex items-start bg-yellow-100 text-yellow-800">
                        <AlertTriangle size={16} className="mr-2 flex-shrink-0 mt-0.5" />
                        <span>This customer has an outstanding debt of {customerDebts.length} session(s). Upon purchase, 1 session from this new package will be used to automatically settle a matching debt.</span>
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                    <Select options={customerOptions} value={customerId} onChange={setCustomerId} disabled={!!pkg} searchable />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class Type</label>
                    <Select options={classTypeOptions} value={classTypeId} onChange={setClassTypeId} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trainer Level</label>
                    <Select options={trainerLevelOptions} value={trainerLevel} onChange={(val) => setTrainerLevel(val as TrainerLevel)} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of Sessions</label>
                    <Select options={sessionOptions} value={totalSessions} onChange={setTotalSessions} />
                </div>

                {totalSessions === 'other' && (
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Custom Session Count</label>
                        <input type="number" value={customSessions} onChange={e => setCustomSessions(Number(e.target.value))} required min="1" className={inputBaseClasses} />
                    </div>
                )}
               
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                    <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} required className={inputBaseClasses} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                    <DatePicker selected={purchaseDate} onChange={setPurchaseDate} />
                </div>
                
                {!pkg && (
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                         <Select options={paymentMethodOptions} value={paymentMethod} onChange={(val) => setPaymentMethod(val as PaymentMethod)} />
                    </div>
                )}


                <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">Save Package</button>
                </div>
            </form>
        </Modal>
    );
};

export default PackageModal;