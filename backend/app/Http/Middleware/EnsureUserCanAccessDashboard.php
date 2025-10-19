<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EnsureUserCanAccessDashboard
{
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['error' => 'Non authentifié'], 401);
        }

        // URL demandée
        $path = $request->path();

        // Vérifie si l'utilisateur a le droit d'accéder à cette route
        if ($path === 'dashboard/coordinateur' && $user->role !== 'coordinateur') {
            return response()->json(['error' => 'Accès interdit'], 403);
        }

        if ($path === 'dashboard/chef' && $user->role !== 'chef_departement') {
            return response()->json(['error' => 'Accès interdit'], 403);
        }

        if (str_starts_with($path, 'dashboard/apprenant') && $user->role !== 'apprenant') {
            return response()->json(['error' => 'Accès interdit'], 403);
        }

        if ($path === 'dashboard/enseignant' && $user->role !== 'enseignant') {
            return response()->json(['error' => 'Accès interdit'], 403);
        }

        return $next($request);
    }
}
