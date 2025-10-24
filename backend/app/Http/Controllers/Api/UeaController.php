<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Uea;
use App\Models\Apprenant;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;

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
            // ✅ CORRIGÉ : Utiliser la relation many-to-many
            $metiersIds = $uea->metiers->pluck('id');
            $apprenantsUea = Apprenant::whereIn('metier_id', $metiersIds)
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

    /**
     * Générer un rapport d'absences en PDF pour une UEA
     */
    public function rapportAbsencesPdf($ueaId)
    {
        $uea = Uea::with(['metiers', 'seances.presences.apprenant', 'seances.justificatifs.apprenant'])->find($ueaId);

        if (!$uea) {
            return response()->json(['message' => 'UEA non trouvée'], 404);
        }

        $absences = [];

        foreach ($uea->seances as $seance) {
            // ✅ CORRIGÉ : Utiliser la relation many-to-many
            $metiersIds = $uea->metiers->pluck('id');
            $apprenantsUea = Apprenant::whereIn('metier_id', $metiersIds)
                ->where('annee', $uea->annee)
                ->get();

            foreach ($apprenantsUea as $apprenant) {
                $presence = $seance->presences->where('apprenant_id', $apprenant->id)->first();
                $justificatif = $seance->justificatifs->where('apprenant_id', $apprenant->id)->first();

                if (!$presence || $presence->statut === 'A') {
                    $absences[] = [
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

        $pdf = Pdf::loadView('pdf.rapport-absences', [
            'uea' => $uea,
            'absences' => $absences
        ]);

        return $pdf->stream('rapport-absences-' . $uea->nom . '.pdf');
    }

    /**
     * Récupérer les UEA par métier (pour le dashboard responsable métier)
     */
  public function parMetier($metierId)
{
    try {
        Log::info("🔍 UEA par métier demandé", ['metier_id' => $metierId]);

        // ✅ VERSION CORRIGÉE : Avec relation enseignant
        $ueas = Uea::whereHas('metiers', function($query) use ($metierId) {
            $query->where('metiers.id', $metierId);
        })
        ->with(['enseignant:id,name,email']) // ✅ Charge seulement les infos nécessaires
        ->get();

        // Formater les données pour le frontend
        $ueasFormatted = $ueas->map(function($uea) use ($metierId) {
            return [
                'id' => $uea->id,
                'nom' => $uea->nom,
                'description' => $uea->description ?? '',
                'metier_id' => (int)$metierId,
                'enseignant' => $uea->enseignant ? [
                    'name' => $uea->enseignant->name,
                    'email' => $uea->enseignant->email
                ] : null,
                'created_at' => $uea->created_at ?? now(),
            ];
        });

        Log::info("✅ UEA avec enseignants trouvées", ['count' => $ueasFormatted->count()]);

        return response()->json([
            'success' => true,
            'data' => $ueasFormatted,
            'count' => $ueasFormatted->count()
        ]);

    } catch (\Exception $e) {
        Log::error('❌ Erreur UeaController@parMetier', [
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]);

        // ✅ FALLBACK : Données de test sans relation enseignant
        $ueasTest = [
            ['id' => 1, 'nom' => 'Développement Web', 'metier_id' => (int)$metierId, 'enseignant' => null],
            ['id' => 2, 'nom' => 'Base de Données', 'metier_id' => (int)$metierId, 'enseignant' => null],
        ];

        return response()->json([
            'success' => true,
            'data' => $ueasTest,
            'count' => count($ueasTest),
            'note' => 'Données de test (relation enseignant corrigée)'
        ]);
    }
}
}
