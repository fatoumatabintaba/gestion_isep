<?php

namespace App\Http\Controllers\Api;

use App\Models\Apprenant;
use App\Models\Presence;
use App\Models\Seance;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class PresenceController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    // Lister les apprenants concernés par une séance + leurs présences
    public function getApprenantsForSeance(Seance $seance)
    {
        $user = Auth::user();
        $allowedRoles = ['enseignant', 'admin', 'chef_departement', 'coordinateur', 'responsable_metier'];

        if (!in_array($user->role, $allowedRoles)) {
            return response()->json(['message' => 'Accès refusé - Rôle non autorisé'], 403);
        }

        $apprenants = Apprenant::where('metier_id', $seance->metier_id)
            ->where('annee', $seance->annee)
            ->with([
                'user',
                'presences' => fn($q) => $q->where('seance_id', $seance->id),
                'metier' // ✅ Charger la relation métier
            ])
            ->get();

        return response()->json([
            'seance' => $seance,
            'apprenants' => $apprenants->map(function ($app) use ($seance) {
                $presence = $app->presences->first();
                return [
                    'id' => $app->id,
                    'nom_complet' => $app->prenom . ' ' . $app->nom,
                    'matricule' => $app->matricule,
                    'metier_nom' => $app->metier?->nom, // ✅ Ajouté ici
                    'statut' => $presence?->statut ?? null,
                    'commentaire' => $presence?->commentaire ?? null
                ];
            })
        ]);
    }

    // Enregistrer plusieurs présences en une fois
    public function storeMultiple(Request $request, Seance $seance)
    {
        $user = Auth::user();
        $allowedRoles = ['enseignant', 'admin', 'chef_departement', 'coordinateur', 'responsable_metier'];

        if (!in_array($user->role, $allowedRoles)) {
            return response()->json(['message' => 'Accès refusé - Rôle non autorisé'], 403);
        }

        $request->validate([
            'date' => 'required|date',
            'presences' => 'required|array',
            'presences.*.apprenant_id' => 'required|integer',
            'presences.*.statut' => 'required|in:present,absent,retard,demi',
            'presences.*.commentaire' => 'nullable|string|max:255'
        ]);

        // ✅ Charger la relation 'metier' pour tous les apprenants
        $apprenantsAutorises = Apprenant::where('metier_id', $seance->metier_id)
            ->where('annee', $seance->annee)
            ->with('metier') // ✅ Ici
            ->get();

        $apprenantIdsAutorises = $apprenantsAutorises->pluck('id')->toArray();
        Log::info('DEBUG', [
            'apprenantIdsAutorises' => $apprenantIdsAutorises,
            'presences_envoyees' => $request->presences
        ]);

        $results = [
            'traitees' => [],
            'ignorees' => []
        ];

        foreach ($request->presences as $index => $data) {
            $apprenantId = $data['apprenant_id'];

            if (in_array($apprenantId, $apprenantIdsAutorises)) {
                try {
                    $presence = Presence::updateOrCreate(
                        [
                            'seance_id' => $seance->id,
                            'apprenant_id' => $apprenantId,
                            'date' => $request->date,
                        ],
                        [
                            'statut' => $data['statut'],
                            'commentaire' => $data['commentaire'] ?? null,
                        ]
                    );

                    $apprenant = $apprenantsAutorises->firstWhere('id', $apprenantId);
                    $results['traitees'][] = [
                        'apprenant_id' => $apprenantId,
                        'nom' => $apprenant->nom,
                        'prenom' => $apprenant->prenom,
                        'nom_complet' => $apprenant->prenom . ' ' . $apprenant->nom,
                        'metier_id' => $apprenant->metier_id,
                        'metier_nom' => $apprenant->metier?->nom, // ✅ Ajouté ici
                        'annee' => $apprenant->annee,
                        'uea_nom' => $seance->uea_nom,
                        'statut' => $data['statut'],
                        'date' => $request->date,
                        'message' => 'Présence enregistrée avec succès'
                    ];

                } catch (\Exception $e) {
                    $results['ignorees'][] = [
                        'apprenant_id' => $apprenantId,
                        'raison' => 'Erreur technique: ' . $e->getMessage()
                    ];
                    Log::error("Erreur enregistrement présence - Apprenant ID: $apprenantId - " . $e->getMessage());
                }
            } else {
                $results['ignorees'][] = [
                    'apprenant_id' => $apprenantId,
                    'raison' => 'Apprenant non éligible pour cette séance (ID inexistant ou mauvais métier/année)'
                ];
                Log::warning("Apprenant ID $apprenantId ignoré - non éligible pour la séance $seance->id");
            }
        }

        return response()->json([
            'message' => 'Traitement des présences terminé',
            'seance_id' => $seance->id,
            'date' => $request->date,
            'results' => $results,
            'resume' => [
                'total_traitees' => count($results['traitees']),
                'total_ignorees' => count($results['ignorees'])
            ]
        ]);
    }

    /**
     * Lister toutes les présences d'une séance pour une date donnée
     */
    public function index(Request $request, $seance_id)
    {
        $request->validate([
            'date' => 'required|date'
        ]);

        $presences = Presence::where('seance_id', $seance_id)
            ->where('date', $request->date)
            ->with(['apprenant.metier']) // ✅ Charger le métier aussi ici
            ->get();

        return response()->json($presences);
    }

    /**
     * [Optionnel] Pointage rapide par matricule (ex: scan badge)
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        $allowedRoles = ['enseignant', 'admin', 'chef_departement', 'coordinateur', 'responsable_metier'];

        if (!in_array($user->role, $allowedRoles)) {
            return response()->json(['message' => 'Accès refusé - Rôle non autorisé'], 403);
        }

        $request->validate([
            'seance_id' => 'required|exists:seances,id',
            'matricule' => 'required|exists:apprenants,matricule',
            'date' => 'required|date',
            'statut' => 'required|in:present,retard',
            'commentaire' => 'nullable|string'
        ]);

        $apprenant = Apprenant::where('matricule', $request->matricule)->first();
        $seance = Seance::find($request->seance_id);

        if ($apprenant->metier_id != $seance->metier_id || $apprenant->annee != $seance->annee) {
            return response()->json([
                'message' => 'Cet apprenant n\'est pas autorisé pour cette séance'
            ], 403);
        }

        $presence = Presence::updateOrCreate(
            [
                'seance_id' => $seance->id,
                'apprenant_id' => $apprenant->id,
                'date' => $request->date,
            ],
            [
                'statut' => $request->statut,
                'commentaire' => $request->commentaire,
            ]
        );

        return response()->json([
            'message' => 'Présence enregistrée avec succès',
            'presence' => $presence->load(['apprenant.metier', 'seance'])
        ], 201);
    }

    /**
     * Récupérer toutes les absences globales (avec métier)
     */
    public function absencesGlobales()
    {
        $absences = Presence::where('statut', 'absent')
            ->with(['apprenant.user', 'apprenant.metier', 'seance'])
            ->get()
            ->groupBy(function ($item) {
                return $item->apprenant->metier?->nom ?? 'Inconnu';
            });

        return response()->json($absences);
    }

    /**
     * Récupérer les absences fréquentes pour le coordinateur
     */
    public function frequentes()
    {
        try {
            $user = Auth::user();

            Log::info('📊 Récupération des absences fréquentes pour coordinateur', [
                'user_id' => $user->id,
                'user_role' => $user->role
            ]);

            // Compter les absences par apprenant
            $absencesFrequentes = Presence::where('statut', 'absent')
                ->with(['apprenant.user', 'apprenant.metier'])
                ->get()
                ->groupBy('apprenant_id')
                ->map(function ($presences, $apprenantId) {
                    $apprenant = $presences->first()->apprenant;
                    return [
                        'id' => $apprenantId,
                        'nb_absences' => $presences->count(),
                        'apprenant' => [
                            'user' => [
                                'name' => $apprenant->user->name ?? 'Inconnu',
                                'prenom' => $apprenant->user->prenom ?? 'Inconnu'
                            ],
                            'metier' => $apprenant->metier->nom ?? 'Non spécifié',
                            'annee' => $apprenant->annee ?? '?'
                        ]
                    ];
                })
                ->values()
                ->sortByDesc('nb_absences')
                ->take(10); // Top 10 des absences les plus fréquentes

            Log::info('✅ Absences fréquentes récupérées', ['count' => $absencesFrequentes->count()]);

            return response()->json($absencesFrequentes->values());

        } catch (\Exception $e) {
            Log::error('❌ Erreur récupération absences fréquentes: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Erreur lors de la récupération des absences fréquentes',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer toutes les présences pour le coordinateur (CORRIGÉ)
     */
    public function indexForCoordinateur()
    {
        try {
            $user = Auth::user();

            Log::info('📊 Récupération des présences pour coordinateur', [
                'user_id' => $user->id,
                'user_role' => $user->role
            ]);

            // ✅ CORRIGÉ : Relations simplifiées
            $presences = Presence::with([
                'apprenant', // Apprenant direct
                'seance.enseignant', // Enseignant direct (User)
                'seance.uea:id,nom',
                'seance.metier:id,nom'
            ])
            ->latest()
            ->get();

            Log::info('✅ Présences récupérées', ['count' => $presences->count()]);

            // Formater les données pour le frontend
            $formattedPresences = $presences->map(function ($presence) {
                return [
                    'id' => $presence->id,
                    'statut' => $presence->statut,
                    'date' => $presence->created_at->format('Y-m-d'),
                    'apprenant' => $presence->apprenant ? [
                        'id' => $presence->apprenant->id,
                        'prenom' => $presence->apprenant->prenom, // ✅ Direct depuis Apprenant
                        'nom' => $presence->apprenant->nom, // ✅ Direct depuis Apprenant
                        'metier' => $presence->apprenant->metier ?? 'Non spécifié',
                        'annee' => $presence->apprenant->annee ?? null
                    ] : null,
                    'seance' => $presence->seance ? [
                        'id' => $presence->seance->id,
                        'nom' => $presence->seance->nom,
                        'matiere' => $presence->seance->matiere,
                        'uea_nom' => $presence->seance->uea->nom ?? 'Non spécifié',
                        'metier' => $presence->seance->metier->nom ?? 'Non spécifié',
                        'date' => $presence->seance->date,
                        'heure_debut' => $presence->seance->heure_debut,
                        'heure_fin' => $presence->seance->heure_fin,
                        'enseignant' => $presence->seance->enseignant ? [
                            'name' => $presence->seance->enseignant->name // ✅ Direct depuis User
                        ] : null
                    ] : null
                ];
            });

            return response()->json($formattedPresences);

        } catch (\Exception $e) {
            Log::error('❌ Erreur récupération présences coordinateur: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Erreur lors de la récupération des présences',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Rapport des présences par métier (pour responsable métier)
     */
    public function rapportParMetier($metierId)
    {
        try {
            $presences = Presence::whereHas('apprenant', function ($query) use ($metierId) {
                $query->where('metier_id', $metierId);
            })
            ->with(['apprenant.user', 'seance.uea'])
            ->latest()
            ->get();

            return response()->json($presences);

        } catch (\Exception $e) {
            Log::error('Erreur rapport présences par métier: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }
}
