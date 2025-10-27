
import React, { useState, useEffect, useMemo } from 'react';
import { Package, TrainerLevel, PaymentMethod } from '../types';
import Modal from './ui/Modal';
import { useStudioData } from '../hooks/useStudioData';
import { addMonths } from 'date-fns';
import { DatePicker } from './ui/DatePicker';
import Select, { SelectOption } from './ui/Select';
import { formatPhoneNumber } from '../utils';
import { Camera, User } from 'lucide-react';

interface NewCustomerFlowModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const inputBaseClasses = "w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm";

const initialCustomerState = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: new Date('1990-01-01'),
    avatarUrl: '',
};

const initialPackageState = {
    classTypeId: '',
    trainerLevel: 'Regular' as TrainerLevel,
    totalSessions: '10',
    customSessions: 1,
    price: 0,
    purchaseDate: new Date(),
    paymentMethod: 'Credit Card' as PaymentMethod,
};

const NewCustomerFlowModal: React.FC<NewCustomerFlowModalProps> = ({ isOpen, onClose }) => {
    const { addCustomer, addCustomerWithPackage, classTypes, studioSettings } = useStudioData();
    const [step, setStep] = useState(1);
    
    // Form States
    const [customerData, setCustomerData] = useState(initialCustomerState);
    const [packageData, setPackageData] = useState(initialPackageState);
    
    // Derived states for package form
    const expirationDate = addMonths(packageData.purchaseDate, 3);
    const finalTotalSessions = packageData.totalSessions === 'other' ? packageData.customSessions : Number(packageData.totalSessions);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setCustomerData(initialCustomerState);
            setPackageData({
                ...initialPackageState,
                classTypeId: classTypes[0]?.id || '',
                paymentMethod: studioSettings?.paymentMethods[0] || 'Credit Card',
            });
        }
    }, [isOpen, classTypes, studioSettings]);
    
    // Auto-update price for package
    useEffect(() => {
        const selectedClassType = classTypes.find(ct => ct.id === packageData.classTypeId);
        if (selectedClassType && packageData.totalSessions !== 'other') {
            const sessionKey = packageData.totalSessions as '1' | '5' | '10';
            const newPrice = selectedClassType.pricing[packageData.trainerLevel][sessionKey];
            setPackageData(p => ({ ...p, price: newPrice || 0 }));
        }
    }, [packageData.classTypeId, packageData.trainerLevel, packageData.totalSessions, classTypes]);


    const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === "phone") {
            setCustomerData(prev => ({ ...prev, [name]: formatPhoneNumber(value) }));
        } else {
            setCustomerData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCustomerData(prev => ({ ...prev, avatarUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveCustomerOnly = () => {
        const cleanedPhone = customerData.phone.replace(/\D/g, '');
        if (customerData.firstName && customerData.lastName && customerData.email && cleanedPhone) {
            addCustomer({ ...customerData, phone: cleanedPhone });
            onClose();
        } else {
            alert("Please fill in all customer details.");
        }
    };

    const handleSaveAll = () => {
        const cleanedPhone = customerData.phone.replace(/\D/g, '');
        if (!customerData.firstName || !customerData.lastName || !customerData.email || !cleanedPhone) {
             alert("Please fill in all customer details.");
             setStep(1);
             return;
        }
        if (!packageData.classTypeId || finalTotalSessions <= 0) {
            alert("Please configure the package correctly.");
            return;
        }

        const customerInfo = { ...customerData, phone: cleanedPhone };
        const packageInfo = {
            classTypeId: packageData.classTypeId,
            trainerLevel: packageData.trainerLevel,
            price: packageData.price,
            totalSessions: finalTotalSessions,
            sessionsRemaining: finalTotalSessions,
            purchaseDate: packageData.purchaseDate,
            expirationDate,
            isArchived: false,
        };
        addCustomerWithPackage(customerInfo, packageInfo, packageData.paymentMethod);
        onClose();
    };

    const isCustomerFormValid = customerData.firstName && customerData.lastName && customerData.email && customerData.phone.length > 0;

    // --- Options for Select components ---
    const classTypeOptions: SelectOption[] = useMemo(() => classTypes.map(ct => ({ value: ct.id, label: ct.name })), [classTypes]);
    const trainerLevelOptions: SelectOption[] = [{value: 'Regular', label: 'Regular'}, {value: 'Master', label: 'Master'}];
    const sessionOptions: SelectOption[] = [{ value: '1', label: '1 Session' }, { value: '5', label: '5 Sessions' }, { value: '10', label: '10 Sessions' }, { value: 'other', label: 'Other...' }];
    const paymentMethodOptions: SelectOption[] = useMemo(() =>
        (studioSettings?.paymentMethods || []).map(method => ({ value: method, label: method })),
    [studioSettings]);

    const renderStep1 = () => (
        <div className="space-y-4">
            <div className="flex justify-center">
                <div className="relative">
                    {customerData.avatarUrl ? (
                        <img src={customerData.avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
                    ) : (
                         <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                            <User size={48} className="text-gray-400" />
                        </div>
                    )}
                    <label htmlFor="new-customer-avatar-upload" className="absolute -bottom-1 -right-1 bg-blue-600 p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                        <Camera size={16} className="text-white" />
                        <input id="new-customer-avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    </label>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input type="text" name="firstName" value={customerData.firstName} onChange={handleCustomerChange} required className={inputBaseClasses} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input type="text" name="lastName" value={customerData.lastName} onChange={handleCustomerChange} required className={inputBaseClasses} />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" name="email" value={customerData.email} onChange={handleCustomerChange} required className={inputBaseClasses} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input type="tel" name="phone" value={customerData.phone} onChange={handleCustomerChange} placeholder="(123) 456-7890" required className={inputBaseClasses} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <DatePicker selected={customerData.birthDate} onChange={(date) => setCustomerData(prev => ({...prev, birthDate: date}))} />
                </div>
            </div>
            <div className="flex justify-between items-center pt-4">
                <button type="button" onClick={handleSaveCustomerOnly} disabled={!isCustomerFormValid} className="px-4 py-2 text-sm font-medium text-blue-600 rounded-md hover:bg-blue-50 disabled:text-gray-400 disabled:bg-transparent">Save and Close</button>
                <div className="flex space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                    <button type="button" onClick={() => setStep(2)} disabled={!isCustomerFormValid} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:bg-gray-400">Next: Add Package</button>
                </div>
            </div>
        </div>
    );
    
    const renderStep2 = () => (
         <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-800">Add a Package for {customerData.firstName}</h4>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class Type</label>
                    <Select options={classTypeOptions} value={packageData.classTypeId} onChange={(val) => setPackageData(p => ({ ...p, classTypeId: val }))} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trainer Level</label>
                    <Select options={trainerLevelOptions} value={packageData.trainerLevel} onChange={(val) => setPackageData(p => ({ ...p, trainerLevel: val as TrainerLevel }))} />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Sessions</label>
                <Select options={sessionOptions} value={packageData.totalSessions} onChange={(val) => setPackageData(p => ({ ...p, totalSessions: val }))} />
            </div>

            {packageData.totalSessions === 'other' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom Session Count</label>
                    <input type="number" value={packageData.customSessions} onChange={e => setPackageData(p => ({...p, customSessions: Number(e.target.value)}))} required min="1" className={inputBaseClasses} />
                </div>
            )}
           
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                    <input type="number" value={packageData.price} onChange={e => setPackageData(p => ({...p, price: Number(e.target.value)}))} required className={inputBaseClasses} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <Select options={paymentMethodOptions} value={packageData.paymentMethod} onChange={(val) => setPackageData(p => ({ ...p, paymentMethod: val as PaymentMethod }))} />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                <DatePicker selected={packageData.purchaseDate} onChange={(date) => setPackageData(p => ({ ...p, purchaseDate: date }))} />
            </div>

            <div className="flex justify-between items-center pt-4">
                <button type="button" onClick={() => setStep(1)} className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100">Back</button>
                <div className="flex space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                    <button type="button" onClick={handleSaveAll} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">Save Customer & Package</button>
                </div>
            </div>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={step === 1 ? 'Add New Customer' : 'Add Package'}>
            {step === 1 ? renderStep1() : renderStep2()}
        </Modal>
    );
};

export default NewCustomerFlowModal;
