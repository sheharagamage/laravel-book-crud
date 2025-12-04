<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Borrow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BorrowController extends Controller
{
    public function index(): JsonResponse
    {
        $transactions = Borrow::with(['book.category', 'user'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json($transactions);
    }

    public function issue(Request $request): JsonResponse
    {
        $validated = $request->validate($this->transactionRules());
        $book = Book::with('category')->findOrFail($validated['book_id']);

        if ($book->stock <= 0) {
            return response()->json(['message' => 'Book out of stock'], 422);
        }

        $transaction = Borrow::create([
            'book_id' => $validated['book_id'],
            'user_id' => $validated['user_id'],
            'type' => 'issue',
        ]);

        $book->decrement('stock');

        return response()->json([
            'transaction' => $transaction->load(['book.category', 'user']),
            'book' => $book->fresh(['category']),
        ], 201);
    }

    public function returnBook(Request $request): JsonResponse
    {
        $validated = $request->validate($this->transactionRules());
        $book = Book::with('category')->findOrFail($validated['book_id']);

        // Check if this user has borrowed this book (last issue without corresponding return)
        $lastBorrow = Borrow::where('book_id', $validated['book_id'])
            ->where('user_id', $validated['user_id'])
            ->where('type', 'issue')
            ->whereNotExists(function ($query) use ($validated) {
                $query->select('id')
                    ->from('borrows as b2')
                    ->whereColumn('b2.book_id', 'borrows.book_id')
                    ->whereColumn('b2.user_id', 'borrows.user_id')
                    ->where('b2.type', 'return')
                    ->whereColumn('b2.created_at', '>', 'borrows.created_at');
            })
            ->orderByDesc('created_at')
            ->first();

        if (!$lastBorrow) {
            return response()->json([
                'message' => 'Cannot return this book. You have not borrowed it or already returned it.'
            ], 422);
        }

        // Check if returning would exceed original stock
        if ($book->stock >= $book->original_stock) {
            return response()->json([
                'message' => 'Cannot return book. Stock cannot exceed original stock count.'
            ], 422);
        }

        $transaction = Borrow::create([
            'book_id' => $validated['book_id'],
            'user_id' => $validated['user_id'],
            'type' => 'return',
        ]);

        $book->increment('stock');

        return response()->json([
            'transaction' => $transaction->load(['book.category', 'user']),
            'book' => $book->fresh(['category']),
        ]);
    }

    private function transactionRules(): array
    {
        return [
            'book_id' => ['required', 'exists:books,id'],
            'user_id' => ['required', 'exists:users,id'],
        ];
    }
}
