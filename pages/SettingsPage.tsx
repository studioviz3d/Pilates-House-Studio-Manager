
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Card from '../components/ui/Card';
import { useStudioData } from '../hooks/useStudioData';
import { ClassType, NotificationSettings } from '../types';
import ClassTypeModal from '../components/ClassTypeModal';
import { FilePenLine, Trash, Plus, Check, X, MoreVertical, Bell } from 'lucide-react';
import Select, { SelectOption } from '../components/ui/Select';
import ToggleSwitch from '../components/ui/ToggleSwitch';
import ConfirmationModal from '../components/ui/ConfirmationModal';

const inputBaseClasses = "w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm";

const timezones: SelectOption[] = [
    { value: 'UTC', label: 'UTC' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Berlin', label: 'Berlin (CET)' },
    { value: 'Europe/Istanbul', label: 'Istanbul (TRT)' },
    { value: 'America/New_York', label: 'New York (EST)' },
    { value: 'America/Chicago', label: 'Chicago (CST)' },
    { value: 'America/Denver', label: 'Denver (MST)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (PST)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];

const PaymentMethodActions: React.FC<{ onEdit: () => void; onDelete: () => void; }> = ({ onEdit, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(prev => !prev)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-md">
                <MoreVertical size={16} />
            </button>
            {isOpen && (
                 <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10 border overflow-hidden">
                    <button onClick={() => { onEdit(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                        <FilePenLine size={14} className="mr-2" /> Edit
                    </button>
                    <button onClick={() => { onDelete(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center">
                        <Trash size={14} className="mr-2" /> Delete
                    </button>
                 </div>
            )}
        </div>
    );
};


const ClassTypeActions: React.FC<{ onEdit: () => void; onDelete: () => void; }> = ({ onEdit, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(prev => !prev)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-md">
                <MoreVertical size={16} />
            </button>
            {isOpen && (
                 <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10 border overflow-hidden">
                    <button onClick={() => { onEdit(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                        <FilePenLine size={14} className="mr-2" /> Edit
                    </button>
                    <button onClick={() => { onDelete(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center">
                        <Trash size={14} className="mr-2" /> Delete
                    </button>
                 </div>
            )}
        </div>
    );
};

const SettingsPage: React.FC = () => {
    const { 
        studioSettings, updateStudioSettings, studioName, updateStudioName, 
        classTypes, deleteClassType,
        addPaymentMethod, updatePaymentMethod, deletePaymentMethod
    } = useStudioData();

    // Local state for inputs to control them before saving on blur
    const [localName, setLocalName] = useState(studioName);
    const [localCurrency, setLocalCurrency] = useState(studioSettings.currencySymbol);
    const [localCancellation, setLocalCancellation] = useState(studioSettings.cancellationPolicyHours);
    const [localInactivityThreshold, setLocalInactivityThreshold] = useState(studioSettings.inactivityThresholdDays);


    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClassType, setSelectedClassType] = useState<ClassType | null>(null);
    
    const [confirmDelete, setConfirmDelete] = useState<{ type: 'class' | 'method'; id?: string; index?: number; name: string } | null>(null);
    
    // State for payment methods management
    const [newMethod, setNewMethod] = useState('');
    const [isAddingMethod, setIsAddingMethod] = useState(false);
    const [editingMethod, setEditingMethod] = useState<{ index: number, name: string } | null>(null);
    
    useEffect(() => {
        setLocalName(studioName);
        setLocalCurrency(studioSettings.currencySymbol);
        setLocalCancellation(studioSettings.cancellationPolicyHours);
        setLocalInactivityThreshold(studioSettings.inactivityThresholdDays);
    }, [studioName, studioSettings]);

    
    const handleAddClassType = () => {
        setSelectedClassType(null);
        setIsModalOpen(true);
    };
    
    const handleEditClassType = (ct: ClassType) => {
        setSelectedClassType(ct);
        setIsModalOpen(true);
    };

    const handleDeleteClassType = (ct: ClassType) => {
        const isDefault = ['ct-private', 'ct-duet', 'ct-group'].includes(ct.id);
        if (isDefault) {
            alert("Default class types cannot be deleted.");
            return;
        }
        setConfirmDelete({ type: 'class', id: ct.id, name: ct.name });
    };
    
    // --- Payment Method Handlers (now transactional) ---
    const handleAddMethod = () => {
        const trimmed = newMethod.trim();
        if (trimmed) {
            if (studioSettings.paymentMethods.some(m => m.toLowerCase() === trimmed.toLowerCase())) {
                alert("This payment method already exists.");
                return;
            }
            addPaymentMethod(trimmed);
        }
        setNewMethod('');
        setIsAddingMethod(false);
    };

    const handleDeleteMethod = (index: number) => {
        setConfirmDelete({ type: 'method', index, name: studioSettings.paymentMethods[index] });
    };
    
    const handleSaveEditedMethod = () => {
        if(editingMethod) {
            const trimmed = editingMethod.name.trim();
            if (trimmed) {
                updatePaymentMethod(editingMethod.index, trimmed);
            }
            setEditingMethod(null);
        }
    };
    
    const handleToggleNotification = (key: keyof NotificationSettings) => {
        const newSettings = {
            ...studioSettings,
            notificationSettings: {
                ...studioSettings.notificationSettings,
                [key]: !studioSettings.notificationSettings[key],
            },
        };
        updateStudioSettings(newSettings);
    };


    const languageOptions: SelectOption[] = useMemo(() => [
        { value: "en-US", label: "English (United States)" },
        { value: "es-ES", label: "Spanish (Spain)" },
        { value: "fr-FR", label: "French (France)" },
    ], []);

    return (
        <>
            <div className="space-y-8">
                <h2 className="text-3xl font-bold text-gray-800">Settings</h2>
                
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div className="space-y-8">
                        <Card>
                            <h3 className="text-xl font-semibold text-gray-800 mb-6">General Settings</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Studio Name</label>
                                    <input 
                                        type="text" 
                                        value={localName} 
                                        onChange={e => setLocalName(e.target.value)} 
                                        onBlur={() => updateStudioName(localName)}
                                        className={inputBaseClasses} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                                    <Select 
                                        options={languageOptions}
                                        value={studioSettings.language}
                                        onChange={(val) => updateStudioSettings({ ...studioSettings, language: val })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                                    <Select 
                                        options={timezones}
                                        value={studioSettings.timezone}
                                        onChange={(val) => updateStudioSettings({ ...studioSettings, timezone: val })}
                                        searchable
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency Symbol</label>
                                    <input 
                                        type="text" 
                                        value={localCurrency} 
                                        onChange={e => setLocalCurrency(e.target.value)}
                                        onBlur={() => updateStudioSettings({ ...studioSettings, currencySymbol: localCurrency })}
                                        className={`${inputBaseClasses} w-24`} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cancellation Policy (Hours)</label>
                                    <input 
                                        type="number" 
                                        value={localCancellation} 
                                        onChange={e => setLocalCancellation(Number(e.target.value))}
                                        onBlur={() => updateStudioSettings({ ...studioSettings, cancellationPolicyHours: localCancellation })}
                                        className={`${inputBaseClasses} w-24`} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mark customer as inactive after (days)</label>
                                    <input 
                                        type="number" 
                                        value={localInactivityThreshold} 
                                        onChange={e => setLocalInactivityThreshold(Number(e.target.value))}
                                        onBlur={() => updateStudioSettings({ ...studioSettings, inactivityThresholdDays: localInactivityThreshold })}
                                        className={`${inputBaseClasses} w-24`} 
                                    />
                                </div>
                            </div>
                        </Card>
                        <Card>
                            <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                                <Bell size={20} className="mr-3 text-gray-600" />
                                Notification Preferences
                            </h3>
                            <div className="space-y-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="font-medium text-gray-800">Low Package Alerts</label>
                                        <p className="text-sm text-gray-500">Trigger dashboard alerts when a customer's package is running low.</p>
                                    </div>
                                    <ToggleSwitch
                                        checked={studioSettings.notificationSettings.lowPackageEmail}
                                        onChange={() => handleToggleNotification('lowPackageEmail')}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="font-medium text-gray-800">Expiring Package Alerts</label>
                                        <p className="text-sm text-gray-500">Get alerts for packages that are expiring soon.</p>
                                    </div>
                                    <ToggleSwitch
                                        checked={studioSettings.notificationSettings.expiringPackageEmail}
                                        onChange={() => handleToggleNotification('expiringPackageEmail')}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="font-medium text-gray-800">Upcoming Birthday Alerts</label>
                                        <p className="text-sm text-gray-500">Receive reminders for upcoming customer birthdays.</p>
                                    </div>
                                    <ToggleSwitch
                                        checked={studioSettings.notificationSettings.upcomingBirthdayEmail}
                                        onChange={() => handleToggleNotification('upcomingBirthdayEmail')}
                                    />
                                </div>
                            </div>
                        </Card>
                    </div>
                    <div className="space-y-8">
                        <Card>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-semibold text-gray-800">Payment Methods</h3>
                                <button
                                    onClick={() => { setIsAddingMethod(true); setEditingMethod(null); }}
                                    className="flex-shrink-0 flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700"
                                >
                                    <Plus size={16} className="mr-1" /> Add Method
                                </button>
                            </div>

                            <div className="space-y-3">
                                {studioSettings.paymentMethods.map((method, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                        {editingMethod?.index === index ? (
                                            <>
                                            <input
                                                type="text"
                                                value={editingMethod.name}
                                                onChange={(e) => setEditingMethod({ ...editingMethod, name: e.target.value })}
                                                className={inputBaseClasses}
                                                autoFocus
                                                onKeyDown={(e) => e.key === 'Enter' && handleSaveEditedMethod()}
                                            />
                                            <div className="flex items-center gap-2 ml-4">
                                                <button onClick={handleSaveEditedMethod} className="p-1.5 text-green-600 hover:bg-green-100 rounded-md"><Check size={16} /></button>
                                                <button onClick={() => setEditingMethod(null)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-md"><X size={16} /></button>
                                            </div>
                                            </>
                                        ) : (
                                            <>
                                            <span className="text-sm font-medium text-gray-800">{method}</span>
                                            <PaymentMethodActions
                                                onEdit={() => { setEditingMethod({ index, name: method }); setIsAddingMethod(false); }}
                                                onDelete={() => handleDeleteMethod(index)}
                                            />
                                            </>
                                        )}
                                    </div>
                                ))}
                                {isAddingMethod && (
                                    <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                                        <input
                                            type="text"
                                            value={newMethod}
                                            onChange={(e) => setNewMethod(e.target.value)}
                                            className={inputBaseClasses}
                                            autoFocus
                                            placeholder="New payment method name"
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddMethod()}
                                        />
                                        <div className="flex items-center gap-2">
                                            <button onClick={handleAddMethod} className="p-1.5 text-green-600 hover:bg-green-100 rounded-md" aria-label="Save new method">
                                                <Check size={16} />
                                            </button>
                                            <button onClick={() => { setIsAddingMethod(false); setNewMethod(''); }} className="p-1.5 text-red-600 hover:bg-red-100 rounded-md" aria-label="Cancel adding new method">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
                
                <Card className="!p-0">
                    <div className="flex justify-between items-center mb-6 px-6 pt-6">
                        <h3 className="text-xl font-semibold text-gray-800">Class Types & Pricing</h3>
                        <button onClick={handleAddClassType} className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700">
                            <Plus size={16} className="mr-1" />
                            Add Type
                        </button>
                    </div>
                     {/* Mobile View */}
                    <div className="md:hidden divide-y divide-gray-200">
                        {classTypes.map(ct => (
                            <div key={ct.id} className="p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-gray-800">{ct.name} <span className="text-sm font-normal text-gray-500">({ct.abbreviation})</span></p>
                                    </div>
                                    <ClassTypeActions
                                        onEdit={() => handleEditClassType(ct)}
                                        onDelete={() => handleDeleteClassType(ct)}
                                    />
                                </div>
                                <div className="mt-2 text-sm space-y-1">
                                    <p><span className="font-semibold text-gray-600">Regular:</span> {`${studioSettings.currencySymbol}${ct.pricing.Regular['1']} / ${studioSettings.currencySymbol}${ct.pricing.Regular['5']} / ${studioSettings.currencySymbol}${ct.pricing.Regular['10']}`}</p>
                                    <p><span className="font-semibold text-gray-600">Master:</span> {`${studioSettings.currencySymbol}${ct.pricing.Master['1']} / ${studioSettings.currencySymbol}${ct.pricing.Master['5']} / ${studioSettings.currencySymbol}${ct.pricing.Master['10']}`}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-white border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abbreviation</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Regular Price (1/5/10)</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Master Price (1/5/10)</th>
                                    <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {classTypes.map(ct => (
                                    <tr key={ct.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ct.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ct.abbreviation}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                            {`${studioSettings.currencySymbol}${ct.pricing.Regular['1']} / ${studioSettings.currencySymbol}${ct.pricing.Regular['5']} / ${studioSettings.currencySymbol}${ct.pricing.Regular['10']}`}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                            {`${studioSettings.currencySymbol}${ct.pricing.Master['1']} / ${studioSettings.currencySymbol}${ct.pricing.Master['5']} / ${studioSettings.currencySymbol}${ct.pricing.Master['10']}`}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <ClassTypeActions
                                                onEdit={() => handleEditClassType(ct)}
                                                onDelete={() => handleDeleteClassType(ct)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
            
            <ClassTypeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} classType={selectedClassType} />
             <ConfirmationModal
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={() => {
                    if (confirmDelete?.type === 'class' && confirmDelete.id) {
                        deleteClassType(confirmDelete.id);
                    } else if (confirmDelete?.type === 'method' && confirmDelete.index !== undefined) {
                        deletePaymentMethod(confirmDelete.index);
                    }
                }}
                title={`Delete ${confirmDelete?.type === 'class' ? 'Class Type' : 'Payment Method'}`}
                confirmText="Delete"
            >
                Are you sure you want to delete "{confirmDelete?.name}"? This action cannot be undone.
            </ConfirmationModal>
        </>
    );
};

export default SettingsPage;
