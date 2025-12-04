<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ManagerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create default library manager
        User::create([
            'name' => 'Library Manager',
            'email' => 'manager@library.com',
            'password' => Hash::make('manager123'),
            'is_manager' => true,
        ]);
    }
}
