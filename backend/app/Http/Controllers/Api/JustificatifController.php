<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;



class JustificatifController extends Controller
{
    //

    public function store(Request $request){
        $request->validate([
            'seance_id' => 'required|exists:seances,id',
            'motif' => 'required|string|max:500',
            'fichier' => 'nullable|file|max:2048' // max 2MB
        ]);
        $data = $request->only(['seance_id', 'motif']);

         // Associer l'apprenant connecté
        $data['apprenant_id'] = $request->user()->apprenant->id;

        // Gérer le fichier
        if ($request->hasFile('fichier')) {
            $data['fichier'] = $request->file('fichier')->store('justificatifs');
        }

        $justificatif = Justificatif::create($data);
        // Récupère tous les coordinateurs
        $coordinateurs = App\Models\User::where('role', 'coordinateur')->get();

        // Envoie à chaque coordinateur
        foreach ($coordinateurs as $coordinateur) {
            $coordinateur->notify(new JustificatifSoumis($justificatif));
        }

        return response()->json([
            'message' => 'Justificatif soumis avec succès',
            'justificatif' => $justificatif->load('apprenant', 'seance.uea')
        ], 201);
    }

     /**
     * Lister les justificatifs d'une séance
     */
    public function index($seanceId)
    {
        $justificatifs = Justificatif::where('seance_id', $seanceId)
            ->with('apprenant')
            ->get();

        return response()->json($justificatifs);
    }

    /**
 * Valider ou rejeter un justificatif
 */
public function updateStatut(Request $request, $id)
{
    $request->validate([
        'statut' => 'required|in:valide,rejete',
        'remarque' => 'nullable|string|max:500'
    ]);
    Notification::send($justificatif->apprenant->user, new JustificatifValide($justificatif));

    $justificatif = Justificatif::findOrFail($id);

    $justificatif->update([
        'statut' => 'valide',
        'valideur_id' => auth()->id(),
        'remarque' => $request->remarque,
        // 'statut' => $request->statut,
        // 'remarque' => $request->remarque,
        // 'valideur_id' => $request->user()->id
    ]);

    // Notifie l'apprenant
$justificatif->apprenant->user->notify(new JustificatifValide($justificatif));

return response()->json(['message' => 'Justificatif validé et notifié', 'justificatif' => $justificatif]);
    // return response()->json([
    //     'message' => 'Statut mis à jour',
    //     'justificatif' => $justificatif->load('apprenant', 'valideur')
    // ]);
}
    }

