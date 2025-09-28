<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Api\SeanceController;
use App\Http\Controllers\Api\PresenceController;
use App\Http\Controllers\Api\JustificatifController;
use App\Http\Controllers\Api\UeaController;
use App\Http\Controllers\Api\DevoirController;
use App\Http\Controllers\Api\DashboardController;
use Illuminate\Support\Facades\Mail;



/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return view('welcome');
});

//  Routes publiques : authentification
Route::post('/register', [RegisteredUserController::class, 'store']);
Route::post('/login', [RegisteredUserController::class, 'login']);

//  Routes protégées : nécessitent un token
Route::middleware(['auth:sanctum'])->group(function () {

    //  Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    //  Séances
    Route::get('/seances', [SeanceController::class, 'index']);

    //  Enseignant
    Route::middleware(['role:enseignant'])->group(function () {
        Route::post('/seances', [SeanceController::class, 'store']);
        Route::post('/presences', [PresenceController::class, 'store']);
        Route::get('/seances/{seance}/apprenants', [PresenceController::class, 'getApprenantsForSeance']);
        Route::post('/seances/{seance}/presences/multiple', [PresenceController::class, 'storeMultiple']);

        Route::post('/devoirs', [DevoirController::class, 'store']);
        Route::post('/soumissions/{soumissionId}/corriger', [DevoirController::class, 'corriger']);
    });

    //  Apprenant
    Route::middleware(['role:apprenant'])->group(function () {
        Route::post('/justificatifs', [JustificatifController::class, 'store']);
        Route::post('/devoirs/{devoirId}/soumettre', [DevoirController::class, 'soumettre']);
        Route::get('/apprenants', function () {
        return response()->json(
            \App\Models\Apprenant::with('user')->get()
        );
    });
    });

    // 👨‍💼 Coordinateur
    Route::middleware(['role:coordinateur'])->group(function () {
        Route::get('/justificatifs/{seanceId}', [JustificatifController::class, 'index']);
        Route::put('/justificatifs/{id}/valider', [JustificatifController::class, 'updateStatut']);
    });

    // 📎 UEA & Devoirs
    Route::get('/ueas/{ueaId}/devoirs', [DevoirController::class, 'index']);
    Route::get('/ueas/{ueaId}/rapport-absences', [UeaController::class, 'rapportAbsences']);
    Route::get('/ueas/{ueaId}/rapport-absences.pdf', [UeaController::class, 'rapportAbsencesPdf']);
});

// 🧪 Route de test (public)
Route::get('/test-mail', function () {
    Mail::raw('Test email envoyé !', function ($message) {
        $message->to('amadou@isep.sn')->subject('Test Laravel');
    });
    return response()->json(['message' => 'Email envoyé']);
});
// Route::get('/ueas/{uea}/devoirs', [DevoirController::class, 'index']);
// routes/api.php


Route::get('/sanctum/csrf-cookie', function () {
    return response()->json(['message' => 'Sanctum ready']);
})->middleware('web');



Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
