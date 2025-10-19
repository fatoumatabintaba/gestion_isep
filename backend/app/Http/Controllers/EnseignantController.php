<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class EnseignantController extends Controller
{
    public function index(Request $request)
    {
        $metier_id = $request->query('metier_id');
        $annee = $request->query('annee');

        $enseignants = User::where('role', 'enseignant')
            ->where('metier_id', $metier_id)
            ->where('annee', $annee)
            ->get();

        return response()->json($enseignants);
    }
}
