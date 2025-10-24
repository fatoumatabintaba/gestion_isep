<?php

namespace App\Http\Controllers;

use App\Models\Rapport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class RapportChefDepartementController extends Controller
{
    /**
     * Envoyer un rapport au chef de département
     */
    public function envoyerRapport(Request $request)
    {
        Log::info('=== NOUVEAU CONTROLEUR - ENVOYER RAPPORT ===');
        Log::info('User:', Auth::user() ? ['id' => Auth::user()->id, 'name' => Auth::user()->name] : 'Non auth');
        Log::info('Données:', $request->all());

        try {
            $validated = $request->validate([
                'titre' => 'required|string|max:255',
                'contenu' => 'required|string',
                'metier_id' => 'required',
                'annee' => 'required|string',
                'uea_nom' => 'required|string|max:255',
            ]);

            $rapport = Rapport::create([
                'user_id' => Auth::id(),
                'metier' => $validated['titre'],
                'code_metier' => 'CD-' . time(),
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
            ]);

            Log::info('✅ Rapport créé avec succès:', ['id' => $rapport->id]);

            return response()->json([
                'success' => true,
                'message' => 'Rapport envoyé avec succès au chef de département',
                'rapport_id' => $rapport->id
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Erreur nouveau contrôleur:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer les rapports chef de département
     */
    public function getRapports()
    {
        try {
            $rapports = Rapport::with('user:id,name,email')
                ->where('code_metier', 'like', 'CD-%')
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
                        'statut' => $rapport->statut,
                        'date_soumission' => $rapport->date_soumission?->format('d/m/Y H:i'),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $rapports
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur récupération rapports: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la récupération'
            ], 500);
        }
    }
}
