# Authentication & Authorization Implementation

This document describes the authentication and authorization system implemented for the Laravel Book CRUD application.

## Overview

The application now requires users to be authenticated before performing sensitive operations like creating, editing, or deleting books and users, as well as borrowing/returning books. Additionally, book ownership is tracked, and only the creator of a book can edit its title.

## Backend Changes

### 1. Database Schema Updates

#### Migration: `add_user_id_and_original_stock_to_books_table`
Added two new columns to the `books` table:
- `user_id` (integer, nullable) - Foreign key to `users.id` with `nullOnDelete`
- `original_stock` (integer) - Tracks the initial stock count to prevent over-returns

**File**: `books-laravel/database/migrations/2025_12_04_133410_add_user_id_and_original_stock_to_books_table.php`

### 2. Models

#### Book Model Updates
Updated `app/Models/Book.php`:
- Added `user_id` and `original_stock` to `$fillable` array
- Added casts for `user_id` (integer)
- Added `creator()` relationship method: `belongsTo(User::class, 'user_id')`

### 3. Authentication System

#### AuthController
Created `app/Http/Controllers/AuthController.php` with methods:
- `login()` - Authenticates user with email/password, returns token
- `register()` - Creates new user account, returns token
- `logout()` - Logs out user
- `me()` - Returns current authenticated user details

Token format: Base64-encoded string of `{user_id}|{timestamp}`

#### Authenticate Middleware
Created `app/Http/Middleware/Authenticate.php`:
- Extracts Bearer token from Authorization header
- Decodes token to get user ID
- Validates user exists in database
- Attaches user to request object
- Returns 401 for invalid/missing tokens

Registered as `auth.custom` alias in `bootstrap/app.php`.

### 4. Controller Updates

#### BookController
Updated `app/Http/Controllers/BookController.php`:

**index()**: Now eager loads `creator` relationship along with `category`

**store()**: 
- Sets `user_id` from authenticated user
- Sets `original_stock` to initial stock value

**update()**:
- Checks if authenticated user is the book creator
- Only allows title edits if user is creator
- Returns 403 error if non-creator attempts to edit title
- Other fields can be updated by creator only (due to protected route)

#### BorrowController
Updated `app/Http/Controllers/BorrowController.php`:

**returnBook()**:
- Added validation to prevent stock from exceeding `original_stock`
- Returns 422 error with message if return would exceed limit

### 5. Routes

Updated `routes/api.php`:
- Added authentication routes under `/api/auth`
- Split routes into public and protected groups
- Public routes (no auth required):
  - GET /books, /books/{id}
  - GET /categories
  - GET /users, /users/{id}
  - GET /transactions
- Protected routes (auth required):
  - POST /books, PUT /books/{id}, DELETE /books/{id}
  - POST /users, PUT /users/{id}, DELETE /users/{id}
  - POST /transactions/borrow, /transactions/return

## Frontend Changes

### 1. API Service Updates

Updated `books-frontend/my-app/src/services/api.ts`:
- Added token management functions:
  - `getAuthToken()` - Returns current token
  - `getCurrentUser()` - Returns current user
  - `setAuth(token, user)` - Stores token and user in localStorage
  - `clearAuth()` - Removes token and user from localStorage
- Updated `request()` function to include Authorization header
- Added auto-logout on 401 responses
- Added authentication endpoints:
  - `api.login(email, password)`
  - `api.register(name, email, password)`
  - `api.logout()`

### 2. Type Definitions

Updated `books-frontend/my-app/src/types.ts`:
- Added `original_stock?: number` to Book interface
- Added `user_id?: number` to Book interface
- Added `creator?: User` to Book interface

### 3. New Components

#### LoginModal
Created `books-frontend/my-app/src/components/LoginModal.tsx`:
- Modal dialog for login/register
- Toggle between login and register modes
- Email and password fields (name field for registration)
- Error display
- Form validation
- Calls onLogin or onRegister callbacks

### 4. App Component Updates

Updated `books-frontend/my-app/src/App.tsx`:

**State**:
- Added `currentUser` state to track logged-in user
- Added `showLoginModal` state to control login modal visibility

**Auth Handlers**:
- `handleLogin()` - Calls API, stores auth, updates state
- `handleRegister()` - Calls API, stores auth, updates state
- `handleLogout()` - Clears auth, updates state
- `requireAuth(action)` - Shows login modal if not authenticated, otherwise executes action

**UI Changes**:
- Added login/logout button to header
- Shows user name when logged in
- Added "Created By" column to books table
- Protected all create/edit/delete buttons with `requireAuth()`
- Added LoginModal component to render tree

**Book Listing**:
- Now displays book creator name in "Created By" column
- Shows "Unknown" if creator is null

## Authorization Rules

### Book Title Editing
- Only the user who created a book (book.user_id === auth.user.id) can edit the title
- Other users receive 403 Forbidden error
- Implementation in BookController.update() method

### Stock Management
- Returns cannot increase stock beyond original_stock value
- Prevents stock manipulation
- Implementation in BorrowController.returnBook() method

### Protected Operations
All of the following require authentication:
- Creating books
- Editing books
- Deleting books
- Creating users
- Editing users
- Deleting users
- Borrowing books
- Returning books

### Public Operations
The following do NOT require authentication:
- Viewing books list
- Viewing single book details
- Viewing categories
- Viewing users list
- Viewing transaction history

## Security Considerations

### Token Storage
- Tokens stored in localStorage (frontend)
- Simple base64 encoding (not encrypted)
- For production: Consider JWT tokens with expiration and refresh tokens

### Password Security
- Passwords hashed using bcrypt via Laravel's Hash::make()
- Minimum 8 characters required for registration
- Default password "password123" for users created without password

### CORS
- Already configured for localhost:3000 and localhost:5173
- No changes needed

## Usage

### User Flow

1. **First Time User**:
   - Click "Login" button
   - Switch to "Register" mode
   - Enter name, email, password
   - Submit - automatically logged in
   - Can now create books, manage users, etc.

2. **Returning User**:
   - Click "Login" button
   - Enter email and password
   - Submit - logged in
   - Token stored in localStorage (persists across sessions)

3. **Creating a Book**:
   - User must be logged in
   - Book automatically linked to user's account via user_id
   - original_stock set to initial stock value

4. **Editing a Book**:
   - Only creator can edit title
   - If non-creator tries to edit title, they get 403 error
   - Creator can edit all fields

5. **Borrow/Return**:
   - Must be logged in
   - Any user can borrow any book
   - Returns blocked if stock already at original_stock

## Testing

### Test Login
1. Register a new user: John Doe (john@example.com) / password123
2. Verify name appears in header
3. Create a book - should succeed
4. Logout
5. Try to create a book - should show login modal

### Test Book Ownership
1. Login as User A
2. Create Book X
3. Logout, login as User B
4. Try to edit Book X's title - should get error
5. Try to edit Book X's author - should succeed (as it's a protected route for creator only)

### Test Stock Validation
1. Create a book with stock = 5 (original_stock = 5)
2. Borrow 3 times (stock = 2)
3. Return 3 times (stock = 5)
4. Try to return again - should get error "Cannot return book. Stock cannot exceed original stock count."

## Files Changed

### Backend
- `database/migrations/2025_12_04_133410_add_user_id_and_original_stock_to_books_table.php` (new)
- `app/Models/Book.php`
- `app/Http/Controllers/AuthController.php` (new)
- `app/Http/Middleware/Authenticate.php` (new)
- `app/Http/Controllers/BookController.php`
- `app/Http/Controllers/BorrowController.php`
- `bootstrap/app.php`
- `routes/api.php`

### Frontend
- `src/services/api.ts`
- `src/types.ts`
- `src/components/LoginModal.tsx` (new)
- `src/App.tsx`

### Documentation
- `README.md`
- `AUTHENTICATION.md` (this file)

## Next Steps (Optional Enhancements)

1. **JWT Tokens**: Replace simple base64 with proper JWT tokens
2. **Token Expiration**: Add expiration time and refresh tokens
3. **Email Verification**: Require email verification before login
4. **Password Reset**: Forgot password functionality
5. **Role-Based Access**: Admin vs regular user permissions
6. **Activity Log**: Track who edited what and when
7. **Book Approval**: Require admin approval for new books
8. **API Rate Limiting**: Prevent abuse
9. **Two-Factor Authentication**: Enhanced security
10. **OAuth Integration**: Login with Google/GitHub
