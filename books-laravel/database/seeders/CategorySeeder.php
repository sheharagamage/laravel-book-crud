<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\BookCategory; // Make sure this model exists

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $categories = ['Fiction', 'Science', 'History', 'Technology', 'Business'];

        foreach ($categories as $cat) {
            BookCategory::create([
                'name' => $cat
            ]);
        }
    }
}
