<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        $users = User::select('id', 'name', 'age', 'email', 'created_at')
            ->where('is_manager', false)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'age' => ['required', 'integer', 'min:1', 'max:150'],
        ]);

        $userData = [
            'name' => $validated['name'],
            'age' => $validated['age'],
            'is_manager' => false,
            'password' => Hash::make('user123'), // Default password for members
        ];
        
        $user = User::create($userData);

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'age' => $user->age,
            'created_at' => $user->created_at,
        ], 201);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'age' => $user->age,
            'email' => $user->email,
            'created_at' => $user->created_at,
        ]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'age' => ['required', 'integer', 'min:1', 'max:150'],
        ]);

        $user->name = $validated['name'];
        $user->age = $validated['age'];
        $user->save();

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'age' => $user->age,
            'created_at' => $user->created_at,
        ]);
    }

    public function destroy(User $user): JsonResponse
    {
        // Check if user has active borrowed books
        $borrows = \App\Models\Borrow::where('user_id', $user->id)->get();
        
        // Count issues and returns
        $issueCount = $borrows->where('type', 'issue')->count();
        $returnCount = $borrows->where('type', 'return')->count();
        
        // If user has more issues than returns, they have active borrows
        if ($issueCount > $returnCount) {
            return response()->json([
                'message' => 'Cannot delete member. They have active borrowed books. Please ensure all books are returned first.'
            ], 422);
        }
        
        $user->delete();
        return response()->json(null, 204);
    }
}
