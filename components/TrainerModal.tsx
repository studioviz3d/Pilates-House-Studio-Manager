import React, { useState, useEffect, useMemo } from 'react';
import { Trainer, PaymentRates, TrainerLevel } from '../types';
import Modal from './ui/Modal';
import { useStudioData } from '../hooks/useStudioData';
import RateInputRow from './trainer/RateInputRow';
import { formatPhoneNumber } from '../utils';
import Select, { SelectOption } from './ui/Select';
import { Camera, User } from 'lucide-react';

interface TrainerModalProps {
    isOpen: boolean;
    onClose: () => void;
    trainer: Trainer | null;
}

const inputBaseClasses = "w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm";
const trainerColorOptions = [
    { name: 'purple', class: 'bg-purple-500' },
    { name: 'sky', class: 'bg-sky-500' },
    { name: 'rose', class: 'bg-rose-500' },
    { name: 'teal', class: 'bg-teal-500' },
];

const TrainerModal: React.FC<TrainerModalProps> = ({ isOpen, onClose, trainer }) => {
    const { addTrainer, updateTrainer, classTypes } = useStudioData();
    const [formData, setFormData] = useState<Omit<Trainer, 'id'>>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        specialization: '',
        level: 'Regular',
        paymentRates: {},
        avatarUrl: '',
        color: 'purple',
        availability: {}
    });

    useEffect(() => {
        if (trainer) {
            setFormData(trainer);
        } else {
            const initialRates: PaymentRates = {};
            classTypes.forEach(ct => { initialRates[ct.id] = 0.5; }); // Default 50%
            setFormData({
                firstName: '', lastName: '', email: '', phone: '', specialization: '',
                level: 'Regular', paymentRates: initialRates, avatarUrl: '', color: 'purple', availability: {}
            });
        }
    }, [trainer, isOpen, classTypes]);
    
    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === "phone") {
            setFormData(prev => ({ ...prev, [name]: formatPhoneNumber(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleRateChange = (classTypeId: string, rate: number) => {
        setFormData(prev => ({
            ...prev,
            paymentRates: { ...prev.paymentRates, [classTypeId]: rate }
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanedPhone = formData.phone.replace(/\D/g, '');
        const dataToSubmit = {...formData, phone: cleanedPhone};
        if (trainer) {
            updateTrainer(trainer.id, dataToSubmit);
        } else {
            addTrainer(dataToSubmit);
        }
        onClose();
    };

    const trainerLevelOptions: SelectOption[] = [
        { value: 'Regular', label: 'Regular' },
        { value: 'Master', label: 'Master' },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={trainer ? 'Edit Trainer' : 'Add New Trainer'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex justify-center">
                    <div className="relative">
                        {formData.avatarUrl ? (
                            <img src={formData.avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
                        ) : (
                             <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                                <User size={48} className="text-gray-400" />
                            </div>
                        )}
                        <label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 bg-blue-600 p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                            <Camera size={16} className="text-white" />
                            <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                        <input type="text" name="firstName" id="firstName" value={formData.firstName} onChange={handleChange} required className={inputBaseClasses} />
                    </div>
                    <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                        <input type="text" name="lastName" id="lastName" value={formData.lastName} onChange={handleChange} required className={inputBaseClasses} />
                    </div>
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className={inputBaseClasses} />
                </div>
                 <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} placeholder="(123) 456-7890" required className={inputBaseClasses} />
                </div>
                <div>
                    <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                    <input type="text" name="specialization" id="specialization" value={formData.specialization} onChange={handleChange} required className={inputBaseClasses} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">Trainer Level</label>
                        <Select 
                            options={trainerLevelOptions}
                            value={formData.level}
                            onChange={(val) => setFormData(prev => ({ ...prev, level: val as TrainerLevel }))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Color Code</label>
                        <div className="flex items-center space-x-3 pt-2">
                            {trainerColorOptions.map(opt => (
                                <button 
                                    type="button" 
                                    key={opt.name} 
                                    onClick={() => setFormData(prev => ({...prev, color: opt.name}))}
                                    className={`w-8 h-8 rounded-full ${opt.class} transition-all duration-200 ${formData.color === opt.name ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                                    aria-label={`Select ${opt.name} color`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                 <div>
                    <h4 className="text-md font-medium text-gray-900 mb-2">Payment Rates</h4>
                    <div className="space-y-3 p-4 bg-gray-50 rounded-md">
                       {classTypes.map(ct => (
                         <RateInputRow 
                            key={ct.id}
                            classType={ct}
                            rate={formData.paymentRates[ct.id] || 0}
                            onRateChange={handleRateChange}
                         />  
                       ))}
                    </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">Save</button>
                </div>
            </form>
        </Modal>
    );
};

export default TrainerModal;