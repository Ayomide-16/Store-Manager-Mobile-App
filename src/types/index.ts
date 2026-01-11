// Types matching the web app's types.ts

export enum UserRole {
    ADMIN = 'admin',
    SALESPERSON = 'salesperson'
}

export interface User {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    createdAt: string;
}

export interface Category {
    id: string;
    name: string;
    createdAt: string;
}

export interface Item {
    id: string;
    name: string;
    sku: string;
    categoryId: string | null;
    unit: string;
    costPrice: number;
    sellingPrice: number;
    quantityInStock: number;
    reorderLevel: number;
    allowFractional: boolean;
    createdAt: string;
    updatedAt: string;
}

export enum SaleStatus {
    COMPLETED = 'completed',
    CANCELED = 'canceled',
    RETURNED = 'returned'
}

export enum PaymentMethod {
    CASH = 'cash',
    BANK_TRANSFER = 'bank_transfer',
    CARD = 'card'
}

export interface Sale {
    id: string;
    saleNumber: string;
    status: SaleStatus;
    subtotal: number;
    additionalCharges: number;
    totalAmount: number;
    profitAmount: number;
    paymentMethod: PaymentMethod;
    createdBy: string;
    saleDate: string;
    createdAt: string;
    updatedAt: string;
    returnReason?: string;
}

export interface SaleItem {
    id: string;
    saleId: string;
    itemId: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    costPrice: number;
    lineTotal: number;
    profitMargin: number;
    createdAt: string;
}

export interface POSWithdrawalFloat {
    id: string;
    date: string;
    openingBalance: number;
    currentBalance: number;
    closingBalance: number | null;
    totalWithdrawalsProcessed: number;
    totalChargesEarned: number;
    status: 'active' | 'closed';
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface POSWithdrawalTransaction {
    id: string;
    floatId: string;
    transactionNumber: string;
    customerName?: string;
    withdrawalAmount: number;
    serviceCharge: number;
    totalPaid: number;
    paymentMethod: 'card' | 'bank_transfer';
    createdBy: string;
    transactionDate: string;
    createdAt: string;
}

export interface POSChargeTier {
    id: string;
    minAmount: number;
    maxAmount: number;
    chargeAmount: number;
    isActive: boolean;
}

export interface Restock {
    id: string;
    supplierName: string;
    restockDate: string;
    totalAmount: number;
    notes?: string;
    createdBy: string;
    createdAt: string;
}

export interface RestockItem {
    id: string;
    restockId: string;
    itemId: string;
    quantity: number;
    unitCost: number;
    createdAt: string;
}

// Sync-related types
export interface SyncQueueItem {
    id: string;
    operation: 'create' | 'update' | 'delete';
    tableName: string;
    recordId: string;
    data: any;
    createdAt: string;
    retryCount: number;
}

export type SyncStatus = 'synced' | 'syncing' | 'pending' | 'offline' | 'error';

export interface AppState {
    isOnline: boolean;
    syncStatus: SyncStatus;
    lastSyncTime: string | null;
    pendingSyncCount: number;
}

// Inventory audit log for tracking changes
export interface InventoryLog {
    id: string;
    itemId: string;
    itemName: string;
    userId: string;
    userName: string;
    changeType: 'update' | 'create' | 'delete' | 'adjustment';
    fieldChanged: string;
    oldValue: string;
    newValue: string;
    reason: string;
    createdAt: string;
}
