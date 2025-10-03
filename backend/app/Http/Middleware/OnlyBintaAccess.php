<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class OnlyBintaAccess
{
    public function handle($request, Closure $next): Response
    {
        $user = Auth::user();

        // 🔴 Si personne n'est connecté → interdit
        if (! $user) {
            abort(403, 'Accès refusé. Veuillez vous connecter.');
        }

        // 🔐 Routes liées à la gestion des métiers
        $gestionMetiersRoutes = [
            'filament.binta.resources.responsable-metiers.index',
            'filament.binta.resources.responsable-metiers.create',
            'filament.binta.resources.responsable-metiers.edit',
            // Ajoute d'autres si besoin
        ];

        // ✅ 1. Chef de département → seul accès aux responsables de métier
        if ($user->role === 'chef_departement') {
            if (in_array($request->route()->getName(), $gestionMetiersRoutes)) {
                return $next($request); // ✅ Autorise
            }
            abort(403, 'Accès interdit. Vous n’avez accès qu’à la gestion des responsables de métier.');
        }

        // ✅ 2. Binta → accès total au panel
        if ($user->name === 'binta') {
            return $next($request);
        }

        // ❌ Tous les autres rôles (enseignant, apprenant, etc.)
        abort(403, 'Accès interdit. Vous n’êtes pas autorisé à accéder à cet espace.');
    }
}
