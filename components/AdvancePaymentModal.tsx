
import React, { useState, useMemo } from 'react';
import Modal from './ui/Modal';
import { useStudioData } from '../hooks/useStudioData';
import Select, { SelectOption } from './ui/Select';

interface AdvancePaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const inputBaseClasses = "w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm";

const AdvancePaymentModal: React.FC<AdvancePaymentModalProps> = ({ isOpen, onClose }) => {
    const { addAdvancePayment, trainers, studioSettings } = useStudioData();
    const [trainerId, setTrainerId] = useState('');
    const [amount, setAmount] = useState<string>('');
    const [notes, setNotes] = useState('');

    const trainerOptions: SelectOption[] = useMemo(() => 
        trainers.map(t => ({ value: t.id, label: `${t.firstName} ${t.lastName}`})),
    [trainers]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (!trainerId || isNaN(numericAmount) || numericAmount <= 0) {
            alert("Please select a trainer and enter a valid amount.");
            return;
        }
        // FIX: Added the missing 'isApplied' property to satisfy the Omit<AdvancePayment, "id"> type.
        addAdvancePayment({ trainerId, amount: numericAmount, date: new Date(), notes, isApplied: false });
        onClose();
        // Reset form
        setTrainerId('');
        setAmount('');
        setNotes('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Advance Payment">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trainer</label>
                    <Select 
                        options={trainerOptions}
                        value={trainerId}
                        onChange={setTrainerId}
                        placeholder="Select a trainer"
                        searchable
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <div className="relative mt-1 rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-gray-500 sm:text-sm">{studioSettings.currencySymbol}</span>
                        </div>
                        <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            required
                            min="0.01"
                            step="0.01"
                            className={`${inputBaseClasses} pl-7`}
                            placeholder="0.00"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={inputBaseClasses}></textarea>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">Add Payment</button>
                </div>
            </form>
        </Modal>
    );
};

export default AdvancePaymentModal;
