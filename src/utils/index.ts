// Utility functions matching web app
import { format } from 'date-fns';

export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
};

export const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return format(date, 'h:mm a');
};

export const generateSaleNumber = (): string => {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `SL-${dateStr}-${random}`;
};

export const generateSKU = (name: string): string => {
    const prefix = name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'ITM';
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${random}`;
};

export const generateTransactionNumber = (): string => {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `POS-${random}`;
};

export const generateUUID = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};
