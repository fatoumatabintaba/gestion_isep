<?php

namespace App\Http\Controllers\Api;

use App\Models\Justificatif;
use App\Models\Presence;
use App\Models\Seance;
use App\Models\Soumission;
use App\Models\Apprenant;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

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

        // Tu peux ici récupérer des données spécifiques
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

        // Toutes les séances récentes (ou filtrées selon besoin)
        $seances = \App\Models\Seance::with('enseignant', 'metier')->orderBy('date', 'desc')->get();
        return response()->json(['seances' => $seances]);
    }

    // ✅ Dashboard Chef de Département
    public function chef()
    {
        $user = auth()->user();

        if ($user->role !== 'chef_departement') {
            return response()->json(['message' => 'Accès interdit'], 403);
        }

        // Exemple : nombre total d’absences critiques
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

        // Filtrer par le métier du responsable
        $seances = \App\Models\Seance::where('metier_id', $user->metier_id)
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

    // 🔧 Helper: Convertir slug en ID métier
    private function getMetierIdFromSlug($slug)
    {
        $map = [
            'dwm' => 1,
            'rt' => 2,
            'asri' => 3,
        ];

        return $map[$slug] ?? null;
    }
}
