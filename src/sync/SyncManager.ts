// Sync engine for bidirectional synchronization between local SQLite and Supabase
import * as Network from 'expo-network';
import { getDatabase } from '../database';
import { supabase } from '../services/supabase';
import { SyncStatus } from '../types';

// Check network connectivity
export const checkConnectivity = async (): Promise<boolean> => {
    try {
        const networkState = await Network.getNetworkStateAsync();
        return networkState.isConnected === true && networkState.isInternetReachable === true;
    } catch {
        return false;
    }
};

// Add operation to sync queue
export const addToSyncQueue = async (
    operation: 'create' | 'update' | 'delete',
    tableName: string,
    recordId: string,
    data: any,
    txDb?: any
): Promise<void> => {
    const db = txDb || await getDatabase();
    const id = `sq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db.runAsync(
        `INSERT INTO sync_queue (id, operation, table_name, record_id, data, created_at, retry_count)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
        [id, operation, tableName, recordId, JSON.stringify(data), new Date().toISOString()]
    );
};

// Get pending sync count
export const getPendingSyncCount = async (): Promise<number> => {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM sync_queue');
    return result?.count || 0;
};

// Get last sync time
export const getLastSyncTime = async (): Promise<string | null> => {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ value: string }>(`SELECT value FROM app_metadata WHERE key = 'last_sync_time'`);
    return result?.value || null;
};

// Set last sync time
export const setLastSyncTime = async (): Promise<void> => {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
        `INSERT OR REPLACE INTO app_metadata (key, value) VALUES ('last_sync_time', ?)`,
        [now]
    );
};

// Push local changes to Supabase
export const pushChanges = async (): Promise<{ success: boolean; error?: string }> => {
    const db = await getDatabase();

    try {
        // Get all pending sync items
        const syncItems = await db.getAllAsync<{
            id: string;
            operation: string;
            table_name: string;
            record_id: string;
            data: string;
        }>('SELECT * FROM sync_queue ORDER BY created_at ASC');

        for (const item of syncItems) {
            const data = JSON.parse(item.data);
            const tableName = item.table_name;

            try {
                if (item.operation === 'create') {
                    const { error } = await supabase.from(tableName).insert(data);
                    if (error) throw error;
                } else if (item.operation === 'update') {
                    const { error } = await supabase.from(tableName).update(data).eq('id', item.record_id);
                    if (error) throw error;
                } else if (item.operation === 'delete') {
                    const { error } = await supabase.from(tableName).delete().eq('id', item.record_id);
                    if (error) throw error;
                }

                await db.withTransactionAsync(async () => {
                    await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [item.id]);
                    
                    if (['sale_items', 'restock_items'].includes(tableName)) {
                        await db.runAsync(
                            `UPDATE ${tableName} SET is_synced = 1 WHERE id = ?`,
                            [item.record_id]
                        );
                    } else {
                        await db.runAsync(
                            `UPDATE ${tableName} SET is_synced = 1, pending_operation = NULL WHERE id = ?`,
                            [item.record_id]
                        );
                    }
                });
            } catch (err: any) {
                console.error(`Sync error for ${tableName}:`, err);
                // Increment retry count
                await db.runAsync(
                    'UPDATE sync_queue SET retry_count = retry_count + 1 WHERE id = ?',
                    [item.id]
                );
            }
        }

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
};

// Pull changes from Supabase to local database
export const pullChanges = async (): Promise<{ success: boolean; error?: string }> => {
    const db = await getDatabase();
    const lastSync = await getLastSyncTime();

    try {
        // 1. Users
        let usersQuery = supabase.from('users').select('*');
        if (lastSync) usersQuery = usersQuery.gt('created_at', lastSync);
        const { data: users, error: usersErr } = await usersQuery;
        if (!usersErr && users && users.length > 0) {
            await db.withTransactionAsync(async () => {
                for (const user of users) {
                    await db.runAsync(
                        `INSERT OR REPLACE INTO users (id, email, full_name, role, created_at) VALUES (?, ?, ?, ?, ?)`,
                        [user.id, user.email, user.full_name, user.role, user.created_at]
                    );
                }
            });
        }

        // 2. Categories
        let catQuery = supabase.from('categories').select('*');
        if (lastSync) catQuery = catQuery.gt('created_at', lastSync);
        const { data: categories, error: catErr } = await catQuery;
        if (!catErr && categories && categories.length > 0) {
            await db.withTransactionAsync(async () => {
                for (const cat of categories) {
                    await db.runAsync(
                        `INSERT OR REPLACE INTO categories (id, name, created_at, is_synced) VALUES (?, ?, ?, 1)`,
                        [cat.id, cat.name, cat.created_at]
                    );
                }
            });
        }

        // 3. Items
        let itemsQuery = supabase.from('items').select('*');
        if (lastSync) itemsQuery = itemsQuery.gt('updated_at', lastSync);
        const { data: items, error: itemsErr } = await itemsQuery;
        if (!itemsErr && items && items.length > 0) {
            await db.withTransactionAsync(async () => {
                for (const item of items) {
                    await db.runAsync(
                        `INSERT OR REPLACE INTO items 
           (id, name, sku, category_id, unit, cost_price, selling_price, quantity_in_stock, 
            reorder_level, allow_fractional, created_at, updated_at, is_synced)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                        [item.id, item.name, item.sku, item.category_id, item.unit, item.cost_price,
                        item.selling_price, item.quantity_in_stock, item.reorder_level,
                        item.allow_fractional ? 1 : 0, item.created_at, item.updated_at]
                    );
                }
            });
        }

        // 4. Sales
        let salesQuery = supabase.from('sales').select('*');
        if (lastSync) salesQuery = salesQuery.gt('updated_at', lastSync);
        const { data: sales, error: salesErr } = await salesQuery;
        if (!salesErr && sales && sales.length > 0) {
            await db.withTransactionAsync(async () => {
                for (const sale of sales) {
                    await db.runAsync(
                        `INSERT OR REPLACE INTO sales 
           (id, sale_number, status, subtotal, additional_charges, total_amount, profit_amount,
            payment_method, created_by, sale_date, created_at, updated_at, return_reason, is_synced)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                        [sale.id, sale.sale_number, sale.status, sale.subtotal, sale.additional_charges,
                        sale.total_amount, sale.profit_amount, sale.payment_method, sale.created_by,
                        sale.sale_date, sale.created_at, sale.updated_at, sale.return_reason]
                    );
                }
            });
        }

        // 5. Sale Items
        let saleItemsQuery = supabase.from('sale_items').select('*');
        if (lastSync) saleItemsQuery = saleItemsQuery.gt('created_at', lastSync);
        const { data: saleItems, error: saleItemsErr } = await saleItemsQuery;
        if (!saleItemsErr && saleItems && saleItems.length > 0) {
            await db.withTransactionAsync(async () => {
                for (const si of saleItems) {
                    await db.runAsync(
                        `INSERT OR REPLACE INTO sale_items (id, sale_id, item_id, item_name, quantity, unit_price, cost_price, line_total, profit_margin, created_at, is_synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                        [si.id, si.sale_id, si.item_id, si.item_name, si.quantity, si.unit_price, si.cost_price, si.line_total, si.profit_margin, si.created_at]
                    );
                }
            });
        }

        // 6. POS Floats
        let floatsQuery = supabase.from('pos_floats').select('*');
        if (lastSync) floatsQuery = floatsQuery.gt('updated_at', lastSync);
        const { data: floats, error: floatsErr } = await floatsQuery;
        if (!floatsErr && floats && floats.length > 0) {
            await db.withTransactionAsync(async () => {
                for (const f of floats) {
                    await db.runAsync(
                        `INSERT OR REPLACE INTO pos_floats 
           (id, date, opening_balance, current_balance, closing_balance, total_withdrawals_processed,
            total_charges_earned, status, created_by, created_at, updated_at, is_synced)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                        [f.id, f.date, f.opening_balance, f.current_balance, f.closing_balance,
                        f.total_withdrawals_processed, f.total_charges_earned, f.status,
                        f.created_by, f.created_at, f.updated_at]
                    );
                }
            });
        }

        // 7. POS Transactions
        let posTxsQuery = supabase.from('pos_transactions').select('*');
        if (lastSync) posTxsQuery = posTxsQuery.gt('created_at', lastSync);
        const { data: posTxs, error: posTxsErr } = await posTxsQuery;
        if (!posTxsErr && posTxs && posTxs.length > 0) {
            await db.withTransactionAsync(async () => {
                for (const tx of posTxs) {
                    await db.runAsync(
                        `INSERT OR REPLACE INTO pos_transactions 
           (id, float_id, transaction_number, customer_name, withdrawal_amount, service_charge,
            total_paid, payment_method, created_by, transaction_date, created_at, is_synced)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                        [tx.id, tx.float_id, tx.transaction_number, tx.customer_name, tx.withdrawal_amount,
                        tx.service_charge, tx.total_paid, tx.payment_method, tx.created_by,
                        tx.transaction_date, tx.created_at]
                    );
                }
            });
        }

        // 8. Restocks
        let restocksQuery = supabase.from('restocks').select('*');
        if (lastSync) restocksQuery = restocksQuery.gt('created_at', lastSync);
        const { data: restocks, error: restocksErr } = await restocksQuery;
        if (!restocksErr && restocks && restocks.length > 0) {
            await db.withTransactionAsync(async () => {
                for (const r of restocks) {
                    await db.runAsync(
                        `INSERT OR REPLACE INTO restocks (id, supplier_name, restock_date, total_amount, notes, created_by, created_at, is_synced) VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
                        [r.id, r.supplier_name, r.restock_date, r.total_amount, r.notes, r.created_by, r.created_at]
                    );
                }
            });
        }

        // 9. Restock Items
        let restockItemsQuery = supabase.from('restock_items').select('*');
        if (lastSync) restockItemsQuery = restockItemsQuery.gt('created_at', lastSync);
        const { data: restockItems, error: restockItemsErr } = await restockItemsQuery;
        if (!restockItemsErr && restockItems && restockItems.length > 0) {
            await db.withTransactionAsync(async () => {
                for (const ri of restockItems) {
                    await db.runAsync(
                        `INSERT OR REPLACE INTO restock_items (id, restock_id, item_id, quantity, unit_cost, created_at, is_synced) VALUES (?, ?, ?, ?, ?, ?, 1)`,
                        [ri.id, ri.restock_id, ri.item_id, ri.quantity, ri.unit_cost, ri.created_at]
                    );
                }
            });
        }

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
};

// Full sync (push + pull)
export const performFullSync = async (
    onStatusChange?: (status: SyncStatus) => void
): Promise<{ success: boolean; error?: string }> => {
    const isOnline = await checkConnectivity();

    if (!isOnline) {
        onStatusChange?.('offline');
        return { success: false, error: 'No internet connection' };
    }

    onStatusChange?.('syncing');

    try {
        // Push first (send local changes)
        const pushResult = await pushChanges();
        if (!pushResult.success) {
            console.warn('Push sync had issues:', pushResult.error);
        }

        // Then pull (get server changes)
        const pullResult = await pullChanges();
        if (!pullResult.success) {
            throw new Error(pullResult.error || 'Pull sync failed');
        }

        // Update last sync time
        await setLastSyncTime();

        onStatusChange?.('synced');
        return { success: true };
    } catch (err: any) {
        onStatusChange?.('error');
        return { success: false, error: err.message };
    }
};
