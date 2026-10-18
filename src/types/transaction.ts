export type TransactionDirection = '+' | '-';

export type Transaction = {
  id: number;
  bookId: number;
  name: string;
  bankId: string | null;
  amount: number;
  direction: TransactionDirection;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
};

