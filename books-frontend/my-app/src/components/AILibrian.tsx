import React, { useState } from 'react';
import { generateBookRecommendation } from '../services/geminiService';
import { Book } from '../types';
import { SparklesIcon } from './Icons';

interface AILibrarianProps {
  books: Book[];
}

const AILibrarian: React.FC<AILibrarianProps> = ({ books }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(process.env.API_KEY || '');
  const [showKeyInput, setShowKeyInput] = useState(!process.env.API_KEY);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setResponse('');
    
    const result = await generateBookRecommendation(query, books, apiKey);
    
    setResponse(result);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-brand-100 overflow-hidden">
      <div className="bg-gradient-to-r from-brand-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-yellow-300" />
          AI Librarian
        </h3>
        {showKeyInput && (
           <input 
            type="password" 
            placeholder="Enter Gemini API Key" 
            className="text-xs px-2 py-1 rounded bg-white/20 text-white placeholder-white/70 border-none outline-none focus:ring-1 focus:ring-white"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
           />
        )}
      </div>
      
      <div className="p-6">
        <div className="mb-4 h-48 overflow-y-auto bg-gray-50 rounded-lg p-4 border border-gray-100 text-sm">
          {response ? (
            <div className="prose prose-sm prose-blue">
               <p className="whitespace-pre-wrap text-gray-800">{response}</p>
            </div>
          ) : (
            <p className="text-gray-400 italic text-center mt-12">
              "Ask me for a recommendation or check stock for a specific title..."
            </p>
          )}
        </div>

        <form onSubmit={handleAsk} className="relative">
          <input
            type="text"
            className="w-full pl-4 pr-12 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none shadow-sm transition-all"
            placeholder="E.g., suggest a good science book under $30..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading || !apiKey}
            className="absolute right-2 top-2 p-1.5 text-white bg-brand-600 rounded-md hover:bg-brand-700 disabled:bg-gray-300 transition-colors"
          >
            {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                <SparklesIcon className="w-5 h-5" />
            )}
          </button>
        </form>
        {!apiKey && <p className="text-xs text-red-400 mt-2">API Key required for AI features.</p>}
      </div>
    </div>
  );
};

export default AILibrarian;
