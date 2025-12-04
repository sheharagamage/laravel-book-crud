<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Book extends Model
{
    protected $fillable = [
        'title',
        'author',
        'price',
        'stock',
        'original_stock',
        'book_category_id',
        'user_id',
    ];

    protected $casts = [
        'price' => 'float',
        'stock' => 'integer',
        'original_stock' => 'integer',
        'book_category_id' => 'integer',
        'user_id' => 'integer',
    ];

    public function category()
    {
        return $this->belongsTo(BookCategory::class, 'book_category_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
