<?php

namespace App\Http\Controllers\Api;

use App\Models\Justificatif;
use App\Models\Presence;
use App\Models\Seance;
use App\Models\Soumission;
use App\Models\Apprenant;
use App\Models\User;
use App\Models\Uea;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $data = [];

        switch ($user->role) {
            case 'apprenant':
                $apprenant = $user->apprenant;

                if (!$apprenant) {
                    return response()->json([
                        'message' => 'Profil apprenant non trouvé. Contactez l\'administrateur.',
                    ], 404);
                }

                $absences = Presence::whereHas('seance', function ($q) {
                    $q->where('date', '<=', now());
                })->where('apprenant_id', $apprenant->id)->where('statut', 'A')->count();

                $justifies = Justificatif::where('apprenant_id', $apprenant->id)->count();
                $enAttente = Justificatif::where('apprenant_id', $apprenant->id)->where('statut', 'en_attente')->count();
                $devoirsAFaire = Soumission::where('apprenant_id', $apprenant->id)
                    ->doesntHave('devoir')
                    ->orWhereNull('fichier_rendu')
                    ->count();

                $data = [
                    'absences' => $absences,
                    'justifies' => $justifies,
                    'en_attente' => $enAttente,
                    'devoirs_a_faire' => $devoirsAFaire
                ];
                break;

            case 'enseignant':
                $seancesAVenir = Seance::where('enseignant_id', $user->id)
                    ->where('date', '>=', now())
                    ->count();

                $devoirsACorriger = Soumission::whereHas('devoir', fn($q) => $q->where('enseignant_id', $user->id))
                    ->whereNull('note')
                    ->count();

                $data = [
                    'seances_a_venir' => $seancesAVenir,
                    'devoirs_a_corriger' => $devoirsACorriger
                ];
                break;

            case 'coordinateur':
                $enAttente = Justificatif::where('statut', 'en_attente')->count();

                $data = [
                    'justificatifs_en_attente' => $enAttente
                ];
                break;

            default:
                $data = ['message' => 'Rôle non géré'];
        }

        return response()->json([
            'role' => $user->role,
            'dashboard' => $data
        ]);
    }

    // ✅ Dashboard Apprenant
    public function apprenant($metier, $annee)
    {
        $user = auth()->user();

        if ($user->role !== 'apprenant') {
            return response()->json(['message' => 'Accès interdit'], 403);
        }

        $apprenant = $user->apprenant;
        $metierId = $this->getMetierIdFromSlug($metier);

        if (!$apprenant || $apprenant->metier_id != $metierId || $apprenant->annee != $annee) {
            return response()->json(['message' => 'Données incompatibles'], 403);
        }

        return response()->json([
            'message' => "Bienvenue sur le tableau de bord de l'apprenant",
            'user' => $user,
            'metier' => $metier,
            'annee' => $annee,
            'apprenant' => $apprenant
        ]);
    }

    // ✅ Dashboard Enseignant
    public function enseignant()
    {
        $user = auth()->user();

        if ($user->role !== 'enseignant') {
            return response()->json(['message' => 'Accès interdit'], 403);
        }

        $seancesAVenir = Seance::where('enseignant_id', $user->id)
            ->where('date', '>=', now())
            ->count();

        $devoirsACorriger = Soumission::whereHas('devoir', fn($q) => $q->where('enseignant_id', $user->id))
            ->whereNull('note')
            ->count();

        return response()->json([
            'message' => 'Tableau de bord Enseignant',
            'seances_a_venir' => $seancesAVenir,
            'devoirs_a_corriger' => $devoirsACorriger
        ]);
    }

    // ✅ Dashboard Coordinateur
    public function coordinateur()
    {
        $user = auth()->user();

        if ($user->role !== 'coordinateur') {
            return response()->json(['message' => 'Accès interdit'], 403);
        }

        $seances = Seance::with('enseignant', 'metier')->orderBy('date', 'desc')->get();
        return response()->json(['seances' => $seances]);
    }

    // ✅ Dashboard Chef de Département
    public function chef()
    {
        $user = auth()->user();

        if ($user->role !== 'chef_departement') {
            return response()->json(['message' => 'Accès interdit'], 403);
        }

        $absencesFrequentes = Presence::where('statut', 'A')
            ->whereHas('seance', fn($q) => $q->where('date', '>=', now()->subDays(30)))
            ->groupBy('apprenant_id')
            ->havingRaw('COUNT(*) > 5')
            ->count();

        return response()->json([
            'message' => 'Tableau de bord Chef de Département',
            'absences_frequentes' => $absencesFrequentes
        ]);
    }

    // ✅ Dashboard Responsable de Métier
    public function responsableMetier(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'responsable-metier') {
            return response()->json(['message' => 'Accès interdit'], 403);
        }

        $metierId = $user->metier_id;

        $apprenants = Apprenant::where('metier_id', $metierId)->count();
        $absences = Presence::whereHas('seance', fn($q) => $q->where('date', '>=', now()->subWeek()))
            ->whereHas('apprenant', fn($q) => $q->where('metier_id', $metierId))
            ->where('statut', 'A')
            ->count();

        $seances = Seance::where('metier_id', $user->metier_id)
            ->with('enseignant', 'metier')
            ->orderBy('date', 'desc')
            ->get();

        return response()->json([
            'message' => 'Tableau de bord Responsable de Métier',
            'metier_id' => $metierId,
            'apprenants_total' => $apprenants,
            'absences_recentes' => $absences,
            'seances' => $seances
        ]);
    }

    /**
     * ✅ CORRECTION FINALE : Récupérer les statistiques pour un métier
     * Compatible avec la structure Apprenant (metier en texte: DWM, RT, ASRI)
     */
    public function statsMetier(Request $request)
    {
        try {
            $metierId = $request->get('metier_id');
            $annee = $request->get('annee'); // Optionnel

            Log::info("🔍 Stats métier demandées", [
                'metier_id' => $metierId,
                'annee' => $annee
            ]);

            if (!$metierId) {
                return response()->json([
                    'success' => false,
                    'error' => 'Le paramètre metier_id est requis'
                ], 400);
            }

            // ✅ Convertir ID métier en nom métier
            $metierName = $this->getMetierName($metierId);

            // ✅ Compter les apprenants du métier (utilise le modèle Apprenant)
            $totalApprenants = Apprenant::where('metier', $metierName)
                                 ->when($annee && $annee !== 'toutes', function($query, $annee) {
                                     return $query->where('annee', $annee);
                                 })
                                 ->count();

            // ✅ Compter les UEA du métier via la table pivot
            $totalUEA = Uea::whereHas('metiers', function($query) use ($metierId) {
                $query->where('metiers.id', $metierId);
            })->count();

            // ✅ Compter les justificatifs en attente pour le métier
            $justificatifsEnAttente = Justificatif::whereHas('apprenant', function($query) use ($metierName, $annee) {
                $query->where('metier', $metierName)
                      ->when($annee && $annee !== 'toutes', function($q, $annee) {
                          return $q->where('annee', $annee);
                      });
            })->where('statut', 'en_attente')->count();

            // ✅ Compter les absences totales (via Presence avec statut 'A')
            $totalAbsences = Presence::where('statut', 'A')
                ->whereHas('apprenant', function($query) use ($metierName, $annee) {
                    $query->where('metier', $metierName)
                          ->when($annee && $annee !== 'toutes', function($q, $annee) {
                              return $q->where('annee', $annee);
                          });
                })->count();

            // Calculer le taux d'absence moyen
            $tauxAbsenceMoyen = $totalApprenants > 0 ? ($totalAbsences / $totalApprenants) : 0;

            // Compter les apprenants ayant au moins une absence
            $apprenantsAvecAbsences = Presence::where('statut', 'A')
                ->whereHas('apprenant', function($query) use ($metierName, $annee) {
                    $query->where('metier', $metierName)
                          ->when($annee && $annee !== 'toutes', function($q, $annee) {
                              return $q->where('annee', $annee);
                          });
                })
                ->distinct('apprenant_id')
                ->count('apprenant_id');

            $stats = [
                'taux_absence_moyen' => round($tauxAbsenceMoyen, 2),
                'total_absences' => $totalAbsences,
                'apprenants_concernes' => $apprenantsAvecAbsences,
                'justificatifs_en_attente' => $justificatifsEnAttente,
                'total_apprenants' => $totalApprenants,
                'total_uea' => $totalUEA,
                'justificatifs_traites' => Justificatif::whereHas('apprenant', function($query) use ($metierName) {
                    $query->where('metier', $metierName);
                })->whereIn('statut', ['valide', 'rejete'])->count()
            ];

            Log::info("✅ Stats calculées", $stats);

            return response()->json([
                'success' => true,
                'data' => $stats,
                'filters' => [
                    'metier_id' => $metierId,
                    'metier_name' => $metierName,
                    'annee' => $annee
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Erreur DashboardController@statsMetier', [
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Erreur lors du calcul des statistiques',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ CORRECTION : Récupérer les UEA par métier (via table pivot)
     */
    public function ueaParMetier($metierId)
    {
        try {
            Log::info("🔍 UEA par métier demandées", ['metier_id' => $metierId]);

            // ✅ Utiliser la relation many-to-many
            $ueas = Uea::whereHas('metiers', function($query) use ($metierId) {
                $query->where('metiers.id', $metierId);
            })->with(['enseignant', 'metiers'])->get();

            Log::info("✅ UEA trouvées", ['count' => $ueas->count()]);

            return response()->json([
                'success' => true,
                'data' => $ueas,
                'count' => $ueas->count()
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Erreur DashboardController@ueaParMetier', [
                'message' => $e->getMessage(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la récupération des UEA',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ CORRECTION : Récupérer les apprenants par métier (avec metier en texte)
     */
    public function apprenantsParMetier($metierId)
    {
        try {
            Log::info("🔍 Apprenants par métier demandés", ['metier_id' => $metierId]);

            // ✅ Convertir ID -> Nom métier
            $metierName = $this->getMetierName($metierId);

            $apprenants = Apprenant::with('user')
                ->where('metier', $metierName)
                ->orderBy('nom')
                ->orderBy('prenom')
                ->get();

            // Format pour le frontend
            $formatted = $apprenants->map(function($apprenant) {
                return [
                    'id' => $apprenant->id,
                    'name' => $apprenant->prenom . ' ' . $apprenant->nom,
                    'email' => $apprenant->user->email ?? 'N/A',
                    'metier_id' => $this->getMetierId($apprenant->metier),
                    'annee' => $apprenant->annee,
                    'matricule' => $apprenant->matricule,
                    'created_at' => $apprenant->created_at,
                ];
            });

            Log::info("✅ Apprenants trouvés", ['count' => $formatted->count()]);

            return response()->json([
                'success' => true,
                'data' => $formatted,
                'count' => $formatted->count()
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Erreur DashboardController@apprenantsParMetier', [
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
     * ✅ CORRECTION : Récupérer les justificatifs en attente par métier
     */
    public function justificatifsEnAttente(Request $request)
    {
        try {
            $metierId = $request->get('metier_id');

            Log::info("🔍 Justificatifs en attente demandés", ['metier_id' => $metierId]);

            if (!$metierId) {
                // Si pas de métier spécifié, retourner tous les justificatifs en attente
                $justificatifs = Justificatif::with(['apprenant.user', 'seance'])
                    ->where('statut', 'en_attente')
                    ->orderBy('created_at', 'desc')
                    ->get();
            } else {
                // ✅ Filtrer par métier (texte)
                $metierName = $this->getMetierName($metierId);

                $justificatifs = Justificatif::with(['apprenant.user', 'seance'])
                    ->whereHas('apprenant', function($query) use ($metierName) {
                        $query->where('metier', $metierName);
                    })
                    ->where('statut', 'en_attente')
                    ->orderBy('created_at', 'desc')
                    ->get();
            }

            // Format pour le frontend
            $formatted = $justificatifs->map(function($j) {
                return [
                    'id' => $j->id,
                    'apprenant_id' => $j->apprenant_id,
                    'apprenant_nom' => ($j->apprenant->prenom ?? '') . ' ' . ($j->apprenant->nom ?? 'N/A'),
                    'date_absence' => $j->seance->date ?? 'N/A',
                    'type' => $j->motif ? 'Justificatif' : 'Absence',
                    'motif' => $j->motif,
                    'statut' => $j->statut,
                    'fichier_url' => $j->fichier,
                    'created_at' => $j->created_at,
                ];
            });

            Log::info("✅ Justificatifs trouvés", ['count' => $formatted->count()]);

            return response()->json([
                'success' => true,
                'data' => $formatted,
                'count' => $formatted->count()
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Erreur DashboardController@justificatifsEnAttente', [
                'message' => $e->getMessage(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la récupération des justificatifs',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // 🔧 HELPERS
    // ============================================

    /**
     * Convertir slug en ID métier
     */
    private function getMetierIdFromSlug($slug)
    {
        $map = [
            'dwm' => 1,
            'rt' => 2,
            'asri' => 3,
        ];
        return $map[$slug] ?? null;
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
     * ✅ Helper : Convertir Nom métier -> ID métier
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
