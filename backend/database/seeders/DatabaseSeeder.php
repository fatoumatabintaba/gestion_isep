<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    // DatabaseSeeder.php
public function run()
{
    $metiers = [
        ['nom' => 'Développement Web & Mobile'],
        ['nom' => 'Développement Mobile'],
        ['nom' => 'Réseau & Télécom'],
        ['nom' => 'Administrateur de Réseau']
    ];

    foreach ($metiers as $m) {
        Metier::create($m);
    }
}
}
