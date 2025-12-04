import {
  Book,
  BookPayload,
  Category,
  Transaction,
  TransactionRequest,
  TransactionResponse,
  User,
} from '../types';

const DEFAULT_API_BASE = 'http://localhost:8000/api';
const apiBase = (process.env.REACT_APP_API_URL ?? DEFAULT_API_BASE).replace(/\/$/, '');

// Token management
let authToken: string | null = localStorage.getItem('authToken');
let currentUser: User | null = JSON.parse(localStorage.getItem('currentUser') || 'null');

export function getAuthToken(): string | null {
  return authToken;
}

export function getCurrentUser(): User | null {
  return currentUser;
}

export function setAuth(token: string, user: User): void {
  authToken = token;
  currentUser = user;
  localStorage.setItem('authToken', token);
  localStorage.setItem('currentUser', JSON.stringify(user));
}

export function clearAuth(): void {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
}

interface BookFilters {
  category?: number | 'all';
  title?: string;
  author?: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Add auth token if available
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers,
  });

  const rawBody = await response.text();

  if (!response.ok) {
    let message = response.statusText;

    if (rawBody) {
      try {
        const parsed = JSON.parse(rawBody);
        message = parsed.message ?? message;
      } catch {
        message = rawBody;
      }
    }

    // Auto logout on 401
    if (response.status === 401) {
      clearAuth();
    }

    throw new Error(message || 'Request failed');
  }

  if (!rawBody) {
    return null as T;
  }

  try {
    return JSON.parse(rawBody) as T;
  } catch {
    return null as T;
  }
}

function buildQuery(filters?: BookFilters): string {
  if (!filters) return '';
  const params = new URLSearchParams();

  if (filters.category && filters.category !== 'all') {
    params.set('category', String(filters.category));
  }
  if (filters.title) {
    params.set('title', filters.title);
  }
  if (filters.author) {
    params.set('author', filters.author);
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () =>
    request<void>('/auth/logout', {
      method: 'POST',
    }),
  
  // Books
  getBooks: (filters?: BookFilters) => request<Book[]>(`/books${buildQuery(filters)}`),
  createBook: (payload: BookPayload) =>
    request<Book>('/books', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateBook: (id: number, payload: BookPayload) =>
    request<Book>(`/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteBook: (id: number) =>
    request<void>(`/books/${id}`, {
      method: 'DELETE',
    }),
  
  // Categories
  getCategories: () => request<Category[]>('/categories'),
  
  // Users
  getUsers: () => request<User[]>('/users'),
  createUser: (payload: { name: string; age: number }) =>
    request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateUser: (id: number, payload: { name: string; age: number }) =>
    request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteUser: (id: number) =>
    request<void>(`/users/${id}`, {
      method: 'DELETE',
    }),
  
  // Transactions
  getTransactions: () => request<Transaction[]>('/transactions'),
  createTransaction: (payload: TransactionRequest) => {
    const endpoint = payload.type === 'issue' ? '/transactions/borrow' : '/transactions/return';

    return request<TransactionResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export type { BookFilters };
