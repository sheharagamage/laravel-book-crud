# Authentication Quick Start Guide

## 🚀 Getting Started with Authentication

This guide will help you test the new authentication and authorization features.

## Prerequisites

Make sure both backend and frontend are running:

```powershell
# Terminal 1 - Backend
cd d:\laravel-book-crud\books-laravel
php artisan serve

# Terminal 2 - Frontend  
cd d:\laravel-book-crud\books-frontend\my-app
npm start
```

## Step-by-Step Testing

### 1. Register Your First User

1. Open http://localhost:3000
2. Click the blue **"Login"** button in the top right
3. Click **"Don't have an account? Register"** at the bottom
4. Fill in the registration form:
   - **Name**: John Doe
   - **Email**: john@example.com
   - **Password**: password123 (minimum 8 characters)
5. Click **"Register"**
6. You should see "John Doe" appear in the header with a "Logout" button

### 2. Create a Book (As Creator)

1. While logged in as John Doe, click **"Add Book"** button
2. Fill in the form:
   - **Title**: The Great Gatsby
   - **Author**: F. Scott Fitzgerald
   - **Price**: 15.99
   - **Stock**: 10
   - **Category**: Fiction
3. Click **"Save"**
4. The book appears in the list with "John Doe" in the **"Created By"** column
5. Note: `user_id` and `original_stock` are automatically set

### 3. Test Book Ownership (Edit Title)

1. While still logged in as John Doe, find the book you created
2. Click the ✏️ **Edit** icon
3. Change the **title** to "The Great Gatsby - Annotated"
4. Click **"Save"** - should succeed ✅
5. Only John can edit the title of this book!

### 4. Create a Second User

1. Click **"Logout"** button
2. Click **"Login"** button
3. Click **"Don't have an account? Register"**
4. Register as:
   - **Name**: Jane Smith
   - **Email**: jane@example.com
   - **Password**: password123
5. You should now see "Jane Smith" in the header

### 5. Test Authorization (Non-Creator)

1. While logged in as Jane Smith, find the book created by John
2. Click the ✏️ **Edit** icon
3. Try to change the **title** to something else
4. Try to change the **author**, **price**, or **stock**
5. Click **"Save"**
6. You should get an error: **"Only the book creator can edit the title"** ❌

Note: Since we protected the entire update route, Jane cannot edit any field. To allow Jane to edit other fields (author, price, etc.) while protecting only the title, you would need to implement more granular authorization.

### 6. Test Book Creation (As Second User)

1. While logged in as Jane, click **"Add Book"**
2. Create a new book:
   - **Title**: 1984
   - **Author**: George Orwell
   - **Price**: 12.99
   - **Stock**: 8
   - **Category**: Fiction
3. Click **"Save"**
4. The book appears with "Jane Smith" in the **"Created By"** column

### 7. Test Stock Validation

1. Create a book with **stock = 5**
2. Click **"Borrow"** and select a user - repeat 3 times (stock becomes 2)
3. Click **"Return"** and select a user - repeat 3 times (stock becomes 5)
4. Click **"Return"** again - you should see an error:
   **"Cannot return book. Stock cannot exceed original stock count."** ❌

### 8. Test Protected Actions Without Login

1. Click **"Logout"**
2. Try to click **"Add Book"** - login modal should appear
3. Try to click **"Borrow"** on any book - login modal should appear
4. Try to click ✏️ **Edit** - login modal should appear
5. Try to click 🗑️ **Delete** - login modal should appear

Note: You can still **view** books, users, and transactions without logging in!

### 9. Test Persistent Login

1. After logging in, close the browser tab
2. Open http://localhost:3000 again in a new tab
3. You should still be logged in! (token stored in localStorage)
4. Your name should appear in the header

### 10. Switch Between Users

1. Logout from current user
2. Click **"Login"**
3. Login with previous credentials:
   - john@example.com / password123
   - OR jane@example.com / password123
4. Notice how each user can only edit the title of books they created

## API Testing with cURL/Postman

### Register
```bash
curl -X POST http://127.0.0.1:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "user": {
    "id": 1,
    "name": "Test User",
    "email": "test@example.com"
  },
  "token": "MXwxNzMzMzE2NDg1"
}
```

### Login
```bash
curl -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Create Book (Authenticated)
```bash
curl -X POST http://127.0.0.1:8000/api/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Test Book",
    "author": "Test Author",
    "price": 19.99,
    "stock": 15,
    "book_category_id": 1
  }'
```

### Try Without Token (Should Fail)
```bash
curl -X POST http://127.0.0.1:8000/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Book",
    "author": "Test Author",
    "price": 19.99,
    "stock": 15,
    "book_category_id": 1
  }'
```

Response:
```json
{
  "message": "Unauthenticated"
}
```

## Database Verification

### Check User ID Assignment
```sql
SELECT id, title, user_id, original_stock, stock 
FROM books 
ORDER BY created_at DESC;
```

You should see:
- `user_id` populated with creator's ID
- `original_stock` matching initial stock value
- `stock` changing as books are borrowed/returned

### Check Borrow Records
```sql
SELECT b.id, b.type, u.name as user_name, bk.title as book_title, b.created_at
FROM borrows b
JOIN users u ON b.user_id = u.id
JOIN books bk ON b.book_id = bk.id
ORDER BY b.created_at DESC;
```

## Common Issues

### "Unauthenticated" Error
- Make sure you're logged in
- Check if token is in localStorage: Open DevTools > Application > Local Storage > http://localhost:3000
- Look for `authToken` key

### Can't Edit Book Title
- Verify you're logged in as the creator
- Check `user_id` in books table matches your user ID
- Use: `SELECT id, title, user_id FROM books WHERE title = 'Your Book';`

### Stock Exceeds Original Stock Error
- This is correct behavior! Stock cannot exceed `original_stock`
- Check: `SELECT title, stock, original_stock FROM books WHERE id = 1;`
- Borrow the book to decrease stock, then try returning

### Login Modal Keeps Appearing
- Clear localStorage: DevTools > Application > Local Storage > Clear All
- Refresh page
- Register/login again

## What to Look For

✅ **Success Indicators**:
- User name appears in header after login
- "Created By" column shows correct names
- Books can only have title edited by creator
- Protected actions require authentication
- Stock never exceeds original_stock
- Login persists across browser sessions

❌ **Expected Failures**:
- Non-creator cannot edit book title
- Cannot return book when stock = original_stock
- Cannot perform protected actions without login
- Invalid credentials rejected

## Next Steps

After verifying authentication works:

1. Test all CRUD operations with auth
2. Try creating multiple users and books
3. Test borrow/return with different users
4. Verify transaction history shows all users
5. Test the Users tab (create/edit/delete users)

## Troubleshooting

### Reset Everything
```powershell
# Backend
cd d:\laravel-book-crud\books-laravel
php artisan migrate:fresh --seed

# Frontend (clear storage)
# Open DevTools > Application > Clear site data
```

### Check Logs
```powershell
# Laravel logs
Get-Content d:\laravel-book-crud\books-laravel\storage\logs\laravel.log -Tail 50

# Browser console
# Press F12 > Console tab
```

## Conclusion

You've now tested:
- ✅ User registration and login
- ✅ Token-based authentication
- ✅ Book ownership tracking
- ✅ Creator-only title editing
- ✅ Stock validation
- ✅ Protected vs public routes
- ✅ Persistent login sessions

The authentication system is working correctly! 🎉
