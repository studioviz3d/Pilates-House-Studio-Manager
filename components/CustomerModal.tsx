

import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import Modal from './ui/Modal';
import { useStudioData } from '../hooks/useStudioData';
import { formatPhoneNumber } from '../utils';
import { DatePicker } from './ui/DatePicker';
import { Camera, User } from 'lucide-react';

interface CustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    customer: Customer | null;
}

const inputBaseClasses = "w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm";

const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, customer }) => {
    const { addCustomer, updateCustomer } = useStudioData();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        birthDate: new Date(),
        avatarUrl: '',
    });

    useEffect(() => {
        if (customer) {
            setFormData({
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email,
                phone: customer.phone,
                birthDate: customer.birthDate || new Date(),
                avatarUrl: customer.avatarUrl || '',
            });
        } else {
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                birthDate: new Date(),
                avatarUrl: '',
            });
        }
    }, [customer, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === "phone") {
            setFormData(prev => ({ ...prev, [name]: formatPhoneNumber(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanedPhone = formData.phone.replace(/\D/g, '');
        const dataToSubmit = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: cleanedPhone,
            birthDate: formData.birthDate,
            avatarUrl: formData.avatarUrl,
        };
        
        if (customer) {
            updateCustomer({ ...customer, ...dataToSubmit });
        } else {
            // This modal is now only for editing, addCustomer is handled in NewCustomerFlowModal
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={customer ? 'Edit Customer' : 'Add New Customer'}>
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
                        <label htmlFor="customer-avatar-upload" className="absolute -bottom-1 -right-1 bg-blue-600 p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                            <Camera size={16} className="text-white" />
                            <input id="customer-avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
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
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} placeholder="(123) 456-7890" required className={inputBaseClasses} />
                    </div>
                    <div>
                        <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                        <DatePicker selected={formData.birthDate} onChange={(date) => setFormData(prev => ({...prev, birthDate: date}))} />
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

export default CustomerModal;