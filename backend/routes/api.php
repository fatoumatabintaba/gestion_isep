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
use App\Http\Controllers\Auth\GoogleOAuthController;
use App\Http\Controllers\Api\VideoConferenceController;
use App\Http\Controllers\RapportController;

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

// ========================
// 🔐 ROUTES OAUTH (Google & Zoom)
// ========================
Route::get('/auth/google', [GoogleOAuthController::class, 'redirect'])->name('google.redirect');
Route::get('/auth/google/callback', [GoogleOAuthController::class, 'callback'])->name('google.callback');

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
    // 📊 ROUTES RAPPORTS (Corrigées et déplacées ici)
    // ========================
    Route::middleware('role:responsable_metier,chef_departement,admin')->group(function () {

        // 🔹 ROUTES DE BASE POUR LES RAPPORTS (REST API)
        Route::apiResource('rapports', RapportController::class);

        // 🔹 ROUTES SPÉCIFIQUES POUR LE SYSTÈME DE RAPPORTS
        Route::prefix('rapports')->group(function () {
            // Route pour envoyer un rapport au chef de département
            Route::post('/chef-departement', [RapportController::class, 'envoyerAuChefDepartement']);

            // Route pour récupérer les rapports reçus (pour le chef de département)
            Route::get('/chef-departement', [RapportController::class, 'getRapportsPourChefDepartement']);

            // Route pour valider un rapport
            Route::put('/{id}/valider', [RapportController::class, 'validerRapport']);

            // Route pour rejeter un rapport
            Route::put('/{id}/rejeter', [RapportController::class, 'rejeterRapport']);

            // Route pour valider tous les rapports en attente
            Route::put('/valider-tous', [RapportController::class, 'validerTousRapports']);

            // Route pour envoyer à l'administration
            Route::post('/administration', [RapportController::class, 'envoyerAAdministration']);
        });
    });

    // 🔥 CORRECTION AJOUTÉE : Routes justificatifs accessibles à tous les utilisateurs authentifiés
    Route::prefix('justificatifs')->group(function () {
        Route::get('/en-attente', [JustificatifController::class, 'justificatifsEnAttente']);
        Route::get('/{id}', [JustificatifController::class, 'show']);
        Route::get('/{id}/download', [JustificatifController::class, 'download']);
    });

    // ========================
    // 🎥 ROUTES VIDÉOCONFÉRENCE
    // ========================
    Route::middleware('role:enseignant,admin,chef_departement')->group(function () {
        Route::post('/meetings/google-meet', [VideoConferenceController::class, 'creerGoogleMeet']);
        Route::post('/meetings/demo', [VideoConferenceController::class, 'genererLienDemo']);
    });

    // ========================
    // 👨‍🎓 ROUTES APPRENANT
    // ========================
    Route::middleware('role:apprenant')->group(function () {
        Route::get('/dashboard/apprenant/{metierSlug}/annee-{annee}', [DashboardController::class, 'apprenant']);

        // ✅ CORRECTION: ROUTES UNIFIÉES POUR LE FRONTEND
        Route::get('/apprenant/seances', [SeanceController::class, 'mesSeances']);
        Route::get('/apprenant/justificatifs/mes-justificatifs', [JustificatifController::class, 'mesJustificatifs']);

        // ✅ CORRECTION: Utiliser VideoConferenceController pour les cours en ligne
        Route::get('/apprenant/cours-en-ligne', [VideoConferenceController::class, 'mesCoursEnLigne']);

        // 📁 JUSTIFICATIFS - Apprenant
        Route::prefix('justificatifs')->group(function () {
            Route::post('/', [JustificatifController::class, 'store']);
            Route::get('/mes-justificatifs', [JustificatifController::class, 'mesJustificatifs']);
            Route::delete('/{id}', [JustificatifController::class, 'destroy']);
        });

        // 📚 DEVOIRS - Apprenant
        Route::get('/apprenant/devoirs', [DevoirController::class, 'devoirsApprenant']);
        Route::get('/devoirs/{devoirId}/ma-soumission', [DevoirController::class, 'maSoumission']);
        Route::post('/devoirs/{devoirId}/soumission', [DevoirController::class, 'soumettreDevoir']);

        // ✅ AJOUT: ROUTES POUR LES ABSENCES DES APPRENANTS
        Route::get('/apprenant/absences', [ApprenantController::class, 'mesAbsences']);
        Route::post('/apprenant/absences/{absence}/justifier', [ApprenantController::class, 'deposerJustificatif']);
    });

    // ========================
    // 👨‍🏫 ROUTES ENSEIGNANT
    // ========================
    Route::middleware('role:enseignant,admin,responsable_metier')->group(function () {
        Route::get('/enseignant/devoirs', [DevoirController::class, 'mesDevoirs']);
        Route::post('/devoirs', [DevoirController::class, 'store']);
        Route::get('/devoirs/{devoirId}/soumissions', [DevoirController::class, 'getSoumissions']);

        // ✅ CORRECTION: ROUTES MANQUANTES POUR LA CORRECTION DES DEVOIRS
        Route::post('/soumissions/{soumissionId}/feedback', [DevoirController::class, 'envoyerFeedback']);
        Route::post('/soumissions/{soumissionId}/corriger', [DevoirController::class, 'envoyerFeedback']); // ✅ ALIAS

        Route::get('/dashboard/enseignant', [DashboardController::class, 'enseignant']);
        Route::post('/seances', [SeanceController::class, 'store']);
        Route::post('/presences', [PresenceController::class, 'store']);
        Route::get('/seances/{seance}/apprenants', [PresenceController::class, 'getApprenantsForSeance']);
        Route::post('/seances/{seance}/presences/multiple', [PresenceController::class, 'storeMultiple']);

        // ✅ AJOUT: Route pour notifier les absences
        Route::post('/seances/{seance}/notifier-absences', [SeanceController::class, 'notifierAbsences']);

        // ✅ AJOUT: Route pour voir seulement le STATUT des justificatifs (pas les fichiers)
        Route::get('/enseignant/seances/{seanceId}/statut-absences', [PresenceController::class, 'statutAbsencesPourEnseignant']);
    });

    // ========================
    // 👨‍💼 ROUTES COORDINATEUR + RESPONSABLE MÉTIER + ADMIN
    // ========================
    Route::middleware('role:coordinateur,admin,chef_departement,assistant,responsable_metier')->group(function () {

        // 📁 JUSTIFICATIFS - Coordinateur/Admin/Responsable Métier (ACCÈS COMPLET)
        Route::prefix('justificatifs')->group(function () {
            Route::get('/tous', [JustificatifController::class, 'tousJustificatifs']);
            Route::get('/seance/{seanceId}', [JustificatifController::class, 'index']);
            Route::put('/{id}/statut', [JustificatifController::class, 'updateStatut']);

            // ✅ AJOUT: Route pour voir les détails complets des absences avec justificatifs
            Route::get('/seance/{seanceId}/absences-detail', [JustificatifController::class, 'absencesAvecJustificatifs']);
        });

        // Pour le coordinateur uniquement
        Route::middleware('role:coordinateur,admin')->group(function () {
            Route::get('/dashboard/coordinateur', [DashboardController::class, 'coordinateur']);
            Route::get('/coordinateur/devoirs', [DevoirController::class, 'enAttente']);
            Route::get('/absences', [PresenceController::class, 'frequentes']);
            Route::get('/presences', [PresenceController::class, 'indexForCoordinateur']);
            Route::get('/coordinateur/presences', [PresenceController::class, 'indexForCoordinateur']);
            Route::get('/seances', [SeanceController::class, 'indexForCoordinateur']);

            // ✅ AJOUT: Route pour les statistiques du dashboard coordinateur
            Route::get('/presences/stats-dashboard', [PresenceController::class, 'statsDashboard']);
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
            Route::put('/justificatifs/{id}/valider', [JustificatifController::class, 'valider']);
            Route::put('/justificatifs/{id}/rejeter', [JustificatifController::class, 'rejeter']);

            // 🆕 ROUTES EXISTANTES POUR LE DASHBOARD
            Route::get('/apprenants/metier/{metierId}', [ApprenantController::class, 'parMetier']);
            Route::get('/uea/metier/{metierId}', [UeaController::class, 'parMetier']);
            Route::get('/stats/metier', [DashboardController::class, 'statsMetier']);

            // ✅ NOUVELLES ROUTES AJOUTÉES (3 routes)
            Route::get('/dashboard/uea/metier/{metierId}', [DashboardController::class, 'ueaParMetier']);
            Route::get('/dashboard/apprenants/metier/{metierId}', [DashboardController::class, 'apprenantsParMetier']);
            Route::get('/dashboard/justificatifs/en-attente', [DashboardController::class, 'justificatifsEnAttente']);
        });
    });

    // ========================
    // 👨‍💼 ROUTES CHEF DE DÉPARTEMENT
    // ========================
    Route::middleware('role:chef_departement')->group(function () {
        Route::get('/dashboard/chef', [DashboardController::class, 'chef']);
    });

    // ========================
    // ✅ ROUTE APPRENANTS (Multi-rôles) - AJOUT ICI
    // ========================
    Route::middleware('role:enseignant,admin,chef_departement,coordinateur,responsable_metier')->group(function () {
        Route::get('/apprenants', [ApprenantController::class, 'index']);
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
    // Test des routes rapports
    Route::get('/test-rapports', function () {
        return response()->json([
            'message' => 'API Rapports est fonctionnelle!',
            'routes_disponibles' => [
                'GET /api/rapports' => 'Liste tous les rapports',
                'POST /api/rapports' => 'Créer un rapport',
                'GET /api/rapports/{id}' => 'Afficher un rapport',
                'PUT /api/rapports/{id}' => 'Modifier un rapport',
                'DELETE /api/rapports/{id}' => 'Supprimer un rapport',
                'POST /api/rapports/chef-departement' => 'Envoyer au chef de département',
                'GET /api/rapports/chef-departement' => 'Récupérer rapports pour chef département',
                'PUT /api/rapports/{id}/valider' => 'Valider un rapport',
                'PUT /api/rapports/{id}/rejeter' => 'Rejeter un rapport',
                'PUT /api/rapports/valider-tous' => 'Valider tous les rapports',
                'POST /api/rapports/administration' => 'Envoyer à l\'administration'
            ]
        ]);
    });

    // Test d'authentification
    Route::get('/test-auth', function (Request $request) {
        return response()->json([
            'authenticated' => auth()->check(),
            'user' => auth()->user(),
            'roles' => auth()->check() ? auth()->user()->getRoleNames() : []
        ]);
    })->middleware('auth:sanctum');

 // REMPLACEZ les anciennes routes par :
Route::post('/rapports/chef-departement', [RapportChefDepartementController::class, 'envoyerRapport']);
Route::get('/rapports/chef-departement', [RapportChefDepartementController::class, 'getRapports']);

// Route TEMPORAIRE pour tester l'envoi de rapport
Route::post('/test/rapport-envoi', function(Request $request) {
    \Illuminate\Support\Facades\Log::info('=== TEST ENVOI RAPPORT ===');
    \Illuminate\Support\Facades\Log::info('Données reçues:', $request->all());

    try {
        $validated = $request->validate([
            'titre' => 'required|string',
            'contenu' => 'required|string',
            'metier_id' => 'required',
            'annee' => 'required|string',
            'uea_nom' => 'required|string'
        ]);

        $rapport = \App\Models\Rapport::create([
            'user_id' => \Illuminate\Support\Facades\Auth::id(),
            'metier' => $validated['titre'],
            'code_metier' => 'CD-' . time(),
            'statistiques' => $validated,
            'periode' => 'Test ' . $validated['annee'],
            'justificatifs_traites' => 0,
            'statut' => 'valide',
            'date_soumission' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Rapport créé avec succès!',
            'rapport_id' => $rapport->id
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
});

// Route TEMPORAIRE pour récupérer les rapports
Route::get('/test/rapports-chef', function() {
    try {
        $rapports = \App\Models\Rapport::with('user:id,name,email')
            ->where('code_metier', 'like', 'CD-%')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($rapport) {
                return [
                    'id' => $rapport->id,
                    'metier' => $rapport->metier,
                    'code_metier' => $rapport->code_metier,
                    'coordinateur' => $rapport->user->name ?? 'Utilisateur inconnu',
                    'date_soumission' => $rapport->date_soumission?->format('d/m/Y') ?? $rapport->created_at->format('d/m/Y'),
                    'periode' => $rapport->periode,
                    'statistiques' => is_array($rapport->statistiques) ? $rapport->statistiques : [],
                    'justificatifs_traites' => $rapport->justificatifs_traites,
                    'statut' => $rapport->statut
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $rapports
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
});


// ROUTES DE TEST TEMPORAIRES
Route::post('/test/rapport-envoi', function(Request $request) {
    \Log::info('=== TEST ENVOI RAPPORT RESPONSABLE METIER ===');
    \Log::info('Headers:', $request->headers->all());
    \Log::info('User:', Auth::user() ? ['id' => Auth::user()->id, 'name' => Auth::user()->name] : 'Non auth');
    \Log::info('Données reçues:', $request->all());

    try {
        $validated = $request->validate([
            'titre' => 'required|string',
            'contenu' => 'required|string',
            'metier_id' => 'required',
            'annee' => 'required|string',
            'uea_nom' => 'required|string'
        ]);

        // Création simple du rapport
        $rapport = \App\Models\Rapport::create([
            'user_id' => Auth::id(),
            'metier' => $validated['titre'],
            'code_metier' => 'CD-' . time(),
            'statistiques' => $validated,
            'periode' => 'Test ' . $validated['annee'],
            'justificatifs_traites' => 0,
            'statut' => 'valide',
            'date_soumission' => now(),
        ]);

        \Log::info('✅ Rapport test créé:', ['id' => $rapport->id]);

        return response()->json([
            'success' => true,
            'message' => 'Rapport test créé avec succès!',
            'rapport_id' => $rapport->id,
            'test' => true
        ]);

    } catch (\Exception $e) {
        \Log::error('❌ Erreur route test:', [
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Erreur test: ' . $e->getMessage(),
            'test' => true
        ], 500);
    }
});

Route::get('/test/rapports-chef', function() {
    try {
        $rapports = \App\Models\Rapport::with('user:id,name,email')
            ->where('code_metier', 'like', 'CD-%')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($rapport) {
                return [
                    'id' => $rapport->id,
                    'titre' => $rapport->metier,
                    'contenu' => is_array($rapport->statistiques) ? ($rapport->statistiques['contenu'] ?? '') : '',
                    'uea_nom' => is_array($rapport->statistiques) ? ($rapport->statistiques['uea_nom'] ?? '') : '',
                    'annee' => is_array($rapport->statistiques) ? ($rapport->statistiques['annee'] ?? '') : '',
                    'metier_id' => is_array($rapport->statistiques) ? ($rapport->statistiques['metier_id'] ?? '') : '',
                    'coordinateur' => $rapport->user->name ?? 'Utilisateur inconnu',
                    'statut' => $rapport->statut,
                    'date_soumission' => $rapport->date_soumission?->format('d/m/Y H:i') ?? $rapport->created_at->format('d/m/Y H:i'),
                    'periode' => $rapport->periode,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $rapports,
            'test' => true
        ]);

    } catch (\Exception $e) {
        \Log::error('Erreur récupération rapports test: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'error' => 'Erreur test: ' . $e->getMessage(),
            'test' => true
        ], 500);
    }
});
}
