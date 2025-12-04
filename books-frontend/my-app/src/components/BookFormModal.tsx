import React, { useState, useEffect } from 'react';
import { Book, BookPayload, Category } from '../types';
import { XIcon } from './Icons';

interface BookFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (book: BookPayload) => Promise<void>;
  initialData?: Book;
  categories: Category[];
  isSubmitting: boolean;
}

const BookFormModal: React.FC<BookFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  categories,
  isSubmitting
}) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    price: '',
    stock: '',
    book_category_id: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        author: initialData.author,
        price: initialData.price.toString(),
        stock: initialData.stock.toString(),
        book_category_id: initialData.book_category_id.toString()
      });
    } else {
      setFormData({ title: '', author: '', price: '', stock: '', book_category_id: '' });
    }
    setErrors({});
    setFormError('');
  }, [initialData, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.author.trim()) newErrors.author = "Author is required";
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) < 0) newErrors.price = "Valid price is required";
    if (!formData.stock || isNaN(Number(formData.stock)) || Number(formData.stock) < 0) newErrors.stock = "Valid stock is required";
    if (!formData.book_category_id) newErrors.book_category_id = "Category is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await onSubmit({
        title: formData.title,
        author: formData.author,
        price: Number(formData.price),
        stock: Number(formData.stock),
        book_category_id: Number(formData.book_category_id),
      });
      setFormError('');
      onClose();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Failed to save book';
      setFormError(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">
            {initialData ? 'Edit Book' : 'Add New Book'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="e.g. The Great Gatsby"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
              value={formData.author}
              onChange={(e) => setFormData({...formData, author: e.target.value})}
              placeholder="e.g. F. Scott Fitzgerald"
            />
            {errors.author && <p className="text-red-500 text-xs mt-1">{errors.author}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
              />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                value={formData.stock}
                onChange={(e) => setFormData({...formData, stock: e.target.value})}
              />
              {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all bg-white"
              value={formData.book_category_id}
              onChange={(e) => setFormData({...formData, book_category_id: e.target.value})}
            >
              <option value="">Select a Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {errors.book_category_id && <p className="text-red-500 text-xs mt-1">{errors.book_category_id}</p>}
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:bg-brand-400 transition-colors"
            >
              {isSubmitting ? 'Saving...' : (initialData ? 'Update Book' : 'Add Book')}
            </button>
          </div>
          {formError && <p className="text-sm text-red-500">{formError}</p>}
        </form>
      </div>
    </div>
  );
};

export default BookFormModal;
