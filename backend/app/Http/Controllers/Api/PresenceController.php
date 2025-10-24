<?php

namespace App\Http\Controllers\Api;

use App\Models\Apprenant;
use App\Models\Presence;
use App\Models\Seance;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

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

        // Vérifier si la séance a un metier_id et annee
        if (!$seance->metier_id || !$seance->annee) {
            return response()->json([
                'message' => 'Cette séance n\'est pas configurée correctement (métier ou année manquants)',
                'seance' => $seance
            ], 400);
        }

        $apprenants = Apprenant::where('metier_id', $seance->metier_id)
            ->where('annee', $seance->annee)
            ->with([
                'user',
                'presences' => fn($q) => $q->where('seance_id', $seance->id),
                'metier'
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
                    'metier_nom' => $app->metier?->nom,
                    'statut' => $presence?->statut ?? null,
                    'commentaire' => $presence?->commentaire ?? null
                ];
            })
        ]);
    }

    // Enregistrer plusieurs présences en une fois (COMPLÈTEMENT CORRIGÉ)
    public function storeMultiple(Request $request, Seance $seance)
    {
        $user = Auth::user();
        $allowedRoles = ['enseignant', 'admin', 'chef_departement', 'coordinateur', 'responsable_metier'];

        if (!in_array($user->role, $allowedRoles)) {
            return response()->json(['message' => 'Accès refusé - Rôle non autorisé'], 403);
        }

        // Vérifier que la séance a les champs requis
        if (!$seance->metier_id || !$seance->annee) {
            return response()->json([
                'message' => 'Impossible d\'enregistrer les présences : la séance n\'a pas de métier ou d\'année définis',
                'seance_id' => $seance->id,
                'seance_nom' => $seance->nom,
                'metier_id' => $seance->metier_id,
                'annee' => $seance->annee
            ], 400);
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
            ->with('metier')
            ->get();

        $apprenantIdsAutorises = $apprenantsAutorises->pluck('id')->toArray();

        Log::info('DEBUG DÉTAILLÉ', [
            'seance_id' => $seance->id,
            'seance_nom' => $seance->nom,
            'seance_metier_id' => $seance->metier_id,
            'seance_annee' => $seance->annee,
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
                    // ✅ SOLUTION TEMPORAIRE AVEC DB::TABLE POUR CONTOURNER LE PROBLÈME FILLABLE
                    $now = now();

                    DB::table('presences')->updateOrInsert(
                        [
                            'seance_id' => $seance->id,
                            'apprenant_id' => $apprenantId,
                            'date' => $request->date,
                        ],
                        [
                            'metier_id' => $seance->metier_id,
                            'annee' => $seance->annee,
                            'statut' => $data['statut'],
                            'commentaire' => $data['commentaire'] ?? null,
                            'updated_at' => $now,
                            'created_at' => $now,
                        ]
                    );

                    // Récupérer la présence créée/mise à jour
                    $presence = Presence::where('seance_id', $seance->id)
                        ->where('apprenant_id', $apprenantId)
                        ->where('date', $request->date)
                        ->first();

                    $apprenant = $apprenantsAutorises->firstWhere('id', $apprenantId);
                    $results['traitees'][] = [
                        'apprenant_id' => $apprenantId,
                        'nom' => $apprenant->nom,
                        'prenom' => $apprenant->prenom,
                        'nom_complet' => $apprenant->prenom . ' ' . $apprenant->nom,
                        'metier_id' => $apprenant->metier_id,
                        'metier_nom' => $apprenant->metier?->nom,
                        'annee' => $apprenant->annee,
                        'uea_nom' => $seance->uea_nom,
                        'statut' => $data['statut'],
                        'date' => $request->date,
                        'message' => 'Présence enregistrée avec succès'
                    ];

                    Log::info("✅ Présence enregistrée - Apprenant ID: $apprenantId, Séance ID: $seance->id");

                } catch (\Exception $e) {
                    $results['ignorees'][] = [
                        'apprenant_id' => $apprenantId,
                        'raison' => 'Erreur technique: ' . $e->getMessage()
                    ];
                    Log::error("❌ Erreur enregistrement présence - Apprenant ID: $apprenantId - " . $e->getMessage());
                }
            } else {
                $results['ignorees'][] = [
                    'apprenant_id' => $apprenantId,
                    'raison' => 'Apprenant non éligible pour cette séance (ID inexistant ou mauvais métier/année)'
                ];
                Log::warning("⚠️ Apprenant ID $apprenantId ignoré - non éligible pour la séance $seance->id");
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
            ->with(['apprenant.metier'])
            ->get();

        return response()->json($presences);
    }

    /**
     * [Optionnel] Pointage rapide par matricule (ex: scan badge) - COMPLÈTEMENT CORRIGÉ
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

        // Vérifier que la séance a les champs requis
        if (!$seance->metier_id || !$seance->annee) {
            return response()->json([
                'message' => 'Impossible d\'enregistrer la présence : la séance n\'a pas de métier ou d\'année définis'
            ], 400);
        }

        if ($apprenant->metier_id != $seance->metier_id || $apprenant->annee != $seance->annee) {
            return response()->json([
                'message' => 'Cet apprenant n\'est pas autorisé pour cette séance'
            ], 403);
        }

        // ✅ SOLUTION TEMPORAIRE AVEC DB::TABLE
        $now = now();

        DB::table('presences')->updateOrInsert(
            [
                'seance_id' => $seance->id,
                'apprenant_id' => $apprenant->id,
                'date' => $request->date,
            ],
            [
                'metier_id' => $seance->metier_id,
                'annee' => $seance->annee,
                'statut' => $request->statut,
                'commentaire' => $request->commentaire,
                'updated_at' => $now,
                'created_at' => $now,
            ]
        );

        // Récupérer la présence créée/mise à jour
        $presence = Presence::where('seance_id', $seance->id)
            ->where('apprenant_id', $apprenant->id)
            ->where('date', $request->date)
            ->first();

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
                ->take(10);

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
     * Récupérer toutes les présences pour le coordinateur (VERSION SIMPLIFIÉE)
     */
    public function indexForCoordinateur()
    {
        try {
            $user = Auth::user();

            Log::info('📊 Récupération des présences pour coordinateur', [
                'user_id' => $user->id,
                'user_role' => $user->role
            ]);

            // ✅ Charger uniquement les relations nécessaires
            $presences = Presence::with([
                'apprenant.metier',     // Métier de l'apprenant
                'seance.uea',           // UEA de la séance
                'seance.metier',        // Métier de la séance
                'seance.enseignant'     // Enseignant de la séance
            ])
            ->latest()
            ->get();

            Log::info('✅ Présences récupérées', ['count' => $presences->count()]);

            // Formater les données pour le frontend
            $formattedPresences = $presences->map(function ($presence) {
                $apprenant = $presence->apprenant;
                $seance = $presence->seance;

                return [
                    'id' => $presence->id,
                    'statut' => $presence->statut,
                    'statut_label' => $this->getStatutLabel($presence->statut),
                    'date' => $presence->created_at->format('d/m/Y H:i'),
                    'commentaire' => $presence->commentaire,

                    // ✅ Informations essentielles de l'apprenant
                    'apprenant' => $apprenant ? [
                        'id' => $apprenant->id,
                        'prenom' => $apprenant->prenom,
                        'nom' => $apprenant->nom,
                        'nom_complet' => $apprenant->prenom . ' ' . $apprenant->nom,
                        'metier' => $apprenant->metier->nom ?? 'Non spécifié',
                        'annee' => $apprenant->annee ? $apprenant->annee . 'ère année' : 'Non spécifié'
                    ] : null,

                    // ✅ Informations essentielles de la séance
                    'seance' => $seance ? [
                        'id' => $seance->id,
                        'nom' => $seance->nom,
                        'uea_nom' => $seance->uea->nom ?? $seance->uea_nom ?? 'Non spécifié',
                        'metier' => $seance->metier->nom ?? 'Non spécifié',
                        'date' => $seance->date,
                        'heure_debut' => $seance->heure_debut,
                        'heure_fin' => $seance->heure_fin,
                        'salle' => $seance->salle,
                        'enseignant' => $seance->enseignant ? [
                            'nom_complet' => ($seance->enseignant->prenom ?? '') . ' ' . $seance->enseignant->name
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
     * Helper pour obtenir le label français du statut
     */
    private function getStatutLabel($statut)
    {
        $labels = [
            'present' => 'Présent',
            'absent' => 'Absent',
            'retard' => 'Retard',
            'demi' => 'Demi-journée'
        ];

        return $labels[$statut] ?? $statut;
    }

    /**
     * Récupérer les statistiques des présences pour le dashboard
     */
    public function statsDashboard()
    {
        try {
            $totalPresences = Presence::count();
            $presentCount = Presence::where('statut', 'present')->count();
            $absentCount = Presence::where('statut', 'absent')->count();
            $retardCount = Presence::where('statut', 'retard')->count();
            $demiCount = Presence::where('statut', 'demi')->count();

            return response()->json([
                'stats_generales' => [
                    'total_presences' => $totalPresences,
                    'presents' => $presentCount,
                    'absents' => $absentCount,
                    'retards' => $retardCount,
                    'demi_journees' => $demiCount,
                    'taux_presence' => $totalPresences > 0 ? round(($presentCount / $totalPresences) * 100, 2) : 0
                ],
                'par_metier' => Presence::with('apprenant.metier')
                    ->get()
                    ->groupBy('apprenant.metier.nom')
                    ->map(function ($presences, $metier) {
                        return [
                            'metier' => $metier,
                            'total' => $presences->count(),
                            'presents' => $presences->where('statut', 'present')->count(),
                            'absents' => $presences->where('statut', 'absent')->count()
                        ];
                    })
                    ->values()
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur stats dashboard: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur'], 500);
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

     public function statutAbsencesPourEnseignant(Request $request, $seanceId)
    {
        try {
            $user = $request->user();
            $seance = Seance::findOrFail($seanceId);

            // Vérifier que l'enseignant est bien celui de la séance
            if ($seance->enseignant_id !== $user->id && $user->role !== 'admin') {
                return response()->json(['message' => 'Non autorisé'], 403);
            }

            // Récupérer seulement le statut des absences (pas les justificatifs)
            $absences = AbsenceNotification::with(['apprenant.user', 'seance'])
                ->where('seance_id', $seanceId)
                ->get()
                ->map(function($absence) {
                    return [
                        'id' => $absence->id,
                        'apprenant_nom' => $absence->apprenant->user->name,
                        'apprenant_prenom' => $absence->apprenant->user->prenom ?? '',
                        'apprenant_email' => $absence->apprenant->user->email,
                        'statut' => $absence->statut,
                        'notified_at' => $absence->notified_at,
                        'justified_at' => $absence->justified_at,
                        // ❌ NE PAS INCLURE les informations sensibles des justificatifs
                        // 'justificatif_url' => NON INCLUS
                        // 'motif_justificatif' => NON INCLUS
                    ];
                });

            return response()->json([
                'seance' => [
                    'id' => $seance->id,
                    'nom' => $seance->nom,
                    'date' => $seance->date,
                ],
                'absences' => $absences,
                'statistiques' => [
                    'total_absences' => $absences->count(),
                    'absences_justifiees' => $absences->where('statut', 'justifie')->count(),
                    'absences_non_justifiees' => $absences->where('statut', 'non_justifie')->count(),
                    'absences_en_attente' => $absences->where('statut', 'en_attente')->count(),
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Erreur récupération statut absences enseignant: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la récupération des statuts'], 500);
        }
    }
}
