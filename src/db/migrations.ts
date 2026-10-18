import type { SQLiteDatabase } from "expo-sqlite";

export async function runMigration(db: SQLiteDatabase) {
  await db.execAsync(`
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            bank_id TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            book_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            bank_id TEXT,
            amount INTEGER NOT NULL,
            direction TEXT NOT NULL CHECK (direction IN ('+', '-')),
            transaction_date TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,

            FOREIGN KEY (book_id)
                REFERENCES books(id)
                ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_transactions_book_date
        ON transactions(book_id, transaction_date);
    `);
}
