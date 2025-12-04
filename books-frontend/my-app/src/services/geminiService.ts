import { Book } from '../types';

export async function generateBookRecommendation(
  query: string,
  books: Book[],
  apiKey?: string
): Promise<string> {
  if (!query.trim()) {
    return 'Please provide a question or request.';
  }

  if (!apiKey) {
    return 'Set your Gemini API key to enable AI recommendations.';
  }

  const lowerQuery = query.toLowerCase();
  const relatedBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(lowerQuery) ||
      book.author.toLowerCase().includes(lowerQuery)
  );

  if (!relatedBooks.length) {
    return 'No matching books were found locally. Try refining your query.';
  }

  const suggestions = relatedBooks
    .slice(0, 3)
    .map((book) => `• ${book.title} by ${book.author}`)
    .join('\n');

  return `Based on your library, consider:\n${suggestions}\n\n(Replace this stub with a real Gemini integration when ready.)`;
}
