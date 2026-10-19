import { getDatabase } from "@/db/database";
import type { Transaction } from "@/types/transaction";
import { TransactionRow } from "./transactionRepository";
import { addDays } from "@/utils/date";

const SIGNED = `CASE direction WHEN '+' THEN amount ELSE -amount END`;

export type BookSummary = {
  firstDate: string | null; // YYYY-MM-DD
  lastDate: string | null; // YYYY-MM-DD
  balance: number; // all-time, in minor units
  count: number;
};

export type StatementRow = {
  transaction: Transaction;
  signedAmount: number;
  before: number;
  after: number;
};

export type DayStatement = {
  date: string;
  opening: number;
  credits: number;
  debits: number; // positive number
  closing: number;
  rows: StatementRow[];
};

export async function getBookSummary(bookId: number): Promise<BookSummary> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<{
    first_date: string | null;
    last_date: string | null;
    balance: number;
    count: number;
  }>(
    `SELECT MIN(transaction_date) AS first_date,
            MAX(transaction_date) AS last_date,
            COALESCE(SUM(${SIGNED}), 0) AS balance,
            COUNT(*) AS count
     FROM transactions
     WHERE book_id = ?`,
    [bookId],
  );

  return {
    firstDate: row?.first_date?.slice(0, 10) ?? null,
    lastDate: row?.last_date?.slice(0, 10) ?? null,
    balance: row?.balance ?? 0,
    count: row?.count ?? 0,
  };
}

export async function getDayStatement(
  bookId: number,
  date: string, // YYYY-MM-DD
): Promise<DayStatement> {
  const db = await getDatabase();
  const nextDate = addDays(date, 1);

  // Plain string comparison keeps the (book_id, transaction_date) index usable.
  // '2026-10-18T12:00:00' >= '2026-10-18' and < '2026-10-19'.
  const [openingRow, dayRows] = await Promise.all([
    db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(${SIGNED}), 0) AS total
       FROM transactions
       WHERE book_id = ? AND transaction_date < ?`,
      [bookId, date],
    ),
    db.getAllAsync<TransactionRow>(
      `SELECT id, book_id, name, bank_id, amount, direction,
              transaction_date, created_at, updated_at
       FROM transactions
       WHERE book_id = ? AND transaction_date >= ? AND transaction_date < ?
       ORDER BY id ASC`,
      [bookId, date, nextDate],
    ),
  ]);

  const opening = openingRow?.total ?? 0;
  let running = opening;
  let credits = 0;
  let debits = 0;

  const rows: StatementRow[] = dayRows.map((r: any) => {
    const signedAmount = r.direction === "+" ? r.amount : -r.amount;
    const before = running;
    running += signedAmount;

    if (signedAmount > 0) credits += signedAmount;
    else debits += -signedAmount;

    return {
      transaction: {
        id: r.id,
        bookId: r.book_id,
        name: r.name,
        bankId: r.bank_id,
        amount: r.amount,
        direction: r.direction,
        transactionDate: r.transaction_date,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      } as Transaction,
      signedAmount,
      before,
      after: running,
    };
  });

  return { date, opening, credits, debits, closing: running, rows };
}
