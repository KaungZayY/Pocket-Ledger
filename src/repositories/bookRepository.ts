import { getDatabase } from "@/db/database";
import type { Book } from "@/types/book";

type BookRow = {
  id: number;
  name: string;
  bank_id: string | null;
  created_at: string;
  updated_at: string;
};

function mapBook(row: BookRow): Book {
  return {
    id: row.id,
    name: row.name,
    bankId: row.bank_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getBookById(id: number): Promise<Book | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<BookRow>(
    `
      SELECT
        id,
        name,
        bank_id,
        created_at,
        updated_at
      FROM books
      WHERE id = ?
    `,
    id,
  );

  if (!row) {
    return null;
  }

  return mapBook(row);
}

export async function getBooks(): Promise<Book[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<BookRow>(
    `
      SELECT
        id,
        name,
        bank_id,
        created_at,
        updated_at
      FROM books
      ORDER BY created_at DESC
    `,
  );
  return rows.map(mapBook);
}

export async function createBook(name: string, bankId: string | null = null): Promise<Book> {
  const db = await getDatabase();

  const now = new Date().toISOString();

  const result = await db.runAsync(
    `
      INSERT INTO books (
        name,
        bank_id,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?)
    `,
    name,
    bankId,
    now,
    now,
  );

  const book = await getBookById(result.lastInsertRowId);
  if (!book) {
    throw new Error("Failed to create book");
  }

  return book;
}

export async function updateBook(id: number, name: string, bankId: string | null = null): Promise<Book> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const result = await db.runAsync(
    `
      UPDATE books
      SET
        name = ?,
        bank_id = ?,
        updated_at = ?
      WHERE id = ?
    `,
    name,
    bankId,
    now,
    id,
  );

  if (result.changes === 0) {
    throw new Error("Book not found");
  }

  const book = await getBookById(id);

  if (!book) {
    throw new Error("Failed to retrieve updated book");
  }

  return book;
}

export async function deleteBook(id: number): Promise<void> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `
        DELETE FROM books
        WHERE id = ?
    `,
    id,
  );
  if (result.changes === 0) {
    throw new Error("Book not found");
  }
}
