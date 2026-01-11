// App-wide context for state management (offline-first store)
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
    User, UserRole, Item, Category, Sale, SaleItem, PaymentMethod, SaleStatus,
    POSWithdrawalFloat, POSWithdrawalTransaction, Restock, AppState, SyncStatus, InventoryLog
} from '../types';
import { supabase } from '../services/supabase';
import { initDatabase, getDatabase, clearAllData } from '../database';
import { performFullSync, checkConnectivity, addToSyncQueue, getPendingSyncCount, getLastSyncTime } from '../sync/SyncManager';
import { generateSaleNumber, generateSKU, generateUUID, generateTransactionNumber } from '../utils';
import * as Network from 'expo-network';

interface ShopContextType {
    // State
    currentUser: User | null;
    shopName: string;
    items: Item[];
    categories: Category[];
    sales: Sale[];
    posFloats: POSWithdrawalFloat[];
    posTransactions: POSWithdrawalTransaction[];
    inventoryLogs: InventoryLog[];
    isLoading: boolean;
    error: string | null;
    appState: AppState;

    // Auth
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;

    // Items
    addItem: (item: Partial<Item>) => Promise<void>;
    updateItem: (id: string, updates: Partial<Item>) => Promise<void>;
    updateItemWithReason: (id: string, updates: Partial<Item>, reason: string) => Promise<void>;
    deleteItem: (id: string) => Promise<void>;

    // Categories
    addCategory: (name: string) => Promise<string>;

    // Sales
    addSale: (saleData: { items: { id: string; quantity: number }[]; paymentMethod: PaymentMethod; additionalCharges: number }) => Promise<void>;

    // POS
    startPOSFloat: (openingBalance: number) => Promise<void>;
    addPOSTransaction: (data: any) => Promise<string>;

    // Sync
    syncNow: () => Promise<void>;
    clearError: () => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [shopName, setShopName] = useState<string>('NaijaShop');
    const [items, setItems] = useState<Item[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [posFloats, setPosFloats] = useState<POSWithdrawalFloat[]>([]);
    const [posTransactions, setPosTransactions] = useState<POSWithdrawalTransaction[]>([]);
    const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [appState, setAppState] = useState<AppState>({
        isOnline: true,
        syncStatus: 'synced',
        lastSyncTime: null,
        pendingSyncCount: 0,
    });

    const clearError = () => setError(null);

    // Load data from local database
    const loadLocalData = useCallback(async () => {
        try {
            const db = await getDatabase();

            // Load items
            const localItems = await db.getAllAsync<any>('SELECT * FROM items ORDER BY name');
            setItems(localItems.map((i: any) => ({
                id: i.id, name: i.name, sku: i.sku, categoryId: i.category_id, unit: i.unit,
                costPrice: i.cost_price, sellingPrice: i.selling_price, quantityInStock: i.quantity_in_stock,
                reorderLevel: i.reorder_level, allowFractional: i.allow_fractional === 1,
                createdAt: i.created_at, updatedAt: i.updated_at
            })));

            // Load categories
            const localCategories = await db.getAllAsync<any>('SELECT * FROM categories ORDER BY name');
            setCategories(localCategories.map((c: any) => ({ id: c.id, name: c.name, createdAt: c.created_at })));

            // Load sales
            const localSales = await db.getAllAsync<any>('SELECT * FROM sales ORDER BY created_at DESC');
            setSales(localSales.map((s: any) => ({
                id: s.id, saleNumber: s.sale_number, status: s.status, subtotal: s.subtotal,
                additionalCharges: s.additional_charges, totalAmount: s.total_amount, profitAmount: s.profit_amount,
                paymentMethod: s.payment_method, createdBy: s.created_by, saleDate: s.sale_date,
                createdAt: s.created_at, updatedAt: s.updated_at, returnReason: s.return_reason
            })));

            // Load POS floats
            const localFloats = await db.getAllAsync<any>('SELECT * FROM pos_floats ORDER BY created_at DESC');
            setPosFloats(localFloats.map((f: any) => ({
                id: f.id, date: f.date, openingBalance: f.opening_balance, currentBalance: f.current_balance,
                closingBalance: f.closing_balance, totalWithdrawalsProcessed: f.total_withdrawals_processed,
                totalChargesEarned: f.total_charges_earned, status: f.status, createdBy: f.created_by,
                createdAt: f.created_at, updatedAt: f.updated_at
            })));

            // Load POS transactions
            const localTxs = await db.getAllAsync<any>('SELECT * FROM pos_transactions ORDER BY created_at DESC');
            setPosTransactions(localTxs.map((t: any) => ({
                id: t.id, floatId: t.float_id, transactionNumber: t.transaction_number,
                customerName: t.customer_name, withdrawalAmount: t.withdrawal_amount,
                serviceCharge: t.service_charge, totalPaid: t.total_paid, paymentMethod: t.payment_method,
                createdBy: t.created_by, transactionDate: t.transaction_date, createdAt: t.created_at
            })));

            // Load inventory logs
            const localLogs = await db.getAllAsync<any>('SELECT * FROM inventory_logs ORDER BY created_at DESC');
            setInventoryLogs(localLogs.map((l: any) => ({
                id: l.id, itemId: l.item_id, itemName: l.item_name, userId: l.user_id,
                userName: l.user_name, changeType: l.change_type, fieldChanged: l.field_changed,
                oldValue: l.old_value, newValue: l.new_value, reason: l.reason, createdAt: l.created_at
            })));

            // Update app state
            const pendingCount = await getPendingSyncCount();
            const lastSync = await getLastSyncTime();
            const isOnline = await checkConnectivity();

            setAppState(prev => ({
                ...prev,
                isOnline,
                pendingSyncCount: pendingCount,
                lastSyncTime: lastSync,
                syncStatus: pendingCount > 0 ? 'pending' : (isOnline ? 'synced' : 'offline')
            }));
        } catch (err: any) {
            console.error('Error loading local data:', err);
        }
    }, []);

    // Initialize app
    useEffect(() => {
        const init = async () => {
            try {
                // Initialize database
                await initDatabase();

                // Check for existing session
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    setCurrentUser({
                        id: session.user.id,
                        email: session.user.email!,
                        fullName: session.user.user_metadata.full_name || 'User',
                        role: session.user.user_metadata.role || UserRole.SALESPERSON,
                        createdAt: session.user.created_at,
                    });
                    setShopName(session.user.user_metadata.shop_name || 'NaijaShop');

                    // Load local data
                    await loadLocalData();

                    // Try to sync with server if online
                    const isOnline = await checkConnectivity();
                    if (isOnline) {
                        await performFullSync((status) => setAppState(prev => ({ ...prev, syncStatus: status })));
                        await loadLocalData();
                    }
                }
            } catch (err: any) {
                console.error('Init error:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        init();

        // Listen for network changes
        const unsubscribe = Network.addNetworkStateListener(async (state) => {
            const isOnline = state.isConnected && state.isInternetReachable;
            setAppState(prev => ({ ...prev, isOnline: isOnline || false }));

            // Auto-sync when coming back online
            if (isOnline) {
                await performFullSync((status) => setAppState(prev => ({ ...prev, syncStatus: status })));
                await loadLocalData();
            }
        });

        return () => {
            unsubscribe?.remove?.();
        };
    }, [loadLocalData]);

    // Login
    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;

            if (data.user) {
                setCurrentUser({
                    id: data.user.id,
                    email: data.user.email!,
                    fullName: data.user.user_metadata.full_name || 'User',
                    role: data.user.user_metadata.role || UserRole.SALESPERSON,
                    createdAt: data.user.created_at,
                });
                setShopName(data.user.user_metadata.shop_name || 'NaijaShop');

                // Sync data after login
                await performFullSync((status) => setAppState(prev => ({ ...prev, syncStatus: status })));
                await loadLocalData();
            }
        } catch (err: any) {
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // Logout
    const logout = async () => {
        await supabase.auth.signOut();
        await clearAllData();
        setCurrentUser(null);
        setItems([]);
        setCategories([]);
        setSales([]);
        setPosFloats([]);
        setPosTransactions([]);
    };

    // Add Item
    const addItem = async (item: Partial<Item>) => {
        const db = await getDatabase();
        const id = generateUUID();
        const sku = item.sku || generateSKU(item.name || 'ITEM');
        const now = new Date().toISOString();

        const newItem = {
            id, name: item.name, sku, category_id: item.categoryId, unit: item.unit || 'pcs',
            cost_price: item.costPrice || 0, selling_price: item.sellingPrice || 0,
            quantity_in_stock: item.quantityInStock || 0, reorder_level: item.reorderLevel || 5,
            allow_fractional: item.allowFractional ? 1 : 0, created_at: now, updated_at: now
        };

        await db.runAsync(
            `INSERT INTO items (id, name, sku, category_id, unit, cost_price, selling_price, 
       quantity_in_stock, reorder_level, allow_fractional, created_at, updated_at, is_synced, pending_operation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'create')`,
            [newItem.id, newItem.name, newItem.sku, newItem.category_id, newItem.unit,
            newItem.cost_price, newItem.selling_price, newItem.quantity_in_stock,
            newItem.reorder_level, newItem.allow_fractional, newItem.created_at, newItem.updated_at]
        );

        // Add to sync queue
        await addToSyncQueue('create', 'items', id, newItem);

        // Reload local data
        await loadLocalData();

        // Try to sync if online
        if (appState.isOnline) {
            await performFullSync((status) => setAppState(prev => ({ ...prev, syncStatus: status })));
        }
    };

    // Update Item
    const updateItem = async (id: string, updates: Partial<Item>) => {
        const db = await getDatabase();
        const now = new Date().toISOString();

        const dbUpdates: any = { updated_at: now };
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.sku) dbUpdates.sku = updates.sku;
        if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId;
        if (updates.unit) dbUpdates.unit = updates.unit;
        if (updates.costPrice !== undefined) dbUpdates.cost_price = updates.costPrice;
        if (updates.sellingPrice !== undefined) dbUpdates.selling_price = updates.sellingPrice;
        if (updates.quantityInStock !== undefined) dbUpdates.quantity_in_stock = updates.quantityInStock;
        if (updates.reorderLevel !== undefined) dbUpdates.reorder_level = updates.reorderLevel;
        if (updates.allowFractional !== undefined) dbUpdates.allow_fractional = updates.allowFractional ? 1 : 0;

        const setClauses = Object.keys(dbUpdates).map(k => `${k} = ?`).join(', ');
        await db.runAsync(
            `UPDATE items SET ${setClauses}, is_synced = 0, pending_operation = 'update' WHERE id = ?`,
            [...Object.values(dbUpdates), id]
        );

        await addToSyncQueue('update', 'items', id, dbUpdates);
        await loadLocalData();

        if (appState.isOnline) {
            await performFullSync((status) => setAppState(prev => ({ ...prev, syncStatus: status })));
        }
    };

    // Update Item With Reason (for salesperson - creates audit log)
    const updateItemWithReason = async (id: string, updates: Partial<Item>, reason: string) => {
        if (!currentUser) throw new Error('Not logged in');

        const db = await getDatabase();
        const now = new Date().toISOString();
        const existingItem = items.find(i => i.id === id);
        if (!existingItem) throw new Error('Item not found');

        // Create audit log entries for each changed field
        const logFields: { field: string; oldVal: string; newVal: string }[] = [];

        if (updates.name && updates.name !== existingItem.name) {
            logFields.push({ field: 'name', oldVal: existingItem.name, newVal: updates.name });
        }
        if (updates.sellingPrice !== undefined && updates.sellingPrice !== existingItem.sellingPrice) {
            logFields.push({ field: 'sellingPrice', oldVal: String(existingItem.sellingPrice), newVal: String(updates.sellingPrice) });
        }
        if (updates.costPrice !== undefined && updates.costPrice !== existingItem.costPrice) {
            logFields.push({ field: 'costPrice', oldVal: String(existingItem.costPrice), newVal: String(updates.costPrice) });
        }
        if (updates.quantityInStock !== undefined && updates.quantityInStock !== existingItem.quantityInStock) {
            logFields.push({ field: 'quantityInStock', oldVal: String(existingItem.quantityInStock), newVal: String(updates.quantityInStock) });
        }
        if (updates.reorderLevel !== undefined && updates.reorderLevel !== existingItem.reorderLevel) {
            logFields.push({ field: 'reorderLevel', oldVal: String(existingItem.reorderLevel), newVal: String(updates.reorderLevel) });
        }

        // Insert audit logs
        for (const log of logFields) {
            const logId = generateUUID();
            await db.runAsync(
                `INSERT INTO inventory_logs (id, item_id, item_name, user_id, user_name, change_type, 
                 field_changed, old_value, new_value, reason, created_at, is_synced, pending_operation)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'create')`,
                [logId, id, existingItem.name, currentUser.id, currentUser.fullName, 'update',
                    log.field, log.oldVal, log.newVal, reason, now]
            );
            await addToSyncQueue('create', 'inventory_logs', logId, {
                id: logId, item_id: id, item_name: existingItem.name, user_id: currentUser.id,
                user_name: currentUser.fullName, change_type: 'update', field_changed: log.field,
                old_value: log.oldVal, new_value: log.newVal, reason, created_at: now
            });
        }

        // Perform the actual update
        await updateItem(id, updates);
    };

    // Delete Item
    const deleteItem = async (id: string) => {
        const db = await getDatabase();
        await db.runAsync('DELETE FROM items WHERE id = ?', [id]);
        await addToSyncQueue('delete', 'items', id, {});
        await loadLocalData();

        if (appState.isOnline) {
            await performFullSync((status) => setAppState(prev => ({ ...prev, syncStatus: status })));
        }
    };

    // Add Category
    const addCategory = async (name: string): Promise<string> => {
        const db = await getDatabase();
        const id = generateUUID();
        const now = new Date().toISOString();

        await db.runAsync(
            `INSERT INTO categories (id, name, created_at, is_synced, pending_operation)
       VALUES (?, ?, ?, 0, 'create')`,
            [id, name, now]
        );

        await addToSyncQueue('create', 'categories', id, { id, name, created_at: now });
        await loadLocalData();

        return id;
    };

    // Add Sale (Offline-first)
    const addSale = async (saleData: { items: { id: string; quantity: number }[]; paymentMethod: PaymentMethod; additionalCharges: number }) => {
        if (!currentUser) throw new Error('Not logged in');

        const db = await getDatabase();
        const saleId = generateUUID();
        const saleNumber = generateSaleNumber();
        const now = new Date().toISOString();
        const today = now.split('T')[0];

        let subtotal = 0;
        let totalCost = 0;

        // Calculate totals and prepare sale items
        const saleItems: any[] = [];
        for (const cartItem of saleData.items) {
            const item = items.find(i => i.id === cartItem.id);
            if (!item) continue;

            const lineTotal = item.sellingPrice * cartItem.quantity;
            subtotal += lineTotal;
            totalCost += item.costPrice * cartItem.quantity;

            saleItems.push({
                id: generateUUID(),
                sale_id: saleId,
                item_id: item.id,
                item_name: item.name,
                quantity: cartItem.quantity,
                unit_price: item.sellingPrice,
                cost_price: item.costPrice,
                line_total: lineTotal,
                profit_margin: ((item.sellingPrice - item.costPrice) / item.sellingPrice) * 100,
                created_at: now
            });

            // Update local inventory
            const newStock = item.quantityInStock - cartItem.quantity;
            await db.runAsync(
                `UPDATE items SET quantity_in_stock = ?, updated_at = ?, is_synced = 0, pending_operation = 'update' WHERE id = ?`,
                [newStock, now, item.id]
            );
            await addToSyncQueue('update', 'items', item.id, { quantity_in_stock: newStock, updated_at: now });
        }

        const totalAmount = subtotal + saleData.additionalCharges;
        const profitAmount = totalAmount - totalCost;

        const saleRecord = {
            id: saleId, sale_number: saleNumber, status: SaleStatus.COMPLETED,
            subtotal, additional_charges: saleData.additionalCharges, total_amount: totalAmount,
            profit_amount: profitAmount, payment_method: saleData.paymentMethod,
            created_by: currentUser.id, sale_date: today, created_at: now, updated_at: now
        };

        // Insert sale locally
        await db.runAsync(
            `INSERT INTO sales (id, sale_number, status, subtotal, additional_charges, total_amount,
       profit_amount, payment_method, created_by, sale_date, created_at, updated_at, is_synced, pending_operation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'create')`,
            [saleRecord.id, saleRecord.sale_number, saleRecord.status, saleRecord.subtotal,
            saleRecord.additional_charges, saleRecord.total_amount, saleRecord.profit_amount,
            saleRecord.payment_method, saleRecord.created_by, saleRecord.sale_date,
            saleRecord.created_at, saleRecord.updated_at]
        );

        // Insert sale items
        for (const si of saleItems) {
            await db.runAsync(
                `INSERT INTO sale_items (id, sale_id, item_id, item_name, quantity, unit_price, cost_price,
         line_total, profit_margin, created_at, is_synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
                [si.id, si.sale_id, si.item_id, si.item_name, si.quantity, si.unit_price,
                si.cost_price, si.line_total, si.profit_margin, si.created_at]
            );
        }

        // Add to sync queue
        await addToSyncQueue('create', 'sales', saleId, saleRecord);
        for (const si of saleItems) {
            await addToSyncQueue('create', 'sale_items', si.id, si);
        }

        await loadLocalData();

        if (appState.isOnline) {
            await performFullSync((status) => setAppState(prev => ({ ...prev, syncStatus: status })));
        }
    };

    // Start POS Float
    const startPOSFloat = async (openingBalance: number) => {
        if (!currentUser) throw new Error('Not logged in');

        const db = await getDatabase();
        const id = generateUUID();
        const now = new Date().toISOString();
        const today = now.split('T')[0];

        const floatRecord = {
            id, date: today, opening_balance: openingBalance, current_balance: openingBalance,
            status: 'active', created_by: currentUser.id, created_at: now, updated_at: now
        };

        await db.runAsync(
            `INSERT INTO pos_floats (id, date, opening_balance, current_balance, status, created_by, 
       created_at, updated_at, is_synced, pending_operation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'create')`,
            [id, today, openingBalance, openingBalance, 'active', currentUser.id, now, now]
        );

        await addToSyncQueue('create', 'pos_floats', id, floatRecord);
        await loadLocalData();

        if (appState.isOnline) {
            await performFullSync((status) => setAppState(prev => ({ ...prev, syncStatus: status })));
        }
    };

    // Add POS Transaction
    const addPOSTransaction = async (data: any): Promise<string> => {
        if (!currentUser) throw new Error('Not logged in');

        const activeFloat = posFloats.find(f => f.status === 'active');
        if (!activeFloat) throw new Error('No active float');

        const db = await getDatabase();
        const id = generateUUID();
        const txNumber = generateTransactionNumber();
        const now = new Date().toISOString();
        const totalPaid = data.withdrawalAmount + data.serviceCharge;

        const txRecord = {
            id, float_id: activeFloat.id, transaction_number: txNumber,
            customer_name: data.customerName, withdrawal_amount: data.withdrawalAmount,
            service_charge: data.serviceCharge, total_paid: totalPaid,
            payment_method: data.paymentMethod, created_by: currentUser.id,
            transaction_date: now, created_at: now
        };

        await db.runAsync(
            `INSERT INTO pos_transactions (id, float_id, transaction_number, customer_name, withdrawal_amount,
       service_charge, total_paid, payment_method, created_by, transaction_date, created_at, is_synced, pending_operation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'create')`,
            [id, activeFloat.id, txNumber, data.customerName, data.withdrawalAmount,
                data.serviceCharge, totalPaid, data.paymentMethod, currentUser.id, now, now]
        );

        await addToSyncQueue('create', 'pos_transactions', id, txRecord);
        await loadLocalData();

        if (appState.isOnline) {
            await performFullSync((status) => setAppState(prev => ({ ...prev, syncStatus: status })));
        }

        return txNumber;
    };

    // Manual sync trigger
    const syncNow = async () => {
        await performFullSync((status) => setAppState(prev => ({ ...prev, syncStatus: status })));
        await loadLocalData();
    };

    return (
        <ShopContext.Provider value={{
            currentUser, shopName, items, categories, sales, posFloats, posTransactions,
            inventoryLogs, isLoading, error, appState, login, logout, addItem, updateItem,
            updateItemWithReason, deleteItem, addCategory, addSale, startPOSFloat,
            addPOSTransaction, syncNow, clearError
        }}>
            {children}
        </ShopContext.Provider>
    );
};

export const useShop = (): ShopContextType => {
    const context = useContext(ShopContext);
    if (!context) {
        throw new Error('useShop must be used within ShopProvider');
    }
    return context;
};
