export type ViewState = 'books' | 'users' | 'transactions';

export interface Category {
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  price: number;
  stock: number;
  original_stock?: number;
  user_id?: number;
  book_category_id: number;
  category?: Category;
  creator?: User;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  name: string;
  age?: number;
  email?: string;
  is_manager?: boolean;
  created_at?: string;
}

export type TransactionType = 'issue' | 'return';

export interface Transaction {
  id: number;
  book_id: number;
  user_id: number;
  type: TransactionType;
  created_at: string;
  updated_at: string;
  book?: Book;
  user?: User;
}

export type BookPayload = Omit<Book, 'id' | 'created_at' | 'updated_at' | 'category'>;

export interface TransactionRequest {
  book_id: number;
  user_id: number;
  type: TransactionType;
}

export interface TransactionResponse {
  transaction: Transaction;
  book: Book;
}
