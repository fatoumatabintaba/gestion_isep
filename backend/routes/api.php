<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Api\SeanceController;
use App\http\Controllers\Api\PresenceController;
use App\Http\Controllers\Api\JustificatifController;
use App\Http\Controllers\Api\UeaController;
use App\Http\Controllers\Api\DevoirController;
use App\Http\Controllers\Api\DashboardController;
use Illuminate\Support\Facades\Mail;


/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
//     return $request->user();
// });

//  Routes publiques : inscription et connexion
Route::post('/register', [RegisteredUserController::class, 'store']);
Route::post('/login', [RegisteredUserController::class, 'login']);

//  Routes protégées : nécessitent un token
Route::middleware(['auth:sanctum'])->group(function () {

    //  Lister toutes les séances (accessible à tous les utilisateurs authentifiés)
    Route::get('/seances', [SeanceController::class, 'index']);

    // 🔐 Routes réservées aux enseignants
    Route::middleware(['role:enseignant'])->group(function () {
        // Créer une séance
        Route::post('/seances', [SeanceController::class, 'store']);


// Pour lister les séances
Route::get('/seances', [SeanceController::class, 'index']);

//  Pour créer une séance
Route::post('/seances', [SeanceController::class, 'store']);
 // Pointage par matricule (optionnel)
        Route::post('/presences', [PresenceController::class, 'store']);

        // Lister les apprenants d'une séance (pour afficher les cases à cocher)
        Route::get('/seances/{seance}/apprenants', [PresenceController::class, 'getApprenantsForSeance']);

        // Enregistrer plusieurs présences (cases cochées)
        Route::post('/seances/{seance}/presences/multiple', [PresenceController::class, 'storeMultiple']);
    });

  Route::middleware(['auth:sanctum'])->group(function () {
    // 🔐 Seul un apprenant peut soumettre un justificatif
    Route::middleware(['role:apprenant'])->group(function () {
        Route::post('/justificatifs', [JustificatifController::class, 'store']);
    });

    // 🔐 Seul un coordinateur peut voir les justificatifs
    Route::middleware(['role:coordinateur'])->group(function () {
        Route::get('/justificatifs/{seanceId}', [JustificatifController::class, 'index']);
    });
});

Route::middleware(['auth:sanctum', 'role:coordinateur'])->group(function () {
    Route::put('/justificatifs/{id}/valider', [JustificatifController::class, 'updateStatut']);
});



Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/ueas/{ueaId}/rapport-absences', [UeaController::class, 'rapportAbsences']);
});


Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/ueas/{ueaId}/devoirs', [DevoirController::class, 'index']);

    Route::middleware(['role:enseignant'])->group(function () {
        Route::post('/devoirs', [DevoirController::class, 'store']);
        Route::post('/soumissions/{soumissionId}/corriger', [DevoirController::class, 'corriger']);
    });

    Route::middleware(['auth:sanctum', 'role:apprenant'])->group(function () {
    Route::post('/devoirs/{devoirId}/soumettre', [DevoirController::class, 'soumettre']);
});
    });

    Route::get('/test-mail', function () {
    Mail::raw('Ceci est un test depuis Laravel avec Brevo 🎉', function ($message) {
        $message->to('ton_email@gmail.com')
                ->subject('Test Email Brevo - Laravel');
    });

    return response()->json(['message' => 'Email envoyé avec succès ✅']);
});



Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
});
});
