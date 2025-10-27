import React, { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import { useStudioData } from '../hooks/useStudioData';
import { ClassType } from '../types';
import ConfirmationModal from './ui/ConfirmationModal';

interface ClassTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    classType: ClassType | null;
}

const inputBaseClasses = "w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm";


const ClassTypeModal: React.FC<ClassTypeModalProps> = ({ isOpen, onClose, classType }) => {
    const { addClassType, updateClassType, studioSettings, deleteClassType } = useStudioData();
    const [formData, setFormData] = useState<Omit<ClassType, 'id'>>({
        name: '',
        abbreviation: '',
        maxCapacity: 1,
        pricing: { Regular: { '1': 0, '5': 0, '10': 0 }, Master: { '1': 0, '5': 0, '10': 0 } }
    });
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    useEffect(() => {
        if (classType) {
            setFormData(classType);
        } else {
            setFormData({
                name: '',
                abbreviation: '',
                maxCapacity: 1,
                pricing: { Regular: { '1': 0, '5': 0, '10': 0 }, Master: { '1': 0, '5': 0, '10': 0 } }
            });
        }
    }, [classType, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const isNumberField = name === 'maxCapacity';
        setFormData(prev => ({ ...prev, [name]: isNumberField ? Number(value) : value }));
    };
    
    const handlePriceChange = (level: 'Regular' | 'Master', sessions: '1' | '5' | '10', value: string) => {
        setFormData(prev => ({
            ...prev,
            pricing: {
                ...prev.pricing,
                [level]: {
                    ...prev.pricing[level],
                    [sessions]: Number(value)
                }
            }
        }));
    };

    const handleDelete = () => {
        if (classType) {
            const isDefault = ['ct-private', 'ct-duet', 'ct-group'].includes(classType.id);
            if (isDefault) {
                alert("Default class types cannot be deleted.");
                return;
            }
            setIsConfirmOpen(true);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (classType) {
            updateClassType({ ...formData, id: classType.id });
        } else {
            addClassType(formData);
        }
        onClose();
    };
    
    const PriceInput: React.FC<{ level: 'Regular' | 'Master', sessions: '1' | '5' | '10' }> = ({ level, sessions }) => (
        <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 sm:text-sm">{studioSettings.currencySymbol}</span>
            </div>
            <input
                type="number"
                value={formData.pricing[level][sessions]}
                onChange={e => handlePriceChange(level, sessions, e.target.value)}
                className={`${inputBaseClasses} pl-7`}
            />
        </div>
    );

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={classType ? 'Edit Class Type' : 'Add New Class Type'}>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputBaseClasses} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Abbreviation</label>
                            <input type="text" name="abbreviation" value={formData.abbreviation} onChange={handleChange} required maxLength={3} className={inputBaseClasses} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Capacity</label>
                        <input type="number" name="maxCapacity" value={formData.maxCapacity} onChange={handleChange} required min="1" className={`${inputBaseClasses} w-24`} />
                    </div>
                    
                    <div>
                        <h4 className="text-md font-medium text-gray-800 mb-2">Pricing</h4>
                        <div className="p-4 bg-gray-50 rounded-md space-y-4">
                            {(['Regular', 'Master'] as ('Regular' | 'Master')[]).map(level => (
                                <div key={level}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{level} Trainer</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">1 Session</label>
                                            <PriceInput level={level} sessions="1" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">5 Sessions</label>
                                            <PriceInput level={level} sessions="5" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">10 Sessions</label>
                                            <PriceInput level={level} sessions="10" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4">
                        <div>
                            {classType && <button type="button" onClick={handleDelete} className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100">Delete</button>}
                        </div>
                        <div className="flex space-x-3">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">Save</button>
                        </div>
                    </div>
                </form>
            </Modal>
             <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={() => {
                    if (classType) {
                        deleteClassType(classType.id);
                        onClose(); // Close the main modal too
                    }
                }}
                title="Delete Class Type"
                confirmText="Delete"
            >
                Are you sure you want to delete "{classType?.name}"? This action cannot be undone.
            </ConfirmationModal>
        </>
    );
};

export default ClassTypeModal;