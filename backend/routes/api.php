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
use App\Http\Controllers\Api\AbsenceController;
use App\Http\Controllers\Api\MetierController;
use App\Http\Controllers\EnseignantController;
use App\Http\Controllers\Api\ApprenantController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// 🔥 Route racine
Route::get('/', fn() => response()->json(['message' => 'API is running']));

// 📝 Inscription (sans aucun middleware)
Route::post('/register', [RegisteredUserController::class, 'store']);

// 🔐 Connexion
Route::post('/login', [RegisteredUserController::class, 'login']);

// 🔐 Déconnexion
Route::post('/logout', [RegisteredUserController::class, 'logout'])
    ->middleware([\Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class, 'auth:sanctum']);

// 🔐 Toutes les autres routes nécessitent une authentification + support SPA
Route::middleware([
    \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
    'auth:sanctum'
])->group(function () {

    // 🔹 Récupérer les infos utilisateur
    Route::get('/user', fn(Request $request) => $request->user());

    // ========================
    // 👨‍🎓 ROUTES APPRENANT
    // ========================
    Route::middleware('role:apprenant')->group(function () {
        Route::get('/dashboard/apprenant/{metierSlug}/annee-{annee}', [DashboardController::class, 'apprenant']);

        // 📁 JUSTIFICATIFS - Apprenant
        Route::prefix('justificatifs')->group(function () {
            Route::post('/', [JustificatifController::class, 'store']);
            Route::get('/mes-justificatifs', [JustificatifController::class, 'mesJustificatifs']);
            Route::get('/{id}', [JustificatifController::class, 'show']);
            Route::get('/{id}/download', [JustificatifController::class, 'download']);
            Route::delete('/{id}', [JustificatifController::class, 'destroy']);
        });

        // 📚 DEVOIRS - Apprenant
        Route::get('/apprenant/devoirs', [DevoirController::class, 'devoirsApprenant']);
        Route::get('/devoirs/{devoirId}/ma-soumission', [DevoirController::class, 'maSoumission']);
        Route::post('/devoirs/{devoirId}/soumission', [DevoirController::class, 'soumettreDevoir']);

        // 📅 SÉANCES - Apprenant
        Route::get('/apprenant/seances', [SeanceController::class, 'mesSeances']);
    });

    // ========================
    // 👨‍🏫 ROUTES ENSEIGNANT
    // ========================
    Route::middleware('role:enseignant,admin')->group(function () {
        Route::get('/enseignant/devoirs', [DevoirController::class, 'mesDevoirs']);
        Route::post('/devoirs', [DevoirController::class, 'store']);
        Route::get('/devoirs/{devoirId}/soumissions', [DevoirController::class, 'getSoumissions']);
        Route::get('/dashboard/enseignant', [DashboardController::class, 'enseignant']);
        Route::post('/seances', [SeanceController::class, 'store']);
        Route::post('/presences', [PresenceController::class, 'store']);
        Route::get('/seances/{seance}/apprenants', [PresenceController::class, 'getApprenantsForSeance']);
        Route::post('/seances/{seance}/presences/multiple', [PresenceController::class, 'storeMultiple']);
        Route::post('/soumissions/{soumissionId}/corriger', [DevoirController::class, 'corriger']);
    });

    // ========================
    // 👨‍💼 ROUTES COORDINATEUR + RESPONSABLE MÉTIER + ADMIN
    // ========================
    Route::middleware('role:coordinateur,admin,chef_departement,assistant,responsable_metier')->group(function () {

        // 📁 JUSTIFICATIFS - Coordinateur/Admin/Responsable Métier
        Route::prefix('justificatifs')->group(function () {
            Route::get('/tous', [JustificatifController::class, 'tousJustificatifs']);
            Route::get('/en-attente', [JustificatifController::class, 'justificatifsEnAttente']);
            Route::get('/seance/{seanceId}', [JustificatifController::class, 'index']);
            Route::put('/{id}/statut', [JustificatifController::class, 'updateStatut']);
            Route::get('/{id}', [JustificatifController::class, 'show']);
            Route::get('/{id}/download', [JustificatifController::class, 'download']);
        });

        // Pour le coordinateur uniquement
        Route::middleware('role:coordinateur,admin')->group(function () {
            Route::get('/dashboard/coordinateur', [DashboardController::class, 'coordinateur']);
            Route::get('/coordinateur/devoirs', [DevoirController::class, 'enAttente']);
            Route::get('/absences', [PresenceController::class, 'frequentes']);
            Route::get('/presences', [PresenceController::class, 'indexForCoordinateur']);
            Route::get('/seances', [SeanceController::class, 'indexForCoordinateur']);
        });

        // Pour le responsable métier uniquement
        Route::middleware('role:responsable_metier')->group(function () {
            Route::get('/dashboard/responsable-metier', [DashboardController::class, 'responsableMetier']);
            Route::get('/metier/{metierId}/apprenants', [MetierController::class, 'apprenants']);
            Route::get('/metier/{metierId}/presences', [PresenceController::class, 'rapportParMetier']);
            Route::get('/metier/{metierId}/devoirs', [DevoirController::class, 'parMetier']);

            // 📋 JUSTIFICATIFS SPÉCIFIQUES AU MÉTIER (avec paramètre année optionnel)
            Route::get('/metier/{metierId}/justificatifs', [JustificatifController::class, 'justificatifsParMetier']);
            Route::get('/metier/{metierId}/justificatifs/en-attente', [JustificatifController::class, 'justificatifsEnAttenteParMetier']);
        });
    });

    // ========================
    // 👨‍💼 ROUTES CHEF DE DÉPARTEMENT
    // ========================
    Route::middleware('role:chef_departement')->group(function () {
        Route::get('/dashboard/chef', [DashboardController::class, 'chef']);
    });

    // ========================
    // 📘 ROUTES GÉNÉRALES (Multi-rôles)
    // ========================
    Route::get('/ueas/{ueaId}/devoirs', [DevoirController::class, 'index']);
    Route::get('/ueas/{ueaId}/rapport-absences', [UeaController::class, 'rapportAbsences']);
    Route::get('/ueas/{ueaId}/rapport-absences.pdf', [UeaController::class, 'rapportAbsencesPdf']);
    Route::get('/enseignants', [EnseignantController::class, 'index']);
});

// ========================
// 🔒 ROUTES SPÉCIFIQUES
// ========================

// Absences globales (Coordinateur et Admin uniquement)
Route::middleware([
    \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
    'auth:sanctum',
    'role:coordinateur,admin'
])->get('/absences/globales', [PresenceController::class, 'absencesGlobales']);

// Séances pour responsable métier
Route::middleware('auth:sanctum')->get('/seances/metier', [SeanceController::class, 'indexForResponsableMetier']);

// ========================
// 🧪 ROUTES DE TEST (Local seulement)
// ========================
if (app()->environment('local')) {
    Route::get('/test-mail', function () {
        \Illuminate\Support\Facades\Mail::raw('Test envoyé !', function ($msg) {
            $msg->to('test@isep.sn')->subject('Test');
        });
        return response()->json(['message' => 'Email envoyé']);
    });

    // ✅ Route de test pour l'authentification
    Route::get('/test-auth', function (Request $request) {
        $user = $request->user();

        return response()->json([
            'authenticated' => !!$user,
            'user' => $user ? [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'metier_id' => $user->metier_id
            ] : null,
            'message' => $user ? 'Authentifié avec succès' : 'Non authentifié'
        ]);
    })->middleware([\Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class, 'auth:sanctum']);

    // 🚨 TEMPORAIRE : Route sans restriction de rôle pour déboguer
    Route::get('/apprenants-debug', function (Request $request) {
        $user = $request->user();

        \Log::info('🔍 Route debug /apprenants-debug appelée', [
            'user' => $user ? [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role,
                'email' => $user->email
            ] : null,
            'authenticated' => !!$user
        ]);

        $metierId = $request->query('metier_id');
        $annee = $request->query('annee');

        if (!$metierId) {
            return response()->json(['error' => 'Le paramètre metier_id est requis'], 400);
        }

        $query = \App\Models\User::where('role', 'apprenant')
                    ->where('metier_id', $metierId);

        if ($annee && $annee !== '') {
            $query->where('annee', $annee);
        }

        $apprenants = $query->get(['id', 'name', 'prenom', 'email', 'annee', 'metier_id']);

        return response()->json([
            'apprenants' => $apprenants,
            'count' => $apprenants->count(),
            'debug' => [
                'user_authenticated' => !!$user,
                'user_role' => $user?->role,
                'user_id' => $user?->id
            ]
        ]);
    })->middleware([\Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class, 'auth:sanctum']);

    // 🧪 Test du middleware de rôle
    Route::get('/test-role', function (Request $request) {
        return response()->json([
            'message' => 'Middleware role fonctionne !',
            'user' => $request->user()->only('id', 'name', 'role')
        ]);
    })->middleware([\Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class, 'auth:sanctum', 'role:enseignant']);

    // ✅ CORRIGÉ : Route /apprenants accessible aux enseignants ET admins
    Route::get('/apprenants', function (Request $request) {
        $user = $request->user();

        \Log::info('🔓 Route /apprenants appelée', [
            'user_id' => $user->id,
            'user_role' => $user->role,
            'user_email' => $user->email,
            'metier_id' => $request->query('metier_id')
        ]);

        // ✅ CORRECTION : Autoriser admin + enseignant + autres rôles
        if (!in_array($user->role, ['enseignant', 'admin', 'chef_departement', 'coordinateur'])) {
            return response()->json([
                'error' => 'Accès réservé aux enseignants et administrateurs',
                'your_role' => $user->role,
                'required_role' => 'enseignant, admin, chef_departement ou coordinateur'
            ], 403);
        }

        $metierId = $request->query('metier_id');
        $annee = $request->query('annee');

        if (!$metierId) {
            return response()->json(['error' => 'Le paramètre metier_id est requis'], 400);
        }

        $query = \App\Models\User::where('role', 'apprenant')
                    ->where('metier_id', $metierId);

        if ($annee && $annee !== '') {
            $query->where('annee', $annee);
        }

        $apprenants = $query->get(['id', 'name', 'prenom', 'email', 'annee', 'metier_id']);

        return response()->json([
            'apprenants' => $apprenants,
            'count' => $apprenants->count(),
            'debug' => [
                'user_role' => $user->role,
                'user_id' => $user->id
            ]
        ]);
    })->middleware([\Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class, 'auth:sanctum']);

    Route::get('/presences-for-coordinateur', [PresenceController::class, 'indexForCoordinateur']);
}
