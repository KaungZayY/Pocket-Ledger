import { getDatabase } from "@/db/database";
import type { Transaction, TransactionDirection } from "@/types/transaction";

type TransactionRow = {
  id: number;
  book_id: number;
  name: string;
  bank_id: string | null;
  amount: number;
  direction: TransactionDirection;
  transaction_date: string;
  created_at: string;
  updated_at: string;
};

function mapTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    bookId: row.book_id,
    name: row.name,
    bankId: row.bank_id,
    amount: row.amount,
    direction: row.direction,
    transactionDate: row.transaction_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type CreateTransactionInput = {
  bookId: number;
  name: string;
  bankId: string | null;
  amount: number;
  direction: TransactionDirection;
  transactionDate: string;
};

export type UpdateTransactionInput = {
  name: string;
  bankId: string | null;
  amount: number;
  direction: TransactionDirection;
  transactionDate: string;
};

export async function getTransactionsByBook(
  bookId: number,
): Promise<Transaction[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TransactionRow>(
    `
      SELECT
        id,
        book_id,
        name,
        bank_id,
        amount,
        direction,
        transaction_date,
        created_at,
        updated_at
      FROM transactions
      WHERE book_id = ?
      ORDER BY transaction_date DESC, id DESC
    `,
    bookId,
  );
  return rows.map(mapTransaction);
}

export async function getTransactionById(
  id: number,
): Promise<Transaction | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<TransactionRow>(
    `
      SELECT
        id,
        book_id,
        name,
        bank_id,
        amount,
        direction,
        transaction_date,
        created_at,
        updated_at
      FROM transactions
      WHERE id = ?
    `,
    id,
  );

  if (!row) {
    return null;
  }

  return mapTransaction(row);
}

export async function createTransaction(
  input: CreateTransactionInput,
): Promise<Transaction> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    `
      INSERT INTO transactions (
        book_id,
        name,
        bank_id,
        amount,
        direction,
        transaction_date,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    input.bookId,
    input.name,
    input.bankId,
    input.amount,
    input.direction,
    input.transactionDate,
    now,
    now,
  );

  const transaction = await getTransactionById(result.lastInsertRowId);

  if (!transaction) {
    throw new Error("Failed to create transaction");
  }

  return transaction;
}

export async function updateTransaction(
  id: number,
  input: UpdateTransactionInput,
): Promise<Transaction> {
  const db = await getDatabase();

  const now = new Date().toISOString();

  const result = await db.runAsync(
    `
      UPDATE transactions
      SET
        name = ?,
        bank_id = ?,
        amount = ?,
        direction = ?,
        transaction_date = ?,
        updated_at = ?
      WHERE id = ?
    `,
    input.name,
    input.bankId,
    input.amount,
    input.direction,
    input.transactionDate,
    now,
    id,
  );

  if (result.changes === 0) {
    throw new Error("Transaction not found");
  }

  const transaction = await getTransactionById(id);

  if (!transaction) {
    throw new Error("Failed to retrieve updated transaction");
  }

  return transaction;
}

export async function deleteTransaction(id: number): Promise<void> {
  const db = await getDatabase();

  const result = await db.runAsync(
    `
      DELETE FROM transactions
      WHERE id = ?
    `,
    id,
  );

  if (result.changes === 0) {
    throw new Error("Transaction not found");
  }
}
