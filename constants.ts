

import {
    Customer, Trainer, Booking, Package, Payment, Alert,
    BookingStatus, ClassType, StudioSettings, CustomerPayment,
    AdvancePayment, SessionDebt
} from './types';
import { addMonths } from 'date-fns/addMonths';
import { eachDayOfInterval } from 'date-fns/eachDayOfInterval';
import { getDay } from 'date-fns/getDay';
import { endOfWeek } from 'date-fns/endOfWeek';
import { format } from 'date-fns/format';
import { isBefore } from 'date-fns/isBefore';
import { getYear } from 'date-fns/getYear';
import { endOfYear } from 'date-fns/endOfYear';
import { addWeeks } from 'date-fns/addWeeks';
import { subDays } from 'date-fns/subDays';
import { startOfWeek } from 'date-fns/startOfWeek';
import { startOfYear } from 'date-fns/startOfYear';
import { setHours } from 'date-fns/setHours';
import { setMinutes } from 'date-fns/setMinutes';


const classTypes: ClassType[] = [
    {
        id: 'ct-private',
        name: 'Private',
        abbreviation: 'P',
        maxCapacity: 1,
        pricing: {
            Regular: { '1': 120, '5': 575, '10': 1100 },
            Master: { '1': 150, '5': 720, '10': 1400 },
        },
    },
    {
        id: 'ct-duet',
        name: 'Duet',
        abbreviation: 'D',
        maxCapacity: 2,
        pricing: {
            Regular: { '1': 70, '5': 325, '10': 600 },
            Master: { '1': 90, '5': 425, '10': 800 },
        },
    },
    {
        id: 'ct-group',
        name: 'Group',
        abbreviation: 'G',
        maxCapacity: 4,
        pricing: {
            Regular: { '1': 50, '5': 225, '10': 400 },
            Master: { '1': 65, '5': 300, '10': 550 },
        },
    },
];

const trainers: Trainer[] = [
    {
        id: 'trainer-1',
        firstName: 'Isabella',
        lastName: 'Rossi',
        email: 'isabella.r@studiopro.com',
        phone: '5550101',
        specialization: 'Reformer, Injury Rehab',
        level: 'Master',
        paymentRates: { 'ct-private': 0.65, 'ct-duet': 0.6, 'ct-group': 0.55 },
        availability: {
            Monday: [{ start: '08:00', end: '16:00' }],
            Tuesday: [{ start: '10:00', end: '18:00' }],
            Thursday: [{ start: '08:00', end: '16:00' }],
            Friday: [{ start: '09:00', end: '14:00' }],
        },
        avatarUrl: 'https://i.pravatar.cc/150?u=isabella',
        color: 'purple',
    },
    {
        id: 'trainer-2',
        firstName: 'Ben',
        lastName: 'Carter',
        email: 'ben.c@studiopro.com',
        phone: '5550102',
        specialization: 'Mat Pilates, HIIT',
        level: 'Regular',
        paymentRates: { 'ct-private': 0.55, 'ct-duet': 0.5, 'ct-group': 0.45 },
        availability: {
            Monday: [{ start: '12:00', end: '20:00' }],
            Wednesday: [{ start: '07:00', end: '15:00' }],
            Friday: [{ start: '12:00', end: '20:00' }],
            Saturday: [{ start: '09:00', end: '13:00' }],
        },
        avatarUrl: 'https://i.pravatar.cc/150?u=ben2',
        color: 'sky',
    },
    {
        id: 'trainer-3',
        firstName: 'Chloe',
        lastName: 'Davis',
        email: 'chloe.d@studiopro.com',
        phone: '5550103',
        specialization: 'Pre-natal, Barre',
        level: 'Regular',
        paymentRates: { 'ct-private': 0.6, 'ct-duet': 0.55, 'ct-group': 0.5 },
        availability: {
            Tuesday: [{ start: '07:00', end: '15:00' }],
            Thursday: [{ start: '07:00', end: '15:00' }],
            Friday: [{ start: '08:00', end: '12:00' }],
        },
        avatarUrl: 'https://i.pravatar.cc/150?u=chloe2',
        color: 'rose',
    },
    {
        id: 'trainer-4',
        firstName: 'Liam',
        lastName: 'Wilson',
        email: 'liam.w@studiopro.com',
        phone: '5550104',
        specialization: 'Athletic Conditioning, Advanced Mat',
        level: 'Master',
        paymentRates: { 'ct-private': 0.7, 'ct-duet': 0.65, 'ct-group': 0.6 },
        availability: {
            Monday: [{ start: '09:00', end: '17:00' }],
            Wednesday: [{ start: '11:00', end: '19:00' }],
            Thursday: [{ start: '10:00', end: '18:00' }],
        },
        avatarUrl: 'https://i.pravatar.cc/150?u=liam2',
        color: 'teal',
    }
];

const generateCustomers = (count: number): Customer[] => {
    const firstNames = ["Emma", "Olivia", "Ava", "Sophia", "Mia", "Amelia", "Harper", "Evelyn", "Abigail", "Emily", "Noah", "Liam", "William", "Mason", "James", "Benjamin", "Jacob", "Michael", "Elijah", "Ethan", "Aria", "Luna", "Camila", "Gianna", "Lily", "Zoe", "Stella", "Aurora", "Hazel", "Leah", "Kai", "Leo", "Miles", "Rowan", "Asher", "Silas", "Ezra", "Luca", "Theo", "Axel"];
    const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];
    const customers: Customer[] = [];
    const sampleNotes = [
        "Recovering from a minor knee injury. Avoid high-impact exercises and focus on VMO strengthening.",
        "Prefers sessions with Isabella. Always brings their own mat.",
        "Training for a marathon. Likes to incorporate more stretching and core work.",
        "VIP client. Offer a bottle of water at the start of each session.",
        "Has a shoulder impingement on the right side. Be mindful during overhead movements.",
        "Interested in the upcoming Barre workshop.",
        "Always asks for extra ab work at the end of the session."
    ];

    for (let i = 1; i <= count; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        
        customers.push({
            id: `customer-${i}`,
            firstName,
            lastName,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.com`,
            phone: `55501${(100 + i).toString().padStart(2, '0')}`,
            packages: [],
            avatarUrl: `https://i.pravatar.cc/150?u=customer-${i}`,
            birthDate: new Date(1980 + Math.floor(Math.random() * 25), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
            notes: Math.random() < 0.3 ? sampleNotes[Math.floor(Math.random() * sampleNotes.length)] : undefined,
            isArchived: false,
        });
    }
    return customers;
};


const generateYearlyBookings = (trainers: Trainer[], customers: Customer[], classTypes: ClassType[], todayReference: Date): Booking[] => {
    const yearBookings: Booking[] = [];
    let bookingIdCounter = 1;
    const currentYear = getYear(todayReference);
    const yearStart = startOfYear(todayReference);
    const yearEnd = endOfYear(todayReference);

    const days = eachDayOfInterval({ start: yearStart, end: yearEnd });

    days.forEach(day => {
        const dayOfWeek = getDay(day); // Sunday is 0

        if (dayOfWeek === 0) return; // Sundays are off

        let numSessions;
        if (dayOfWeek === 6) { // Saturday
            numSessions = 4 + Math.floor(Math.random() * 2); // 4-5 sessions
        } else { // Weekdays
            numSessions = 10 + Math.floor(Math.random() * 11); // 10-20 sessions
        }

        const potentialTimeSlots = [];
        for (let hour = 8; hour < 21; hour++) {
            for (const minute of [0, 15, 30, 45]) {
                potentialTimeSlots.push({ hour, minute });
            }
        }
        
        potentialTimeSlots.sort(() => 0.5 - Math.random());

        for (let i = 0; i < numSessions; i++) {
            const timeSlot = potentialTimeSlots[i % potentialTimeSlots.length];
            const dateTime = setMinutes(setHours(day, timeSlot.hour), timeSlot.minute);

            const randomTrainer = trainers[Math.floor(Math.random() * trainers.length)];
            const randomClassType = classTypes[Math.floor(Math.random() * classTypes.length)];

            let numCustomers = 1;
            if (randomClassType.id === 'ct-duet') {
                numCustomers = 2;
            } else if (randomClassType.id === 'ct-group') {
                numCustomers = 2 + Math.floor(Math.random() * (randomClassType.maxCapacity - 1));
            }

            const shuffledCustomers = [...customers].sort(() => 0.5 - Math.random());
            const customerIds = shuffledCustomers.slice(0, numCustomers).map(c => c.id);

            if (customerIds.length < numCustomers) continue;

            let status = BookingStatus.Booked;
            if (isBefore(dateTime, todayReference)) {
                const randomStatus = Math.random();
                if (randomStatus < 0.90) { // 90% Completed
                    status = BookingStatus.Completed;
                } else if (randomStatus < 0.95) { // 5% Late Cancelled
                    status = BookingStatus.CancelledLate;
                } else { // 5% Cancelled
                    status = BookingStatus.Cancelled;
                }
            }

            yearBookings.push({
                id: `booking-gen-${bookingIdCounter++}`,
                dateTime,
                classTypeId: randomClassType.id,
                trainerId: randomTrainer.id,
                customerIds,
                status,
            });
        }
    });
    return yearBookings;
};

// --- DATA GENERATION ---
const todayReference = new Date();
const customers = generateCustomers(50);
const bookings = generateYearlyBookings(trainers, customers, classTypes, todayReference);
const customerPayments: CustomerPayment[] = [];
const customerIdsForDebt = ['customer-10', 'customer-21'];


// Post-process to add packages and payments
customers.forEach((customer) => {
    // Skip package generation for customers who will have debts
    if (customerIdsForDebt.includes(customer.id)) {
        return;
    }
    // Give packages to ~80% of other customers
    if (Math.random() < 0.8) {
        const numPackages = 1 + Math.floor(Math.random() * 3); // 1-3 packages
        for (let i = 0; i < numPackages; i++) {
            const classType = classTypes[Math.floor(Math.random() * classTypes.length)];
            const trainerLevel = Math.random() < 0.4 ? 'Master' : 'Regular';
            const sessionCountOptions = [5, 10];
            const totalSessions = sessionCountOptions[Math.floor(Math.random() * sessionCountOptions.length)];
            const price = classType.pricing[trainerLevel][totalSessions.toString() as '5' | '10'];
            
            const purchaseDate = subDays(todayReference, Math.floor(Math.random() * 365));
            const expirationDate = addMonths(purchaseDate, 3);
            
            const isOldPackage = Math.random() > 0.6;
            const sessionsRemaining = isOldPackage ? 0 : Math.floor(Math.random() * totalSessions);
            const isArchived = isOldPackage && sessionsRemaining === 0;

            const newPackage: Package = {
                id: `pkg-${customer.id}-${i}`,
                classTypeId: classType.id,
                trainerLevel,
                price,
                totalSessions,
                sessionsRemaining,
                purchaseDate,
                expirationDate,
                isArchived,
            };
            customer.packages.push(newPackage);
            
            customerPayments.push({
                id: `cp-${customer.id}-${i}`,
                customerId: customer.id,
                packageId: newPackage.id,
                amount: newPackage.price,
                date: newPackage.purchaseDate,
                method: ['Credit Card', 'Cash', 'Bank Transfer'][Math.floor(Math.random() * 3)] as 'Credit Card' | 'Cash' | 'Bank Transfer',
            });
        }
    }
});

// Manually create debt scenarios by reverting some completed bookings to "Booked" for package-less customers
const debtCountPerCustomer: { [key: string]: number } = {
    'customer-10': 2,
    'customer-21': 1,
};

customerIdsForDebt.forEach(customerId => {
    const bookingsToChange = bookings.filter(
        b => b.customerIds.includes(customerId) &&
             b.status === BookingStatus.Completed &&
             isBefore(new Date(b.dateTime), todayReference)
    ).slice(0, debtCountPerCustomer[customerId]);

    bookingsToChange.forEach(bookingToChange => {
        const bookingIndex = bookings.findIndex(b => b.id === bookingToChange.id);
        if (bookingIndex !== -1) {
            bookings[bookingIndex].status = BookingStatus.Booked;
        }
    });
});


// Generate some trainer payments for history
const payments: Payment[] = [];
let dateCursor = startOfWeek(startOfYear(todayReference), { weekStartsOn: 1 });
while (isBefore(dateCursor, todayReference)) {
    const weekStart = dateCursor;
    const weekEnd = endOfWeek(dateCursor, { weekStartsOn: 1 });
    
    // Only generate payments for past weeks, not the current one
    if(isBefore(weekEnd, startOfWeek(todayReference, { weekStartsOn: 1 }))) {
        trainers.forEach(trainer => {
            const weekEarnings = bookings.filter(b => {
                const bookingDate = new Date(b.dateTime);
                return b.trainerId === trainer.id &&
                    bookingDate >= weekStart &&
                    bookingDate <= weekEnd &&
                    (b.status === BookingStatus.Completed || b.status === BookingStatus.CancelledLate);
            }).reduce((sum, b) => {
                const classType = classTypes.find(ct => ct.id === b.classTypeId);
                const trainerRate = trainer.paymentRates[b.classTypeId] || 0;
                if (!classType) return sum;
                const pricePerSession = classType.pricing[trainer.level]['1'] || 0;
                return sum + (pricePerSession * trainerRate);
            }, 0);

            if (weekEarnings > 0) {
                 const periodString = `Week of ${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'dd, yyyy')}`;
                 const newPayment: Payment = {
                    id: `payment-${trainer.id}-${format(weekStart, 'yyyyMMdd')}`,
                    trainerId: trainer.id,
                    amount: weekEarnings,
                    paymentDate: weekEnd,
                    settledPeriods: [{
                        start: weekStart,
                        end: weekEnd,
                        periodString: periodString
                    }],
                    // For historical reconstruction
                    balanceBroughtForward: 0,
                    manualAdjustment: 0,
                    advanceDeductionsTotal: 0,
                    earningsForPeriod: weekEarnings,
                };
                payments.push(newPayment);
            }
        });
    }
    dateCursor = addWeeks(dateCursor, 1);
}


const alerts: Alert[] = [
    { id: 'alert-1', message: "Olivia Smith's package is running low (2 sessions left).", timestamp: subDays(todayReference, 1) },
    { id: 'alert-2', message: "Expiring Package Alert: Liam Garcia has a package expiring in 5 days.", timestamp: todayReference },
];

const advancePayments: AdvancePayment[] = [
    { id: 'adv-1', trainerId: 'trainer-1', amount: 200, date: subDays(todayReference, 2), notes: 'Equipment purchase', isApplied: false },
];

const studioSettings: StudioSettings = {
    currencySymbol: '₺',
    language: 'en-US',
    cancellationPolicyHours: 24,
    timezone: 'Europe/Istanbul',
    paymentMethods: ['Credit Card', 'Cash', 'Bank Transfer'],
    notificationSettings: {
        lowPackageEmail: true,
        expiringPackageEmail: true,
        upcomingBirthdayEmail: true,
    },
    inactivityThresholdDays: 90,
};

const sessionDebts: SessionDebt[] = [];


export const DUMMY_DATA = {
    classTypes,
    trainers,
    customers,
    bookings,
    alerts,
    payments,
    customerPayments,
    advancePayments,
    studioSettings,
    sessionDebts,
};