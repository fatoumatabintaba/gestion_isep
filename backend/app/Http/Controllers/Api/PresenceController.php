<?php

namespace App\Http\Controllers\Api;

use App\Models\Apprenant;
use App\Models\Presence;
use App\Models\Seance;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class PresenceController extends Controller
{
    /**
     * Pointage par matricule (optionnel)
     */
    public function store(Request $request)
    {
        $request->validate([
            'seance_id' => 'required|exists:seances,id',
            'matricule' => 'required|exists:apprenants,matricule',
            'statut' => 'required|in:P,A,½'
        ]);

        $apprenant = Apprenant::where('matricule', $request->matricule)->first();

        $presence = Presence::updateOrCreate([
            'seance_id' => $request->seance_id,
            'apprenant_id' => $apprenant->id
        ], [
            'statut' => $request->statut
        ]);

        return response()->json([
            'message' => 'Présence enregistrée avec succès',
            'presence' => $presence->load('apprenant', 'seance')
        ], 201);
    }

    /**
     * Lister les présences d'une séance
     */
    public function index($seance_id)
    {
        $presences = Presence::where('seance_id', $seance_id)
            ->with('apprenant')
            ->get();

        return response()->json($presences);
    }

    /**
     * Lister les apprenants concernés par une séance
     */
    public function getApprenantsForSeance(Seance $seance)
    {
        $apprenants = Apprenant::where('metier_id', $seance->uae->metier_id)
            ->where('annee', $seance->uae->annee)
            ->with(['user', 'presences' => fn($q) => $q->where('seance_id', $seance->id)])
            ->get();

        return response()->json($apprenants);
    }

    /**
     * Enregistrer plusieurs présences en une fois (cases à cocher)
     */
    public function storeMultiple(Request $request, Seance $seance)
    {
        $request->validate([
            'presences' => 'required|array',
            'presences.*.apprenant_id' => 'required|exists:apprenants,id',
            'presences.*.statut' => 'required|in:P,A,½'
        ]);

        foreach ($request->presences as $presenceData) {
            Presence::updateOrCreate(
                [
                    'seance_id' => $seance->id,
                    'apprenant_id' => $presenceData['apprenant_id']
                ],
                [
                    'statut' => $presenceData['statut']
                ]
            );
        }

        return response()->json(['message' => 'Présences enregistrées']);
    }
}
