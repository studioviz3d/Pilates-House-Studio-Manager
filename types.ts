export enum UserRole {
    Admin = 'admin',
    Trainer = 'trainer',
    Customer = 'customer',
    SuperAdmin = 'super-admin',
}

export enum BookingStatus {
    Booked = 'Booked',
    Completed = 'Completed',
    Cancelled = 'Cancelled',
    CancelledLate = 'Cancelled - Late',
    Deleted = 'Deleted',
}

export type TrainerLevel = 'Regular' | 'Master';

export type PaymentMethod = string;

export interface Package {
    id: string;
    classTypeId: string;
    trainerLevel: TrainerLevel;
    price: number;
    totalSessions: number;
    sessionsRemaining: number;
    purchaseDate: Date;
    expirationDate: Date;
    isArchived: boolean;
}

export interface Customer {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    packages: Package[];
    avatarUrl: string;
    birthDate?: Date;
    notes?: string;
    isArchived: boolean;
}

export type PaymentRates = { [classTypeId: string]: number };

export interface Trainer {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    specialization: string;
    level: TrainerLevel;
    paymentRates: PaymentRates;
    availability?: {
        [day: string]: { start: string; end: string }[];
    };
    avatarUrl: string;
    color: string;
}

export interface Booking {
    id: string;
    dateTime: Date;
    classTypeId: string;
    trainerId: string;
    customerIds: string[];
    status: BookingStatus;
    notes?: string;
    deductedFromPackageId?: Record<string, string>; // { customerId: packageId }
}

export interface SessionDebt {
    id: string;
    customerId: string;
    bookingId: string;
    classTypeId: string;
    trainerLevel: TrainerLevel;
    date: Date;
    isResolved: boolean;
    resolvingPackageId?: string;
    resolvedBy?: 'auto_package' | 'manual_package' | 'manual_payment';
    paymentId?: string;
}

export interface ClassType {
    id: string;
    name: string;
    abbreviation: string;
    maxCapacity: number;
    pricing: {
        [key in TrainerLevel]: {
            '1': number;
            '5': number;
            '10': number;
        };
    };
}

export interface SettledPeriod {
    start: Date;
    end: Date;
    periodString: string;
}

export interface Payment {
    id: string;
    trainerId: string;
    amount: number;
    paymentDate: Date;
    settledPeriods: SettledPeriod[];
    balanceBroughtForward?: number;
    manualAdjustment?: number;
    advanceDeductionsTotal?: number;
    earningsForPeriod?: number; // The subtotal for the primary period of this payment
}

export interface CustomerPayment {
    id:string;
    customerId: string;
    packageId: string;
    amount: number;
    date: Date;
    method: PaymentMethod;
}

export interface AdvancePayment {
    id: string;
    trainerId: string;
    amount: number;
    date: Date;
    notes: string;
    isApplied: boolean;
    appliedPaymentId?: string;
}

export interface Alert {
    id: string;
    message: string;
    timestamp: Date;
}

export interface Notification {
    id: string;
    customerId: string;
    message: string;
    timestamp: Date;
    read: boolean;
}

export interface NotificationSettings {
    lowPackageEmail: boolean;
    expiringPackageEmail: boolean;
    upcomingBirthdayEmail: boolean;
}

export interface StudioSettings {
    currencySymbol: string;
    language: string;
    cancellationPolicyHours: number;
    timezone: string;
    paymentMethods: string[];
    notificationSettings: NotificationSettings;
    inactivityThresholdDays: number;
}

export interface LastAction {
    message: string;
    undo: () => void;
}

export interface UnpaidPeriod { 
    start: Date; 
    end: Date; 
    periodString: string; 
}

export interface PayoutCalculation {
    trainer: Trainer;
    thisWeekEarnings: number;
    balanceBroughtForward: number;
    unpaidPeriods: UnpaidPeriod[];
    advanceDeductions: number;
    totalDue: number;
    isSettled: boolean;
    paymentRecord?: Payment;
    manualAdjustment: number;
    includedSessions: Booking[];
    totalSessionEarnings: number;
};

export interface Studio {
  id: string;
  name: string;
  adminEmail: string;
  createdAt: Date;
  isArchived?: boolean;
}