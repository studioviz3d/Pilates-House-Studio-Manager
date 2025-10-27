

import { format } from 'date-fns/format';

/**
 * Formats a string of digits into a (xxx) xxx-xxxx phone number format,
 * including partial formatting for a better as-you-type experience.
 * @param value - A string containing phone number digits.
 * @returns The formatted phone number string.
 */
export const formatPhoneNumber = (value: string): string => {
    if (!value) {
        return value;
    }
    // Clean the input to only contain digits
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;

    if (phoneNumberLength < 4) {
        return phoneNumber;
    }
    if (phoneNumberLength < 7) {
        return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
};


/**
 * Formats a Date object into a dd/MM/yyyy string.
 * @param date - The date to format.
 * @returns The formatted date string.
 */
export const formatDate = (date: Date): string => {
    try {
        return format(new Date(date), 'dd/MM/yyyy');
    } catch (error) {
        return 'Invalid Date';
    }
};

/**
 * Formats a Date object into a dd/MM/yyyy HH:mm string.
 * @param date - The date to format.
 * @returns The formatted date and time string.
 */
export const formatDateTime = (date: Date): string => {
     try {
        return format(new Date(date), 'dd/MM/yyyy HH:mm');
    } catch (error) {
        return 'Invalid Date';
    }
};