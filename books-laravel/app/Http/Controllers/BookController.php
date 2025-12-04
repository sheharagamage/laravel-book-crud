<?php

namespace App\Http\Controllers;

use App\Models\Book;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $books = Book::with(['category', 'creator'])
            ->when($request->query('category'), fn($query, $categoryId) => $query->where('book_category_id', $categoryId))
            ->when($request->query('title'), fn($query, $title) => $query->where('title', 'like', "%{$title}%"))
            ->when($request->query('author'), fn($query, $author) => $query->where('author', 'like', "%{$author}%"))
            ->orderByDesc('created_at')
            ->get();

        return response()->json($books);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->rules());
        
        // Set user_id from authenticated user
        $validated['user_id'] = $request->input('auth_user_id');
        
        // Set original_stock to initial stock value
        $validated['original_stock'] = $validated['stock'];
        
        $book = Book::create($validated)->fresh(['category', 'creator']);

        return response()->json($book, 201);
    }

    public function show(Book $book): JsonResponse
    {
        return response()->json($book->load(['category', 'creator']));
    }

    public function update(Request $request, Book $book): JsonResponse
    {
        $authUserId = $request->input('auth_user_id');
        
        // Validate incoming data
        $rules = $this->rules();
        
        // If user is not the creator, they cannot update the title
        if ($book->user_id !== $authUserId) {
            unset($rules['title']); // Remove title from validation if not owner
            
            // Check if title is being attempted to update
            if ($request->has('title') && $request->input('title') !== $book->title) {
                return response()->json([
                    'message' => 'Only the book creator can edit the title'
                ], 403);
            }
        }
        
        $validated = $request->validate($rules);
        
        // If not creator, remove title from update data
        if ($book->user_id !== $authUserId) {
            unset($validated['title']);
        }
        
        // Don't allow changing original_stock
        unset($validated['original_stock']);
        
        $book->update($validated);

        return response()->json($book->fresh(['category', 'creator']));
    }

    public function destroy(Book $book): JsonResponse
    {
        $book->delete();

        return response()->json(null, 204);
    }

    private function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'author' => ['required', 'string', 'max:255'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'book_category_id' => ['required', 'exists:book_cate,id'],
        ];
    }
}
