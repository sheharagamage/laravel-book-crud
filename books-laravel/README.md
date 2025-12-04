# Library Management System

A full-stack library management application built with Laravel (backend) and React (frontend) with TypeScript.

## Features

- **Manager Authentication**: Secure login system for library managers
- **Book Management**: Add, edit, delete, and search books with categories
- **Member Management**: Register library members with name and age
- **Transaction Tracking**: Process book borrowing and returns
- **Smart Validation**: 
  - Only borrowers can return books
  - Members with active borrowed books cannot be deleted
  - Real-time stock management
- **Toast Notifications**: User-friendly success and error messages
- **Responsive Design**: Modern UI with TailwindCSS

## Technology Stack

### Backend
- **Laravel 12**: PHP framework
- **MySQL**: Database
- **RESTful API**: JSON-based API endpoints

### Frontend
- **React 19**: UI library
- **TypeScript**: Type-safe JavaScript
- **TailwindCSS**: Utility-first CSS framework

## Prerequisites

- PHP >= 8.2
- Composer
- Node.js >= 18.x
- MySQL >= 8.0
- Git

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/sheharagamage/laravel-book-crud.git
cd laravel-book-crud
```

### 2. Backend Setup (Laravel)

```bash
# Navigate to Laravel directory
cd books-laravel

# Install PHP dependencies
composer install

# Create environment file
copy .env.example .env

# Generate application key
php artisan key:generate

# Configure database in .env file
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=Book_management
# DB_USERNAME=root
# DB_PASSWORD=

# Run migrations and seed database
php artisan migrate:fresh --seed

# Start Laravel development server
php artisan serve
```

The backend will run on `http://localhost:8000`

### 3. Frontend Setup (React)

Open a new terminal window:

```bash
# Navigate to React directory
cd books-frontend/my-app

# Install dependencies
npm install

# Start React development server
npm start
```

The frontend will run on `http://localhost:3000`

## Default Credentials

**Library Manager Login:**
- Email: `manager@library.com`
- Password: `manager123`

## Database Structure

### Tables
- **users**: Library managers and members
- **book_cate**: Book categories
- **books**: Book inventory with stock tracking
- **borrows**: Transaction history (issue/return)

### Relationships
- Books belong to categories
- Books are created by managers (users)
- Borrows track user-book transactions

## API Endpoints

### Authentication
- `POST /api/auth/login` - Manager login
- `POST /api/auth/logout` - Logout

### Books
- `GET /api/books` - List all books
- `POST /api/books` - Create book
- `GET /api/books/{id}` - Get book details
- `PUT /api/books/{id}` - Update book
- `DELETE /api/books/{id}` - Delete book

### Categories
- `GET /api/categories` - List all categories

### Users (Members)
- `GET /api/users` - List all members
- `POST /api/users` - Create member
- `GET /api/users/{id}` - Get member details
- `PUT /api/users/{id}` - Update member
- `DELETE /api/users/{id}` - Delete member (if no active borrows)

### Transactions
- `GET /api/borrows` - List all transactions
- `POST /api/borrows` - Create transaction (borrow/return)

## Usage Guide

1. **Login** as library manager with default credentials
2. **Add Categories**: Pre-seeded with 5 categories (Fiction, Non-Fiction, etc.)
3. **Add Books**: Create books with title, author, price, stock, and category
4. **Add Members**: Register library members with name and age
5. **Borrow Books**: Select a book and member to process borrowing
6. **Return Books**: Only the borrower can return their borrowed books
7. **View Transactions**: See complete history of all borrows and returns

## Development Notes

### Backend API Base URL
Update in `books-frontend/my-app/src/services/api.ts`:
```typescript
const API_BASE_URL = 'http://localhost:8000/api';
```

### CORS Configuration
CORS is configured in `books-laravel/bootstrap/app.php` to allow frontend requests.

## Troubleshooting

**Port already in use:**
```bash
# Laravel
php artisan serve --port=8001

# React
PORT=3001 npm start
```

**Database connection error:**
- Verify MySQL is running
- Check .env database credentials
- Create database: `CREATE DATABASE Book_management;`

**Composer/NPM errors:**
- Clear cache: `composer clear-cache` or `npm cache clean --force`
- Delete vendor/node_modules and reinstall

## Production Build

### Frontend
```bash
cd books-frontend/my-app
npm run build
```

### Backend
```bash
cd books-laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## License

This project is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).

## Author

**Shehara Gamage**
- GitHub: [@sheharagamage](https://github.com/sheharagamage)
- Repository: [laravel-book-crud](https://github.com/sheharagamage/laravel-book-crud)
