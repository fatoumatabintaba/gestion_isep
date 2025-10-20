<?php

namespace App\Http\Controllers\Api;

use App\Models\Seance;
use App\Models\Uea;
use App\Models\User;
use App\Models\Apprenant; // ✅ AJOUTER CET IMPORT
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

    public function indexForCoordinateur()
    {
        $seances = \App\Models\Seance::with('enseignant', 'metier')->orderBy('date', 'desc')->get();
        return response()->json($seances);
    }

    public function indexForResponsableMetier(Request $request)
    {
        $user = $request->user();

        // On suppose que le user a un champ metier_id
        $seances = \App\Models\Seance::where('metier_id', $user->metier_id)
            ->with('enseignant', 'metier')
            ->orderBy('date', 'desc')
            ->get();

        return response()->json($seances);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nom' => 'required|string|max:255',
            'uea_nom' => 'required|string|max:255',
            'enseignant_id' => 'required|exists:users,id',
            'salle' => 'nullable|string|max:20',
            'date' => 'required|date',
            'heure_debut' => 'required',
            'heure_fin' => 'required',
            'duree' => 'required|in:4h,8h',
            'type' => 'required|in:presentiel,en_ligne',
            'statut' => 'required|in:programmee,effectuee,annulee',
            'metier_id' => 'nullable|exists:metiers,id',
            'annee' => 'nullable|string'
        ]);

        try {
            $seance = Seance::create([
                'nom' => $request->nom,
                'uea_nom' => $request->uea_nom,         // ✅ AJOUT
                'metier_id' => $request->metier_id,     // ✅ AJOUT
                'annee' => $request->annee,             // ✅ AJOUT
                'uea_id' => $request->uea_id,
                'enseignant_id' => $request->enseignant_id,
                'salle' => $request->salle ?? 'A101',
                'date' => $request->date,
                'heure_debut' => $request->heure_debut,
                'heure_fin' => $request->heure_fin,
                'duree' => $request->duree,
                'type' => $request->type,
                'lien_reunion' => $request->lien_reunion ? trim($request->lien_reunion) : null,
                'statut' => $request->statut,
            ]);

            return response()->json([
                'message' => 'Séance créée avec succès',
                'seance' => $seance->load('uea', 'enseignant')
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la création de la séance',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crée une nouvelle séance
     */
    // public function store(Request $request)
    // {
    //     $request->validate([
    //     'nom' => 'required|string|max:255',
    //     'uea_nom' => 'required|string|max:255', // ✅ Accepter uea_nom en texte
    //     'enseignant_id' => 'required|exists:users,id',
    //     'salle' => 'nullable|string|max:20',
    //     'date' => 'required|date',
    //     'heure_debut' => 'required',
    //     'heure_fin' => 'required',
    //     'duree' => 'required|in:4h,8h',
    //     'type' => 'required|in:presentiel,en_ligne',
    //     'statut' => 'required|in:programmee,effectuee,annulee',
    //     'metier_id' => 'nullable|exists:metiers,id', // ✅ Optionnel
    //     'annee' => 'nullable|string' // ✅ Optionnel
    //         // 'nom' => 'required|string|max:255', // ✅ AJOUTER 'nom' qui est requis
    //         // 'uea_id' => 'required|exists:ueas,id',
    //         // 'enseignant_id' => 'required|exists:users,id',
    //         // 'salle' => 'nullable|string|max:20', // ✅ AJOUTER 'salle'
    //         // 'date' => 'required|date',
    //         // 'heure_debut' => 'required',
    //         // 'heure_fin' => 'required',
    //         // 'duree' => 'required|in:4h,8h',
    //         // 'type' => 'required|in:presentiel,en_ligne',
    //         // 'lien_reunion' => 'nullable|url',
    //         // 'statut' => 'required|in:programmee,effectuee,annulee',
    //     ]);

    //     try {
    //         $seance = Seance::create([
    //             'nom' => $request->nom, // ✅ AJOUTER 'nom'
    //             'uea_id' => $request->uea_id,
    //             'enseignant_id' => $request->enseignant_id,
    //             'salle' => $request->salle ?? 'A101', // ✅ AJOUTER 'salle' avec valeur par défaut
    //             'date' => $request->date,
    //             'heure_debut' => $request->heure_debut,
    //             'heure_fin' => $request->heure_fin,
    //             'duree' => $request->duree,
    //             'type' => $request->type,
    //             'lien_reunion' => $request->lien_reunion ? trim($request->lien_reunion) : null,
    //             'statut' => $request->statut,
    //         ]);

    //         // ✅ CORRECTION: Utiliser 'uea' au lieu de 'uae' (relation correcte)
    //         // $metierId = $seance->uea->metiers->first()->id;
    //         // $apprenants = Apprenant::where('metier_id', $metierId)->get();

    //         // foreach ($apprenants as $apprenant) {
    //         //     $apprenant->user->notify(new CoursEnLigneProgramme($seance));
    //         // }

    //         return response()->json([
    //             'message' => 'Séance créée avec succès',
    //             'seance' => $seance->load('uea', 'enseignant')
    //         ], 201);

    //     } catch (\Exception $e) {
    //         return response()->json([
    //             'message' => 'Erreur lors de la création de la séance',
    //             'error' => $e->getMessage()
    //         ], 500);
    //     }
    // }

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
