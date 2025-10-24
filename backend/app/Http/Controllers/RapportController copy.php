<?php

namespace App\Http\Controllers;

use App\Models\Rapport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class RapportController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $user = Auth::user();

            // Si c'est un chef de département, voir tous les rapports
            // Si c'est un responsable métier, voir seulement ses rapports
            $query = Rapport::with('user:id,name,email');

            if ($user->isResponsableMetier()) {
                $query->where('user_id', $user->id);
            }

            $rapports = $query->where('statut', '!=', 'brouillon')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($rapport) {
                    return [
                        'id' => $rapport->id,
                        'metier' => $rapport->metier,
                        'code_metier' => $rapport->code_metier,
                        'coordinateur' => $rapport->user->name,
                        'coordinateur_email' => $rapport->user->email,
                        'user_id' => $rapport->user_id,
                        'date_soumission' => $rapport->date_soumission?->format('d/m/Y') ?? $rapport->created_at->format('d/m/Y'),
                        'periode' => $rapport->periode,
                        'statistiques' => $rapport->statistiques ?? [],
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
                'error' => 'Erreur lors de la récupération des rapports: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $user = Auth::user();

            $validated = $request->validate([
                'metier' => 'required|string|max:255',
                'code_metier' => 'required|string|max:10',
                'statistiques' => 'required|array',
                'periode' => 'required|string|max:255',
                'justificatifs_traites' => 'required|integer|min:0'
            ]);

            $rapport = Rapport::create([
                'user_id' => $user->id,
                'metier' => $validated['metier'],
                'code_metier' => $validated['code_metier'],
                'statistiques' => $validated['statistiques'],
                'periode' => $validated['periode'],
                'justificatifs_traites' => $validated['justificatifs_traites'],
                'statut' => 'en_attente',
                'date_soumission' => now()
            ]);

            // Charger les relations pour la réponse
            $rapport->load('user:id,name,email');

            return response()->json([
                'success' => true,
                'message' => 'Rapport créé avec succès',
                'data' => $rapport
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la création du rapport: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $rapport = Rapport::with('user:id,name,email')->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $rapport
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Rapport non trouvé'
            ], 404);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        try {
            $rapport = Rapport::findOrFail($id);

            $validated = $request->validate([
                'statut' => 'sometimes|string|in:en_attente,valide,rejete'
            ]);

            $rapport->update($validated);
            $rapport->load('user:id,name,email');

            return response()->json([
                'success' => true,
                'message' => 'Rapport mis à jour avec succès',
                'data' => $rapport
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la mise à jour du rapport: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $user = Auth::user();
            $rapport = Rapport::findOrFail($id);

            // Vérifier que l'utilisateur peut supprimer ce rapport
            if ($rapport->user_id !== $user->id && !$user->isChefDepartement()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Non autorisé à supprimer ce rapport'
                ], 403);
            }

            $rapport->delete();

            return response()->json([
                'success' => true,
                'message' => 'Rapport supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la suppression du rapport'
            ], 500);
        }
    }

    /**
     * Routes supplémentaires pour la gestion des rapports
     */

    // Envoyer un rapport au chef de département
    public function envoyerAuChefDepartement(Request $request)
    {
        return $this->store($request);
    }

    // Récupérer les rapports pour le chef de département
    public function getRapportsPourChefDepartement()
    {
        try {
            $rapports = Rapport::with('user:id,name,email')
                ->where('statut', '!=', 'brouillon')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($rapport) {
                    return [
                        'id' => $rapport->id,
                        'metier' => $rapport->metier,
                        'code_metier' => $rapport->code_metier,
                        'coordinateur' => $rapport->user->name,
                        'coordinateur_email' => $rapport->user->email,
                        'user_id' => $rapport->user_id,
                        'date_soumission' => $rapport->date_soumission?->format('d/m/Y') ?? $rapport->created_at->format('d/m/Y'),
                        'periode' => $rapport->periode,
                        'statistiques' => $rapport->statistiques ?? [],
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
                'error' => 'Erreur lors de la récupération des rapports: ' . $e->getMessage()
            ], 500);
        }
    }

    // Valider un rapport
    public function validerRapport($id)
    {
        try {
            $rapport = Rapport::with('user:id,name,email')->findOrFail($id);
            $rapport->update([
                'statut' => 'valide',
                'date_validation' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Rapport validé avec succès',
                'data' => $rapport
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la validation du rapport: ' . $e->getMessage()
            ], 500);
        }
    }

    // Rejeter un rapport
    public function rejeterRapport($id)
    {
        try {
            $rapport = Rapport::with('user:id,name,email')->findOrFail($id);
            $rapport->update([
                'statut' => 'rejete',
                'date_rejet' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Rapport rejeté',
                'data' => $rapport
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors du rejet du rapport: ' . $e->getMessage()
            ], 500);
        }
    }

    // Valider tous les rapports en attente
    public function validerTousRapports()
    {
        try {
            $rapportsValides = Rapport::where('statut', 'en_attente')
                ->update([
                    'statut' => 'valide',
                    'date_validation' => now()
                ]);

            return response()->json([
                'success' => true,
                'message' => $rapportsValides . ' rapports validés avec succès',
                'count' => $rapportsValides
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la validation multiple: ' . $e->getMessage()
            ], 500);
        }
    }

    // Envoyer le rapport consolidé à l'administration
    public function envoyerAAdministration(Request $request)
    {
        try {
            $validated = $request->validate([
                'rapports_inclus' => 'required|array',
                'statistiques_consolidees' => 'required|array'
            ]);

            // Marquer les rapports comme envoyés à l'administration
            $rapportsIds = collect($validated['rapports_inclus'])->pluck('id');
            Rapport::whereIn('id', $rapportsIds)
                ->update(['envoye_administration' => true, 'date_envoi_administration' => now()]);

            return response()->json([
                'success' => true,
                'message' => 'Rapport consolidé envoyé à l\'administration avec succès',
                'rapports_inclus' => count($validated['rapports_inclus']),
                'statistiques' => $validated['statistiques_consolidees']
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de l\'envoi à l\'administration: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Envoyer un rapport au chef de département (structure différente des rapports responsable métier)
     */
    public function envoyerRapportChefDepartement(Request $request)
    {
        Log::info('=== DÉBUT RAPPORT CHEF DÉPARTEMENT ===');
        Log::info('User ID:', [Auth::id()]);
        Log::info('Headers:', ['accept' => $request->header('accept'), 'content-type' => $request->header('content-type')]);
        Log::info('Données brutes reçues:', $request->all());

        try {
            // Validation temporaire simplifiée pour debug
            $validated = $request->validate([
                'titre' => 'required|string|max:255',
                'contenu' => 'required|string',
                'metier_id' => 'required', // Temporairement sans exists
                'annee' => 'required|string',
                'uea_nom' => 'required|string|max:255',
            ]);

            Log::info('✅ Données validées avec succès:', $validated);

            $user = Auth::user();

            // Vérifier si l'utilisateur existe
            if (!$user) {
                Log::error('❌ Utilisateur non authentifié');
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non authentifié'
                ], 401);
            }

            Log::info('👤 Utilisateur authentifié:', ['id' => $user->id, 'name' => $user->name]);

            // Vérifier la structure de la table rapports
            Log::info('📋 Vérification structure table rapports...');

            // Créer le rapport avec des données minimales pour test
            $rapportData = [
                'user_id' => $user->id,
                'metier' => $validated['titre'],
                'code_metier' => 'CD-' . time(), // Code unique temporaire
                'statistiques' => [
                    'contenu' => $validated['contenu'],
                    'uea_nom' => $validated['uea_nom'],
                    'annee' => $validated['annee'],
                    'metier_id' => $validated['metier_id'],
                    'type' => 'rapport_chef_departement'
                ],
                'periode' => 'Année ' . $validated['annee'],
                'justificatifs_traites' => 0,
                'statut' => 'valide',
                'date_soumission' => now(),
                'date_validation' => now(),
            ];

            Log::info('📤 Données à insérer:', $rapportData);

            $rapport = Rapport::create($rapportData);

            Log::info('✅ Rapport créé avec succès:', ['id' => $rapport->id]);

            return response()->json([
                'success' => true,
                'message' => 'Rapport envoyé avec succès au chef de département',
                'rapport' => [
                    'id' => $rapport->id,
                    'titre' => $rapport->metier,
                    'contenu' => $rapport->statistiques['contenu'] ?? '',
                    'uea_nom' => $rapport->statistiques['uea_nom'] ?? '',
                    'annee' => $rapport->statistiques['annee'] ?? '',
                    'metier_id' => $rapport->statistiques['metier_id'] ?? '',
                    'statut' => $rapport->statut,
                ]
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('❌ Erreur de validation:', $e->errors());
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);

        } catch (\Illuminate\Database\QueryException $e) {
            Log::error('❌ Erreur base de données:', [
                'message' => $e->getMessage(),
                'sql' => $e->getSql(),
                'bindings' => $e->getBindings()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur base de données: ' . $e->getMessage()
            ], 500);

        } catch (\Exception $e) {
            Log::error('❌ ERREUR CRITIQUE:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur serveur: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer les rapports chef de département
     */
    public function getRapportsChefDepartement()
    {
        try {
            $rapports = Rapport::with('user:id,name,email')
                ->where('code_metier', 'like', 'CD-%') // Filtrer les rapports chef département
                ->where('statut', 'valide')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($rapport) {
                    return [
                        'id' => $rapport->id,
                        'titre' => $rapport->metier,
                        'contenu' => $rapport->statistiques['contenu'] ?? '',
                        'uea_nom' => $rapport->statistiques['uea_nom'] ?? '',
                        'annee' => $rapport->statistiques['annee'] ?? '',
                        'metier_id' => $rapport->statistiques['metier_id'] ?? '',
                        'coordinateur' => $rapport->user->name,
                        'coordinateur_email' => $rapport->user->email,
                        'statut' => $rapport->statut,
                        'date_soumission' => $rapport->date_soumission?->format('d/m/Y H:i') ?? $rapport->created_at->format('d/m/Y H:i'),
                        'periode' => $rapport->periode,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $rapports
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur récupération rapports chef département: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la récupération des rapports: ' . $e->getMessage()
            ], 500);
        }
    }
}
