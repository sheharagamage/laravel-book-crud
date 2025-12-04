import React, { useEffect, useState } from 'react';
import { api, getCurrentUser, setAuth, clearAuth } from './services/api';
import { Book, BookPayload, Category, Transaction, TransactionType, User, ViewState } from './types';
import BookFormModal from './components/BookFormModal';
import UserFormModal, { UserFormData } from './components/UserFormModal';
import { LoginModal } from './components/LoginModal';
import { ToastContainer, ToastType } from './components/Toast';
import { 
  PlusIcon, 
  EditIcon, 
  TrashIcon, 
  BookOpenIcon, 
  SearchIcon,
  XIcon
} from './components/Icons';

const App = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(getCurrentUser());
  
  // Application State
  const [view, setView] = useState<ViewState>('books');
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Toast State
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: ToastType }>>([]);
  const [toastId, setToastId] = useState(0);

  const showToast = (message: string, type: ToastType) => {
    const id = toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setToastId(prev => prev + 1);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Filter State
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [titleQuery, setTitleQuery] = useState('');
  const [authorQuery, setAuthorQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [isUserSubmitting, setIsUserSubmitting] = useState(false);

  // Transaction Modal State (Simplified)
  const [isTransactModalOpen, setIsTransactModalOpen] = useState(false);
  const [transactBook, setTransactBook] = useState<Book | null>(null);
  const [transactType, setTransactType] = useState<TransactionType>('issue');
  const [selectedUser, setSelectedUser] = useState<number>(0);
  const [isTransactionSubmitting, setIsTransactionSubmitting] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);

  // Initial Data Fetch - only load data when user is authenticated
  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }
    
    const init = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [bookData, categoryData, userData, transactionData] = await Promise.all([
          api.getBooks(),
          api.getCategories(),
          api.getUsers(),
          api.getTransactions()
        ]);
        setBooks(bookData);
        setCategories(categoryData);
        setUsers(userData);
        setSelectedUser(userData[0]?.id ?? 0);
        setTransactions(transactionData);
      } catch (err) {
        console.error('Failed to load data', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [currentUser]);

  // Handlers
  const handleCreateOrUpdateBook = async (bookData: BookPayload) => {
    setIsSubmitting(true);
    setError(null);
    try {
      let saved: Book;

      if (editingBook) {
        saved = await api.updateBook(editingBook.id, bookData);
        setBooks(prev => prev.map(b => (b.id === saved.id ? saved : b)));
        showToast('Book updated successfully!', 'success');
      } else {
        saved = await api.createBook(bookData);
        setBooks(prev => [...prev, saved]);
        showToast('Book created successfully!', 'success');
      }

      setEditingBook(undefined);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save book';
      setError(message);
      showToast(message, 'error');
      throw (err instanceof Error ? err : new Error(message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBook = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;
    setError(null);
    try {
      await api.deleteBook(id);
      setBooks(prev => prev.filter(b => b.id !== id));
      showToast('Book deleted successfully!', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete book';
      setError(message);
      showToast(message, 'error');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBook(undefined);
  };

  const handleCreateOrUpdateUser = async (userData: UserFormData) => {
    setIsUserSubmitting(true);
    setError(null);
    try {
      let saved: User;

      if (editingUser) {
        saved = await api.updateUser(editingUser.id, { name: userData.name, age: userData.age });
        setUsers(prev => prev.map(u => (u.id === saved.id ? saved : u)));
        showToast('Member updated successfully!', 'success');
      } else {
        saved = await api.createUser({ name: userData.name, age: userData.age });
        setUsers(prev => [...prev, saved]);
        showToast('Member added successfully!', 'success');
      }

      setEditingUser(undefined);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save user';
      setError(message);
      showToast(message, 'error');
      throw (err instanceof Error ? err : new Error(message));
    } finally {
      setIsUserSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setError(null);
    try {
      await api.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      showToast('Member deleted successfully!', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete member';
      setError(message);
      showToast(message, 'error');
    }
  };

  const closeUserModal = () => {
    setIsUserModalOpen(false);
    setEditingUser(undefined);
  };

  // Auth Handlers
  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      setAuth(response.token, response.user);
      setCurrentUser(response.user);
      showToast('Login successful!', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      showToast(message, 'error');
      throw err;
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error', err);
    }
    clearAuth();
    setCurrentUser(null);
  };



  const openTransaction = (book: Book, type: TransactionType) => {
    setTransactBook(book);
    setTransactType(type);
    setTransactionError(null);
    
    // For returns, default to first user who borrowed the book
    // For borrows, default to first user in the list
    if (type === 'return') {
      const borrowers = getUsersWhoBorrowedBook(book.id);
      setSelectedUser(borrowers[0]?.id ?? 0);
    } else {
      setSelectedUser(users[0]?.id ?? 0);
    }
    
    setIsTransactModalOpen(true);
  };

  // Get users who have borrowed a specific book (active borrows only)
  const getUsersWhoBorrowedBook = (bookId: number): User[] => {
    // Find all 'issue' transactions for this book
    const issueTransactions = transactions.filter(
      t => t.book_id === bookId && t.type === 'issue'
    );
    
    // Find all 'return' transactions for this book
    const returnTransactions = transactions.filter(
      t => t.book_id === bookId && t.type === 'return'
    );
    
    // Create a map of user_id to count of issues
    const issueCount = new Map<number, number>();
    issueTransactions.forEach(t => {
      issueCount.set(t.user_id, (issueCount.get(t.user_id) || 0) + 1);
    });
    
    // Create a map of user_id to count of returns
    const returnCount = new Map<number, number>();
    returnTransactions.forEach(t => {
      returnCount.set(t.user_id, (returnCount.get(t.user_id) || 0) + 1);
    });
    
    // Find users who have more issues than returns (active borrowers)
    const activeBorrowerIds = new Set<number>();
    issueCount.forEach((issues, userId) => {
      const returns = returnCount.get(userId) || 0;
      if (issues > returns) {
        activeBorrowerIds.add(userId);
      }
    });
    
    // Return users who are active borrowers
    return users.filter(u => activeBorrowerIds.has(u.id));
  };

  const handleTransactionSubmit = async () => {
    if (!transactBook || !selectedUser) return;
    setIsTransactionSubmitting(true);
    setTransactionError(null);
    try {
      const result = await api.createTransaction({
        book_id: transactBook.id,
        user_id: selectedUser,
        type: transactType,
      });

      setTransactions(prev => [result.transaction, ...prev]);
      setBooks(prev => prev.map(b => (b.id === result.book.id ? result.book : b)));

      const successMessage = transactType === 'issue' 
        ? 'Book borrowed successfully!' 
        : 'Book returned successfully!';
      showToast(successMessage, 'success');

      setIsTransactModalOpen(false);
      setTransactBook(null);
      setTransactionError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      setTransactionError(message);
      showToast(message, 'error');
    } finally {
      setIsTransactionSubmitting(false);
    }
  };

  const clearFilters = () => {
    setTitleQuery('');
    setAuthorQuery('');
    setSelectedCategory('all');
  };

  // Derived State
  const filteredBooks = books.filter(book => {
    const matchesCategory = selectedCategory === 'all' || book.book_category_id === selectedCategory;
    const matchesTitle = book.title.toLowerCase().includes(titleQuery.toLowerCase());
    const matchesAuthor = book.author.toLowerCase().includes(authorQuery.toLowerCase());
    return matchesCategory && matchesTitle && matchesAuthor;
  });

  // Show login page if not authenticated
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl mb-4">
              <BookOpenIcon className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Library Manager</h1>
            <p className="text-gray-600">Please sign in to manage your library</p>
          </div>
          <LoginModal
            onClose={() => {}} // Can't close on initial login
            onLogin={handleLogin}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-brand-600 p-2 rounded-lg text-white">
                <BookOpenIcon className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">Library Manager</span>
            </div>
            
            <nav className="flex items-center gap-1">
              <button 
                onClick={() => setView('books')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'books' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                Books
              </button>
              <button 
                onClick={() => setView('users')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'users' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                Members
              </button>
              <button 
                onClick={() => setView('transactions')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'transactions' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                Transactions
              </button>
              
              <div className="ml-4 flex items-center gap-2 border-l border-gray-200 pl-4">
                <span className="text-sm text-gray-700">
                  {currentUser.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Logout
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {view === 'books' && (
          <div className="space-y-6">
            {/* Toolbar */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full lg:w-auto flex-1">
                   {/* Title Search */}
                   <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <SearchIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Filter by title..."
                      className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition duration-150 ease-in-out text-sm"
                      value={titleQuery}
                      onChange={(e) => setTitleQuery(e.target.value)}
                    />
                  </div>

                  {/* Author Search */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <SearchIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Filter by author..."
                      className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition duration-150 ease-in-out text-sm"
                      value={authorQuery}
                      onChange={(e) => setAuthorQuery(e.target.value)}
                    />
                  </div>
                  
                  {/* Category Filter */}
                  <div className="flex gap-2">
                    <select
                      className="block w-full pl-3 pr-8 py-2 text-sm border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    >
                      <option value="all">All Categories</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {(titleQuery || authorQuery || selectedCategory !== 'all') && (
                      <button 
                        onClick={clearFilters}
                        className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                        title="Clear Filters"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="w-full lg:w-auto flex justify-end">
                  <button
                    onClick={() => { setEditingBook(undefined); setIsModalOpen(true); }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors"
                  >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add Book
                  </button>
                </div>
              </div>
            </div>

            {/* Book List */}
            <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
              {isLoading ? (
                <div className="p-12 text-center text-gray-500">Loading library...</div>
              ) : filteredBooks.length === 0 ? (
                <div className="p-12 text-center text-gray-500">No books found matching criteria.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book Details</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredBooks.map((book) => {
                        const categoryName = book.category?.name ?? categories.find(c => c.id === book.book_category_id)?.name ?? 'Uncategorized';
                        const isOutOfStock = book.stock === 0;

                        return (
                          <tr key={book.id} className="hover:bg-gray-50 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-brand-100 rounded-md flex items-center justify-center text-brand-600 font-bold text-lg">
                                  {book.title.charAt(0)}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{book.title}</div>
                                  <div className="text-sm text-gray-500">{book.author}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                {categoryName}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ${book.price.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {isOutOfStock ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                  Out of Stock
                                </span>
                              ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  {book.stock} available
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {book.creator?.name ?? 'Unknown'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-2">
                                {!isOutOfStock && (
                                  <button
                                    onClick={() => openTransaction(book, 'issue')}
                                    className="text-brand-600 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 px-3 py-1 rounded-md transition-colors"
                                  >
                                    Borrow
                                  </button>
                                )}
                                <button
                                  onClick={() => openTransaction(book, 'return')}
                                  className="text-purple-600 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-md transition-colors"
                                >
                                  Return
                                </button>
                                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                <button
                                  onClick={() => { setEditingBook(book); setIsModalOpen(true); }}
                                  className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                                >
                                  <EditIcon className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteBook(book.id)}
                                  className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                >
                                  <TrashIcon className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'users' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Library Members</h2>
              <button
                onClick={() => { setEditingUser(undefined); setIsUserModalOpen(true); }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Add Member
              </button>
            </div>

            <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
              {isLoading ? (
                <div className="p-12 text-center text-gray-500">Loading members...</div>
              ) : users.length === 0 ? (
                <div className="p-12 text-center text-gray-500">No members found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-lg">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.age || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => { setEditingUser(user); setIsUserModalOpen(true); }}
                                className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                              >
                                <EditIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-gray-400 hover:text-red-600 transition-colors p-1"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'transactions' && (
          <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-medium text-gray-900">Transaction History</h2>
            </div>
            {transactions.length === 0 ? (
                <div className="p-12 text-center text-gray-500">No transactions recorded yet.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map(t => (
                    <tr key={t.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(t.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.type === 'issue' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                          {t.type === 'issue' ? 'BORROW' : 'RETURN'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {t.book?.title ?? 'Unknown title'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div className="font-medium text-gray-900">{t.user?.name ?? 'Unknown member'}</div>
                          {t.user?.age && (
                            <div className="text-xs text-gray-500">Age: {t.user.age}</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>

      {/* Book Form Modal */}
      <BookFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleCreateOrUpdateBook}
        initialData={editingBook}
        categories={categories}
        isSubmitting={isSubmitting}
      />

      {/* User Form Modal */}
      <UserFormModal
        isOpen={isUserModalOpen}
        onClose={closeUserModal}
        onSubmit={handleCreateOrUpdateUser}
        initialData={editingUser}
        isSubmitting={isUserSubmitting}
      />

      {/* Transaction Modal (Simplified inline for demo) */}
      {isTransactModalOpen && transactBook && (() => {
        // Get the appropriate user list based on transaction type
        const availableUsers = transactType === 'return' 
          ? getUsersWhoBorrowedBook(transactBook.id)
          : users;
        
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
               <h3 className="text-lg font-bold text-gray-900 mb-4">
                 {transactType === 'issue' ? 'Borrow Book' : 'Return Book'}
               </h3>
               <p className="text-sm text-gray-500 mb-4">
                 {transactType === 'issue'
                  ? `Issuing "${transactBook.title}" to a member`
                  : `Processing return of "${transactBook.title}"`}
               </p>
               
               {/* Transaction Error Message */}
               {transactionError && (
                 <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start justify-between">
                   <div className="flex-1">
                     <p className="text-sm text-red-800 font-medium">
                       {transactionError}
                     </p>
                   </div>
                   <button
                     onClick={() => setTransactionError(null)}
                     className="ml-2 text-red-400 hover:text-red-600 transition-colors"
                   >
                     <XIcon className="w-4 h-4" />
                   </button>
                 </div>
               )}
               
               <div className="mb-4">
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Select Member <span className="text-red-500">*</span>
                 </label>
                 {availableUsers.length === 0 ? (
                   <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                     {transactType === 'return' 
                       ? 'No members have borrowed this book'
                       : 'No members available'}
                   </div>
                 ) : (
                   <select
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                     value={selectedUser}
                     onChange={(e) => setSelectedUser(Number(e.target.value))}
                   >
                     <option value={0}>-- Select a member --</option>
                     {availableUsers.map(u => (
                       <option key={u.id} value={u.id}>
                         {u.name} {u.age ? `(Age: ${u.age})` : ''}
                       </option>
                     ))}
                   </select>
                 )}
                 <p className="text-xs text-gray-500 mt-1">
                   {transactType === 'issue' 
                     ? 'Choose the member borrowing this book'
                     : `Only members who borrowed this book (${availableUsers.length} found)`}
                 </p>
               </div>

               <div className="flex justify-end gap-3">
                 <button 
                  onClick={() => {
                    setIsTransactModalOpen(false);
                    setTransactionError(null);
                  }}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                 >
                   Cancel
                 </button>
                 <button 
                  onClick={handleTransactionSubmit}
                  disabled={isTransactionSubmitting || !selectedUser || availableUsers.length === 0}
                  className="px-4 py-2 text-sm text-white bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 disabled:cursor-not-allowed rounded-lg"
                 >
                   {isTransactionSubmitting ? 'Processing...' : 'Confirm'}
                 </button>
               </div>
            </div>
          </div>
        );
      })()}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default App;