<?php

namespace App\Http\Controllers\Api;
use App\Models\Seance;

use App\Models\Uea;
use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;


class SeanceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $seances = Seance::with('uea', 'enseignant')->get();
           return response()->json($seances);
    }

    /**
     * Crée une nouvelle séance
     */
    public function store(Request $request)
    {
        $request->validate([
            'uea_id' => 'required|exists:ueas,id',
            'enseignant_id' => 'required|exists:users,id',
            'date' => 'required|date',
            'heure_debut' => 'required',
            'heure_fin' => 'required',
            'duree' => 'required|in:4h,8h',
            'type' => 'required|in:presentiel,en_ligne',
            'lien_reunion' => 'nullable|url',
            'statut' => 'required|in:programmee,effectuee,annulee',

        ]);
        $lien_reunion = trim($request->lien_reunion);

        $seance = Seance::create($request->only([
            'uea_id', 'enseignant_id', 'salle', 'date',
            'heure_debut', 'heure_fin', 'duree',
            'type', 'lien_reunion', 'statut'
        ]));

            // Envoyer à tous les apprenants concernés
            $metierId = $seance->uae->metiers->first()->id;
            $apprenants = Apprenant::where('metier_id', $metierId)->get();

            foreach ($apprenants as $apprenant) {
                $apprenant->user->notify(new CoursEnLigneProgramme($seance));
            }

        return response()->json([
            'message' => 'Séance créée avec succès',
            'seance' => $seance->load('uea', 'enseignant')
        ], 201);

    }

    /**
     * Affiche une séance spécifique
     */
    public function show(string $id)
    {
        $seance = Seance::with('uea.metiers', 'enseignant', 'presences.apprenant')->find($id);

        if(!$seance){
            return response()->json(['message' => 'Séance non trouvée'], 404);
        }
        return response()->json($seance);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }


}
