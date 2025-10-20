<?php

namespace App\Http\Controllers\Api;

use App\Models\Apprenant;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class ApprenantController extends Controller
{
    /**
     * Lister les apprenants par métier et année
     */
    public function index(Request $request)
    {
        $user = auth()->user();

        // ✅ CORRECTION : Ajouter tous les rôles qui doivent pouvoir filtrer les apprenants
        if (!in_array($user->role, ['enseignant', 'admin', 'chef_departement', 'coordinateur'])) {
            return response()->json([
                'error' => 'Accès réservé aux enseignants et administrateurs',
                'your_role' => $user->role,
                'required_role' => 'enseignant, admin, chef_departement ou coordinateur'
            ], 403);
        }

        $metier_id = $request->query('metier_id');
        $annee = $request->query('annee');

        $query = Apprenant::query();

        if ($metier_id) {
            $query->where('metier_id', $metier_id);
        }
        if ($annee) {
            $query->where('annee', $annee);
        }

<<<<<<< HEAD
        // ✅ CORRECTION MINIMALE ET GARANTIE :
        $apprenants = $query->get()->map(function ($a) {
            return [
                'id' => $a->id,
                'prenom' => $a->prenom,
                'nom' => $a->nom,
                'annee' => $a->annee,
                'metier_id' => $a->metier_id,
            ];
        });
=======
        $apprenants = $query->get();
>>>>>>> d1afd34fa47113daf1349c5a2f554532664d685f

        return response()->json([
            'apprenants' => $apprenants
        ]);
    }
}
