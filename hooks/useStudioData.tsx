import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from 'react';
import {
    Customer, Trainer, Booking, Package, Payment, Alert,
    BookingStatus, ClassType, StudioSettings, CustomerPayment,
    AdvancePayment, SessionDebt, Notification, TrainerLevel, PaymentMethod, LastAction, UserRole
} from '../types';
import { useAuth } from './useAuth';
import { db, Timestamp } from '../firebase';
import {
    collection, onSnapshot, doc, getDoc, addDoc, updateDoc,
    deleteDoc, writeBatch, query, where, Unsubscribe, getDocs
} from 'firebase/firestore';
import { addWeeks } from 'date-fns/addWeeks';

const uuid = () => doc(collection(db, 'id')).id;

// Helper to convert Firestore Timestamps to JS Dates in nested objects
const convertTimestamps = (data: any) => {
    if (!data) return data;
    if (data instanceof Timestamp) {
        return data.toDate();
    }
    if (Array.isArray(data)) {
        return data.map(item => convertTimestamps(item));
    }
    if (typeof data === 'object' && data !== null) {
        const newData: { [key: string]: any } = {};
        for (const key in data) {
            newData[key] = convertTimestamps(data[key]);
        }
        return newData;
    }
    return data;
};


interface StudioDataContextType {
    // State
    customers: Customer[];
    trainers: Trainer[];
    bookings: Booking[];
    payments: Payment[];
    alerts: Alert[];
    classTypes: ClassType[];
    studioSettings: StudioSettings | null;
    customerPayments: CustomerPayment[];
    advancePayments: AdvancePayment[];
    sessionDebts: SessionDebt[];
    notifications: Notification[];
    studioName: string;
    now: Date;
    lastAction: LastAction | null;
    loggedInTrainer: Trainer | null;

    // Data Accessors
    getTrainer: (id: string | undefined) => Trainer | undefined;
    getCustomer: (id: string | undefined) => Customer | undefined;
    getClassType: (id: string | undefined) => ClassType | undefined;
    getSessionDebtsForCustomer: (customerId: string) => SessionDebt[];

    // Mutators
    addBooking: (bookingData: Omit<Booking, 'id'>) => Promise<void>;
    updateBooking: (id: string, updates: Partial<Booking>) => Promise<void>;
    addRecurringBookings: (bookingData: Omit<Booking, 'id'>, weeks: number) => Promise<void>;

    addCustomer: (customerData: Omit<Customer, 'id' | 'packages' | 'isArchived'>) => Promise<Customer>;
    updateCustomer: (updatedCustomer: Partial<Customer> & { id: string }) => Promise<void>;
    archiveCustomer: (id: string) => Promise<void>;
    unarchiveCustomer: (id: string) => Promise<void>;
    deleteCustomer: (id: string) => Promise<void>;

    addPackage: (customerId: string, packageData: Omit<Package, 'id'>, paymentMethod: PaymentMethod) => Promise<void>;
    updatePackage: (customerId: string, updatedPackage: Package) => Promise<void>;
    togglePackageArchiveStatus: (customerId: string, packageId: string) => Promise<void>;
    addCustomerWithPackage: (customerData: Omit<Customer, 'id' | 'packages' | 'isArchived'>, packageData: Omit<Package, 'id'>, paymentMethod: PaymentMethod) => Promise<void>;

    addTrainer: (trainerData: Omit<Trainer, 'id'>) => Promise<void>;
    updateTrainer: (id: string, updatedTrainerData: Partial<Omit<Trainer, 'id'>>) => Promise<void>;

    addClassType: (classTypeData: Omit<ClassType, 'id'>) => Promise<void>;
    updateClassType: (updatedClassType: ClassType) => Promise<void>;
    deleteClassType: (id: string) => Promise<void>;

    addPayment: (paymentData: Omit<Payment, 'id'>) => Promise<void>;
    addAdvancePayment: (advanceData: Omit<AdvancePayment, 'id'>) => Promise<void>;

    updateStudioSettings: (newSettings: Partial<StudioSettings>) => Promise<void>;
    updateStudioName: (name: string) => Promise<void>;
    addPaymentMethod: (method: string) => Promise<void>;
    updatePaymentMethod: (index: number, method: string) => Promise<void>;
    deletePaymentMethod: (index: number) => Promise<void>;

    markNotificationsAsRead: () => void;
    
    // Utils
    formatCurrency: (amount: number) => string;
}

const StudioDataContext = createContext<StudioDataContextType | undefined>(undefined);

export const StudioDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, userRole, studioId } = useAuth();
    
    // State management
    const [studioName, setStudioName] = useState("StudioFlow");
    const [classTypes, setClassTypes] = useState<ClassType[]>([]);
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>([]);
    const [advancePayments, setAdvancePayments] = useState<AdvancePayment[]>([]);
    const [studioSettings, setStudioSettings] = useState<StudioSettings | null>(null);
    const [sessionDebts, setSessionDebts] = useState<SessionDebt[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [lastAction, setLastAction] = useState<LastAction | null>(null);
    const [loggedInTrainer, setLoggedInTrainer] = useState<Trainer | null>(null);

    const now = useMemo(() => new Date(), []);

    // Find logged in trainer profile
    useEffect(() => {
        if (userRole === UserRole.Trainer && user && trainers.length > 0) {
            const foundTrainer = trainers.find(t => t.email.toLowerCase() === user.email?.toLowerCase());
            setLoggedInTrainer(foundTrainer || null);
        } else {
            setLoggedInTrainer(null);
        }
    }, [user, userRole, trainers]);

    // Firestore listeners
    useEffect(() => {
        if (!studioId) {
            // Clear data on logout
            setClassTypes([]); setTrainers([]); setCustomers([]); setBookings([]);
            setPayments([]); setCustomerPayments([]); setAdvancePayments([]);
            setSessionDebts([]); setStudioSettings(null);
            return;
        }

        const unsubscribers: Unsubscribe[] = [];
        const studioRef = doc(db, 'studios', studioId);

        // Studio settings and name
        unsubscribers.push(onSnapshot(studioRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setStudioName(data.name || "StudioFlow");
                setStudioSettings(convertTimestamps(data.settings) as StudioSettings);
            }
        }));

        // Collections
        const collections: { name: string; setter: React.Dispatch<React.SetStateAction<any[]>> }[] = [
            { name: 'classTypes', setter: setClassTypes },
            { name: 'trainers', setter: setTrainers },
            { name: 'customers', setter: setCustomers },
            { name: 'bookings', setter: setBookings },
            { name: 'payments', setter: setPayments },
            { name: 'customerPayments', setter: setCustomerPayments },
            { name: 'advancePayments', setter: setAdvancePayments },
            { name: 'sessionDebts', setter: setSessionDebts },
        ];

        collections.forEach(({ name, setter }) => {
            const collRef = collection(studioRef, name);
            unsubscribers.push(onSnapshot(collRef, (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) }));
                setter(data);
            }));
        });
        
        return () => unsubscribers.forEach(unsub => unsub());

    }, [studioId]);

    const getCollectionRef = useCallback((collectionName: string) => {
        if (!studioId) throw new Error("Not authenticated");
        return collection(db, 'studios', studioId, collectionName);
    }, [studioId]);
    
    const getDocRef = useCallback((collectionName: string, docId: string) => {
        if (!studioId) throw new Error("Not authenticated");
        return doc(db, 'studios', studioId, collectionName, docId);
    }, [studioId]);

    const formatCurrency = useCallback((amount: number) => {
        if (studioSettings === null) return '';
        const lang = studioSettings?.language || 'en-US';
        const symbol = studioSettings?.currencySymbol || '$';
        // A hack to use the symbol from settings, as Intl.NumberFormat has limited currency support by code
        return new Intl.NumberFormat(lang, { style: 'currency', currency: 'USD' }).format(amount).replace(/\$/g, symbol);
    }, [studioSettings]);

    // --- Data Accessors ---
    const getTrainer = useCallback((id: string | undefined) => id ? trainers.find(t => t.id === id) : undefined, [trainers]);
    const getCustomer = useCallback((id: string | undefined) => id ? customers.find(c => c.id === id) : undefined, [customers]);
    const getClassType = useCallback((id: string | undefined) => id ? classTypes.find(ct => ct.id === id) : undefined, [classTypes]);
    const getSessionDebtsForCustomer = useCallback((customerId: string) => sessionDebts.filter(d => d.customerId === customerId && !d.isResolved), [sessionDebts]);
    
    // --- Mutators ---
    const addBooking = useCallback(async (data: Omit<Booking, 'id'>) => { await addDoc(getCollectionRef('bookings'), data) }, [getCollectionRef]);
    const updateBooking = useCallback(async (id: string, data: Partial<Booking>) => { await updateDoc(getDocRef('bookings', id), data) }, [getDocRef]);
    const addRecurringBookings = useCallback(async (bookingData: Omit<Booking, 'id'>, weeks: number) => {
        const batch = writeBatch(db);
        for (let i = 0; i < weeks; i++) {
            const newDocRef = doc(getCollectionRef('bookings'));
            batch.set(newDocRef, {
                ...bookingData,
                dateTime: addWeeks(bookingData.dateTime, i),
            });
        }
        await batch.commit();
    }, [getCollectionRef]);
    
    const addCustomer = useCallback(async (data: Omit<Customer, 'id' | 'packages' | 'isArchived'>) => {
        const newCustomerData = { ...data, packages: [], isArchived: false };
        const docRef = await addDoc(getCollectionRef('customers'), newCustomerData);
        return { ...newCustomerData, id: docRef.id };
    }, [getCollectionRef]);

    const updateCustomer = useCallback(async (data: Partial<Customer> & { id: string }) => {
        const { id, ...rest } = data;
        await updateDoc(getDocRef('customers', id), rest);
    }, [getDocRef]);
    
    const archiveCustomer = useCallback(async (id: string) => { await updateDoc(getDocRef('customers', id), { isArchived: true }) }, [getDocRef]);
    const unarchiveCustomer = useCallback(async (id: string) => { await updateDoc(getDocRef('customers', id), { isArchived: false }) }, [getDocRef]);

    const deleteCustomer = useCallback(async (id: string) => {
        // This is a complex operation; for now, we just delete the customer doc.
        // A cloud function would be better to ensure data consistency.
        await deleteDoc(getDocRef('customers', id));
    }, [getDocRef]);

    const addPackage = useCallback(async (customerId: string, packageData: Omit<Package, 'id'>, paymentMethod: PaymentMethod) => {
        if (!studioId) throw new Error("Not authenticated");
        
        const customerRef = getDocRef('customers', customerId);
        
        const batch = writeBatch(db);

        const newPackage = { ...packageData, id: uuid() };
        
        // This is not transactional with Firestore but will be optimistic UI
        const customerSnap = await getDoc(customerRef);
        if (!customerSnap.exists()) throw new Error("Customer not found");
        const customerData = convertTimestamps(customerSnap.data()) as Customer;

        const updatedPackages = [...(customerData.packages || []), newPackage];

        // Check for and settle debts
        const debtsQuery = query(getCollectionRef('sessionDebts'), where('customerId', '==', customerId), where('isResolved', '==', false));
        const debtsSnap = await getDocs(debtsQuery);
        const unresolvedDebts = debtsSnap.docs.map(d => ({id: d.id, ...convertTimestamps(d.data())})) as (SessionDebt & {id: string})[];
        
        const matchingDebt = unresolvedDebts
            .sort((a,b) => a.date.getTime() - b.date.getTime())
            .find(d => 
                d.classTypeId === newPackage.classTypeId && 
                d.trainerLevel === newPackage.trainerLevel
            );

        if (matchingDebt && newPackage.sessionsRemaining > 0) {
            newPackage.sessionsRemaining -= 1;
            const debtRef = getDocRef('sessionDebts', matchingDebt.id);
            batch.update(debtRef, { 
                isResolved: true, 
                resolvingPackageId: newPackage.id,
                resolvedBy: 'auto_package'
            });
        }
        
        batch.update(customerRef, { packages: updatedPackages.map(p => ({...p})) });

        // Create a payment record
        const paymentRef = doc(getCollectionRef('customerPayments'));
        batch.set(paymentRef, {
            customerId,
            packageId: newPackage.id,
            amount: newPackage.price,
            date: newPackage.purchaseDate,
            method: paymentMethod
        });
        
        await batch.commit();

    }, [studioId, getCollectionRef, getDocRef]);
    
    const updatePackage = useCallback(async (customerId: string, updatedPackage: Package) => {
        const customerRef = getDocRef('customers', customerId);
        const customerSnap = await getDoc(customerRef);
        if (!customerSnap.exists()) throw new Error("Customer not found");
        const customerData = convertTimestamps(customerSnap.data()) as Customer;
        const updatedPackages = customerData.packages.map(p => p.id === updatedPackage.id ? updatedPackage : p);
        await updateDoc(customerRef, { packages: updatedPackages });
    }, [getDocRef]);
    
    const togglePackageArchiveStatus = useCallback(async (customerId: string, packageId: string) => {
        const customerRef = getDocRef('customers', customerId);
        const customerSnap = await getDoc(customerRef);
        if (!customerSnap.exists()) throw new Error("Customer not found");
        const customerData = convertTimestamps(customerSnap.data()) as Customer;
        const updatedPackages = customerData.packages.map(p => p.id === packageId ? { ...p, isArchived: !p.isArchived } : p);
        await updateDoc(customerRef, { packages: updatedPackages });
    }, [getDocRef]);

    const addCustomerWithPackage = useCallback(async (customerData: Omit<Customer, 'id' | 'packages' | 'isArchived'>, packageData: Omit<Package, 'id'>, paymentMethod: PaymentMethod) => {
        const newCustomer = await addCustomer(customerData);
        await addPackage(newCustomer.id, packageData, paymentMethod);
    }, [addCustomer, addPackage]);

    const addTrainer = useCallback(async (data: Omit<Trainer, 'id'>) => { await addDoc(getCollectionRef('trainers'), data) }, [getCollectionRef]);
    const updateTrainer = useCallback(async (id: string, data: Partial<Omit<Trainer, 'id'>>) => { await updateDoc(getDocRef('trainers', id), data) }, [getDocRef]);

    const addClassType = useCallback(async (data: Omit<ClassType, 'id'>) => { await addDoc(getCollectionRef('classTypes'), data) }, [getCollectionRef]);
    // FIX: Destructure id from data to avoid passing it in the update payload.
    const updateClassType = useCallback(async (data: ClassType) => {
        const { id, ...rest } = data;
        await updateDoc(getDocRef('classTypes', id), rest);
    }, [getDocRef]);
    const deleteClassType = useCallback(async (id: string) => { await deleteDoc(getDocRef('classTypes', id)) }, [getDocRef]);

    const addPayment = useCallback(async (data: Omit<Payment, 'id'>) => { await addDoc(getCollectionRef('payments'), data) }, [getCollectionRef]);
    const addAdvancePayment = useCallback(async (data: Omit<AdvancePayment, 'id'>) => { await addDoc(getCollectionRef('advancePayments'), { ...data, isApplied: false }) }, [getCollectionRef]);

    const updateStudioSettings = useCallback(async (newSettings: Partial<StudioSettings>) => {
        if (!studioId || !studioSettings) return;
        await updateDoc(doc(db, 'studios', studioId), { settings: { ...studioSettings, ...newSettings } });
    }, [studioId, studioSettings]);
    
    const updateStudioName = useCallback(async (name: string) => {
        if (!studioId) return;
        await updateDoc(doc(db, 'studios', studioId), { name });
    }, [studioId]);

    const addPaymentMethod = useCallback(async (method: string) => {
        if (!studioSettings) return;
        const newMethods = [...studioSettings.paymentMethods, method];
        await updateStudioSettings({ paymentMethods: newMethods });
    }, [studioSettings, updateStudioSettings]);

    const updatePaymentMethod = useCallback(async (index: number, method: string) => {
        if (!studioSettings) return;
        const newMethods = [...studioSettings.paymentMethods];
        newMethods[index] = method;
        await updateStudioSettings({ paymentMethods: newMethods });
    }, [studioSettings, updateStudioSettings]);

    const deletePaymentMethod = useCallback(async (index: number) => {
        if (!studioSettings) return;
        const newMethods = studioSettings.paymentMethods.filter((_, i) => i !== index);
        await updateStudioSettings({ paymentMethods: newMethods });
    }, [studioSettings, updateStudioSettings]);

    const markNotificationsAsRead = useCallback(() => {}, []);


    const value: StudioDataContextType = {
        customers, trainers, bookings, payments, alerts, classTypes,
        studioSettings, customerPayments, advancePayments, sessionDebts,
        notifications, studioName, now, lastAction, loggedInTrainer,
        getTrainer, getCustomer, getClassType, getSessionDebtsForCustomer,
        addBooking, updateBooking, addRecurringBookings,
        addCustomer, updateCustomer, archiveCustomer, unarchiveCustomer, deleteCustomer,
        addPackage, updatePackage, togglePackageArchiveStatus, addCustomerWithPackage,
        addTrainer, updateTrainer,
        addClassType, updateClassType, deleteClassType,
        addPayment, addAdvancePayment,
        updateStudioSettings, updateStudioName, addPaymentMethod, updatePaymentMethod, deletePaymentMethod,
        markNotificationsAsRead,
        formatCurrency,
    };

    return (
        <StudioDataContext.Provider value={value}>
            {children}
        </StudioDataContext.Provider>
    );
};

export const useStudioData = () => {
    const context = useContext(StudioDataContext);
    if (context === undefined) {
        throw new Error('useStudioData must be used within a StudioDataProvider');
    }
    return context;
};