<?php

namespace App\Http\Controllers\Api;

use App\Models\Apprenant;
use App\Models\CoursEnLigne;
use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use App\Models\AbsenceNotification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class ApprenantController extends Controller
{
    /**
     * ✅ CORRECTION FINALE : Lister tous les apprenants
     */
    public function index(Request $request)
    {
        try {
            $user = auth()->user();

            if (!in_array($user->role, ['enseignant', 'admin', 'chef_departement', 'coordinateur', 'responsable_metier'])) {
                return response()->json([
                    'error' => 'Accès refusé',
                    'your_role' => $user->role
                ], 403);
            }

            $metier_id = $request->query('metier_id');
            $annee = $request->query('annee');
            $search = $request->query('search');

            // ✅ Utilise le modèle Apprenant avec la relation user
            $query = Apprenant::with('user');

            // Filtrer par métier (ID numérique)
            if ($metier_id) {
                $query->where('metier_id', $metier_id); // ✅ CORRIGÉ : utilise metier_id au lieu de metier
            }

            // Filtrer par année
            if ($annee) {
                $query->where('annee', $annee);
            }

            // Recherche par nom
            if ($search && trim($search) !== '') {
                $searchTerm = trim($search);
                $query->where(function($q) use ($searchTerm) {
                    $q->where('nom', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('prenom', 'LIKE', "%{$searchTerm}%")
                      ->orWhereHas('user', function($userQuery) use ($searchTerm) {
                          $userQuery->where('name', 'LIKE', "%{$searchTerm}%")
                                   ->orWhere('email', 'LIKE', "%{$searchTerm}%");
                      });
                });
            }

            $apprenants = $query->orderBy('nom')->orderBy('prenom')->get();

            // Format pour le frontend
            $formatted = $apprenants->map(function($apprenant) {
                return [
                    'id' => $apprenant->id,
                    'name' => $apprenant->prenom . ' ' . $apprenant->nom,
                    'email' => $apprenant->user->email ?? 'N/A',
                    'metier_id' => $apprenant->metier_id, // ✅ CORRIGÉ : utilise directement metier_id
                    'metier_name' => $this->getMetierName($apprenant->metier_id), // ✅ AJOUT : nom du métier
                    'annee' => $apprenant->annee,
                    'matricule' => $apprenant->matricule,
                    'created_at' => $apprenant->created_at,
                ];
            });

            Log::info("✅ Apprenants récupérés", ['count' => $formatted->count()]);

            return response()->json([
                'data' => $formatted,
                'apprenants' => $formatted,
                'total' => $formatted->count()
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Erreur index apprenants', [
                'error' => $e->getMessage(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'error' => 'Erreur serveur',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ CORRECTION FINALE : Récupérer les apprenants par métier
     */
    public function parMetier($metierId)
    {
        try {
            Log::info("🔍 Apprenants par métier demandé", ['metier_id' => $metierId]);

            // ✅ CORRIGÉ : Utilise directement metier_id au lieu de convertir en nom
            $apprenants = Apprenant::with('user')
                            ->where('metier_id', $metierId) // ✅ CORRIGÉ : utilise metier_id
                            ->orderBy('nom')
                            ->orderBy('prenom')
                            ->get();

            // Format pour le frontend
            $formatted = $apprenants->map(function($apprenant) {
                return [
                    'id' => $apprenant->id,
                    'name' => $apprenant->prenom . ' ' . $apprenant->nom,
                    'email' => $apprenant->user->email ?? 'N/A',
                    'metier_id' => $apprenant->metier_id, // ✅ CORRIGÉ : utilise directement metier_id
                    'metier_name' => $this->getMetierName($apprenant->metier_id), // ✅ AJOUT : nom du métier
                    'annee' => $apprenant->annee,
                    'matricule' => $apprenant->matricule,
                    'created_at' => $apprenant->created_at,
                ];
            });

            Log::info("✅ Apprenants trouvés", ['count' => $formatted->count()]);

            return response()->json([
                'success' => true,
                'data' => $formatted,
                'count' => $formatted->count(),
                'metier_id' => $metierId,
                'metier_name' => $this->getMetierName($metierId)
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Erreur parMetier', [
                'metier_id' => $metierId,
                'message' => $e->getMessage(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la récupération des apprenants',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer les absences de l'apprenant
     */
    public function mesAbsences(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user->apprenant) {
                return response()->json(['message' => 'Utilisateur non trouvé'], 404);
            }

            $absences = AbsenceNotification::with(['seance', 'seance.enseignant'])
                ->where('apprenant_id', $user->apprenant->id)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function($absence) {
                    return [
                        'id' => $absence->id,
                        'seance_nom' => $absence->seance->nom,
                        'uea_nom' => $absence->seance->uea_nom,
                        'date' => $absence->seance->date,
                        'enseignant' => $absence->seance->enseignant->name,
                        'statut' => $absence->statut,
                        'notified_at' => $absence->notified_at,
                        'justified_at' => $absence->justified_at,
                        'motif_justificatif' => $absence->motif_justificatif,
                    ];
                });

            return response()->json($absences);

        } catch (\Exception $e) {
            Log::error('❌ Erreur mesAbsences', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Déposer un justificatif
     */
    public function deposerJustificatif(Request $request, AbsenceNotification $absence)
    {
        $request->validate([
            'motif' => 'required|string|max:500',
            'justificatif' => 'required|file|mimes:pdf,jpg,jpeg,png|max:2048'
        ]);

        if ($absence->apprenant_id !== $request->user()->apprenant->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        try {
            $filePath = $request->file('justificatif')->store('justificatifs', 'public');

            $absence->update([
                'statut' => 'justifie',
                'justificatif_url' => $filePath,
                'motif_justificatif' => $request->motif,
                'justified_at' => now(),
            ]);

            return response()->json([
                'message' => 'Justificatif déposé avec succès',
                'absence' => $absence->fresh()
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Erreur deposerJustificatif', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors du dépôt du justificatif',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer les cours en ligne de l'apprenant connecté
     */
    public function mesCoursEnLigne(Request $request)
    {
        try {
            $user = Auth::user();

            if ($user->role !== 'apprenant') {
                return response()->json(['message' => 'Accès refusé'], 403);
            }

            $apprenant = $user->apprenant;
            if (!$apprenant) {
                return response()->json(['message' => 'Profil apprenant non trouvé'], 404);
            }

            // ✅ CORRIGÉ : Utilise le nom du métier via la méthode helper
            $nomMetier = $this->getMetierName($apprenant->metier_id);

            $cours = CoursEnLigne::where('metier', $nomMetier)
                ->where('annee', $apprenant->annee)
                ->with(['uea', 'enseignant'])
                ->orderBy('date', 'desc')
                ->orderBy('heure_debut', 'asc')
                ->get()
                ->map(function ($cours) {
                    return [
                        'id' => $cours->id,
                        'nom' => $cours->nom,
                        'description' => $cours->description,
                        'date' => $cours->date,
                        'heure_debut' => $cours->heure_debut,
                        'heure_fin' => $cours->heure_fin,
                        'lien_reunion' => $cours->lien_reunion,
                        'plateforme' => $cours->plateforme,
                        'uea_nom' => $cours->uea ? $cours->uea->nom : 'Non assigné',
                        'enseignant' => $cours->enseignant ? [
                            'name' => $cours->enseignant->name
                        ] : null
                    ];
                });

            return response()->json($cours);

        } catch (\Exception $e) {
            Log::error('❌ Erreur mesCoursEnLigne', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * ✅ Helper : Convertir ID métier -> Nom métier
     */
    private function getMetierName($metierId)
    {
        $metiers = [
            1 => 'DWM',
            2 => 'RT',
            3 => 'ASRI'
        ];
        return $metiers[$metierId] ?? 'Inconnu';
    }

    /**
     * ✅ Helper : Convertir Nom métier -> ID métier (gardé pour compatibilité)
     */
    private function getMetierId($metierName)
    {
        $metiers = [
            'DWM' => 1,
            'RT' => 2,
            'ASRI' => 3
        ];
        return $metiers[$metierName] ?? null;
    }
}
