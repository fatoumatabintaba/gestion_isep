<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class MetierController extends Controller
{
    // App\Http\Controllers\Api\MetierController.php
public function apprenants(Request $request, $metierId)
{
    $query = Apprenant::with('user')->where('metier_id', $metierId);

    if ($request->has('annee')) {
        $query->where('annee', $request->annee);
    }

    return response()->json($query->get());
}
}
