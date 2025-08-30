<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Uea;
use App\Models\Apprenant;

class UeaController extends Controller
{
    /**
     * Générer un rapport d'absences pour une UEA
     */
    public function rapportAbsences($ueaId)
    {
        $uea = Uea::with(['metiers', 'seances.presences.apprenant', 'seances.justificatifs.apprenant'])->find($ueaId);

        if (!$uea) {
            return response()->json(['message' => 'UEA non trouvée'], 404);
        }

        $rapport = [];
          foreach ($uea->seances as $seance) {
            $apprenantsUea = Apprenant::where('metier_id', $uea->metiers->first()->id)
                ->where('annee', $uea->annee)
                ->get();

            foreach ($apprenantsUea as $apprenant) {
                $presence = $seance->presences->where('apprenant_id', $apprenant->id)->first();
                $justificatif = $seance->justificatifs->where('apprenant_id', $apprenant->id)->first();

                if (!$presence || $presence->statut === 'A') {
                    $rapport[] = [
                        'seance_id' => $seance->id,
                        'date' => $seance->date,
                        'uea' => $uea->nom,
                        'apprenant' => $apprenant->prenom . ' ' . $apprenant->nom,
                        'matricule' => $apprenant->matricule,
                        'statut_presence' => $presence ? $presence->statut : 'A',
                        'justificatif' => $justificatif ? $justificatif->statut : 'non soumis',
                        'motif' => $justificatif?->motif,
                          'remarque' => $justificatif?->remarque
                    ];
                }
            }
        }

        return response()->json($rapport);
    }

}
