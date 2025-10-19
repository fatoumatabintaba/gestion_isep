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
                'presences' => fn($q) => $q->where('seance_id', $seance->id)
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

        $apprenantsAutorises = Apprenant::where('metier_id', $seance->metier_id)
            ->where('annee', $seance->annee)
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
                        'nom_complet' => $apprenant->prenom . ' ' . $apprenant->nom,
                        'statut' => $data['statut'],
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
            ->with('apprenant')
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

        // ✅ Correction ici : utiliser metier_id et annee directement sur la séance
        if ($apprenant->metier_id != $seance->metier_id || $apprenant->annee != $seance->annee) {
            return response()->json([
                'message' => 'Cet apprenant n\'est pas autorisé pour cette séance'
            ], 403);
        }

        $presence = Presence::updateOrCreate([
            'seance_id' => $request->seance_id,
            'apprenant_id' => $apprenant->id,
            'date' => $request->date,
        ], [
            'statut' => $request->statut,
            'commentaire' => $request->commentaire,
        ]);

        return response()->json([
            'message' => 'Présence enregistrée avec succès',
            'presence' => $presence->load('apprenant', 'seance')
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
     * Récupérer toutes les présences pour le coordinateur
     */
    public function indexForCoordinateur()
    {
        $presences = Presence::with('apprenant')->get();
        return response()->json($presences);
    }
}
