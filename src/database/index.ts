// Local SQLite database for offline-first storage
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'shop_manager.db';

// Open database
export const openDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
    return await SQLite.openDatabaseAsync(DB_NAME);
};

// Initialize all tables
export const initDatabase = async (): Promise<void> => {
    const db = await openDatabase();

    await db.execAsync(`
    -- Users table (cached from server)
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    -- Categories table
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      is_synced INTEGER DEFAULT 0,
      pending_operation TEXT
    );

    -- Items table
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT NOT NULL,
      category_id TEXT,
      unit TEXT NOT NULL,
      cost_price REAL NOT NULL,
      selling_price REAL NOT NULL,
      quantity_in_stock REAL NOT NULL,
      reorder_level REAL NOT NULL,
      allow_fractional INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_synced INTEGER DEFAULT 0,
      pending_operation TEXT
    );

    -- Sales table
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      sale_number TEXT NOT NULL,
      status TEXT NOT NULL,
      subtotal REAL NOT NULL,
      additional_charges REAL NOT NULL,
      total_amount REAL NOT NULL,
      profit_amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      created_by TEXT NOT NULL,
      sale_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      return_reason TEXT,
      is_synced INTEGER DEFAULT 0,
      pending_operation TEXT
    );

    -- Sale items table
    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      item_name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      cost_price REAL NOT NULL,
      line_total REAL NOT NULL,
      profit_margin REAL NOT NULL,
      created_at TEXT NOT NULL,
      is_synced INTEGER DEFAULT 0,
      FOREIGN KEY (sale_id) REFERENCES sales(id)
    );

    -- POS floats table
    CREATE TABLE IF NOT EXISTS pos_floats (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      opening_balance REAL NOT NULL,
      current_balance REAL NOT NULL,
      closing_balance REAL,
      total_withdrawals_processed REAL DEFAULT 0,
      total_charges_earned REAL DEFAULT 0,
      status TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_synced INTEGER DEFAULT 0,
      pending_operation TEXT
    );

    -- POS transactions table
    CREATE TABLE IF NOT EXISTS pos_transactions (
      id TEXT PRIMARY KEY,
      float_id TEXT NOT NULL,
      transaction_number TEXT NOT NULL,
      customer_name TEXT,
      withdrawal_amount REAL NOT NULL,
      service_charge REAL NOT NULL,
      total_paid REAL NOT NULL,
      payment_method TEXT NOT NULL,
      created_by TEXT NOT NULL,
      transaction_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      is_synced INTEGER DEFAULT 0,
      pending_operation TEXT,
      FOREIGN KEY (float_id) REFERENCES pos_floats(id)
    );

    -- Restocks table
    CREATE TABLE IF NOT EXISTS restocks (
      id TEXT PRIMARY KEY,
      supplier_name TEXT NOT NULL,
      restock_date TEXT NOT NULL,
      total_amount REAL NOT NULL,
      notes TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      is_synced INTEGER DEFAULT 0,
      pending_operation TEXT
    );

    -- Restock items table
    CREATE TABLE IF NOT EXISTS restock_items (
      id TEXT PRIMARY KEY,
      restock_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_cost REAL NOT NULL,
      created_at TEXT NOT NULL,
      is_synced INTEGER DEFAULT 0,
      FOREIGN KEY (restock_id) REFERENCES restocks(id)
    );

    -- Sync queue for tracking offline operations
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      operation TEXT NOT NULL,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL,
      retry_count INTEGER DEFAULT 0
    );

    -- App metadata (last sync time, etc.)
    CREATE TABLE IF NOT EXISTS app_metadata (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

    console.log('Database initialized successfully');
};

// Get database instance
let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
    if (!dbInstance) {
        dbInstance = await openDatabase();
    }
    return dbInstance;
};

// Clear all data (for logout)
export const clearAllData = async (): Promise<void> => {
    const db = await getDatabase();
    await db.execAsync(`
    DELETE FROM sale_items;
    DELETE FROM sales;
    DELETE FROM pos_transactions;
    DELETE FROM pos_floats;
    DELETE FROM restock_items;
    DELETE FROM restocks;
    DELETE FROM items;
    DELETE FROM categories;
    DELETE FROM users;
    DELETE FROM sync_queue;
    DELETE FROM app_metadata;
  `);
};
