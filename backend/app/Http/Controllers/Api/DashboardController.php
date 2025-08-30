<?php

namespace App\Http\Controllers\Api;
use App\Models\Justificatif;
use App\Models\Presence;
use App\Models\Seance;
use App\Models\Soumission;
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
                $justificatifsEnAttente = Justificatif::where('statut', 'en_attente')->count();

                $data = [
                    'justificatifs_en_attente' => $justificatifsEn_attente
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

}
