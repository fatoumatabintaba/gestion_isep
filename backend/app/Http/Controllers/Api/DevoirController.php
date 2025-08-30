<?php

namespace App\Http\Controllers\Api;
use App\Models\Devoir;
use App\Models\Soumission;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DevoirController extends Controller
{
    /**
     * Lister tous les devoirs d'une UEA
     */
    public function index($ueaId)
    {
        $devoirs = Devoir::with([
            'enseignant:id,name',
            'soumissions.apprenant:id,prenom,nom,matricule',
            'soumissions' => fn($q) => $q->where('apprenant_id', request()->user()->apprenant?->id)
        ])->where('uae_id', $ueaId)->get();

        return response()->json($devoirs);
    }

    /**
     * Créer un nouveau devoir (par l'enseignant)
     */
    public function store(Request $request)
    {
        $request->validate([
            'uae_id' => 'required|exists:ueas,id',
            'titre' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date_limite' => 'required|date',
            'fichier_consigne' => 'nullable|file|max:2048',
            'coefficient' => 'nullable|integer|min:1|max:10',
        ]);

         $data = $request->only(['uae_id', 'titre', 'description', 'date_limite', 'coefficient']);
        $data['enseignant_id'] = $request->user()->id;

        if ($request->hasFile('fichier_consigne')) {
            $data['fichier_consigne'] = $request->file('fichier_consigne')->store('devoirs/consignes');
        }

        $devoir = Devoir::create($data);

        return response()->json([
            'message' => 'Devoir créé avec succès',
            'devoir' => $devoir
        ], 201);
    }
     /**
     * Soumettre un devoir (par l'apprenant)
     */
    public function soumettre(Request $request, $devoirId)
    {
        $request->validate([
            'fichier_rendu' => 'required|file|max:2048',
            'commentaire' => 'nullable|string|max:500'
        ]);

        $devoir = Devoir::findOrFail($devoirId);
        $apprenant = $request->user()->apprenant;

        $retard = now()->gt($devoir->date_limite);

        $soumission = Soumission::updateOrCreate(
            [
                'devoir_id' => $devoirId,
                'apprenant_id' => $apprenant->id
            ],
            [
                'fichier_rendu' => $request->file('fichier_rendu')->store('devoirs/rendus'),
                'commentaire' => $request->commentaire,
                'retard' => $retard
            ]
        );

        return response()->json([
            'message' => $retard ? 'Devoir soumis en retard' : 'Devoir soumis à temps',
            'soumission' => $soumission->load('apprenant')
        ], 201);

         }

    /**
     * Corriger un devoir (par l'enseignant)
     */
    public function corriger(Request $request, $soumissionId)
    {
        $request->validate([
            'note' => 'required|integer|between:0,20',
            'feedback' => 'required|string',
            'fichier_corrige' => 'nullable|file|max:2048'
        ]);

        $soumission = Soumission::with('devoir', 'apprenant')->findOrFail($soumissionId);

        $data = $request->only(['note', 'feedback']);
        if ($request->hasFile('fichier_corrige')) {
            $data['fichier_corrige'] = $request->file('fichier_corrige')->store('devoirs/corriges');
        }

        $soumission->update($data);

        return response()->json([
            'message' => 'Devoir corrigé et noté',
            'soumission' => $soumission
        ]);
    }
}
