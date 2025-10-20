<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return ['Laravel' => app()->version()];
});

<<<<<<< HEAD
// 🔥 Route de connexion automatique pour binta
Route::get('/login-binta', function () {
    $user = User::where('email', 'bintadjenga1@gmail.com')->first();

    if ($user) {
        Auth::login($user);
        return redirect('/binta');
    }

    return 'Utilisateur binta non trouvé';
});

// 🔥 Route de test simple (sans Filament)
Route::get('/binta-test', function () {
    if (Auth::check()) {
        return "
            <h1>Bienvenue " . Auth::user()->name . " !</h1>
            <p>Email: " . Auth::user()->email . "</p>
            <p>Rôle: " . Auth::user()->role . "</p>
            <p>Vous êtes connecté avec succès.</p>
            <a href='/binta' style='padding: 10px; background: blue; color: white; text-decoration: none;'>
                📊 Accéder à Filament Admin
            </a>
        ";
    }
    return redirect('/login-binta');
});

=======
>>>>>>> d1afd34fa47113daf1349c5a2f554532664d685f
require __DIR__.'/auth.php';
