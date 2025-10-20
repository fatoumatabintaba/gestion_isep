<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

class EnsureRole
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();

        Log::info('🔍 Middleware EnsureRole - Début', [
            'user_id' => $user?->id,
            'user_role' => $user?->role,
            'user_email' => $user?->email,
            'roles_requis' => $roles,
            'route' => $request->path(),
            'url_complete' => $request->fullUrl()
        ]);

        // Vérifier l'authentification
        if (!$user) {
            Log::warning('❌ Middleware EnsureRole - Non authentifié');
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // ✅ CORRECTION : Admin a accès à TOUTES les routes
        if ($user->role === 'admin') {
            Log::info('✅ Middleware EnsureRole - Admin autorisé (accès complet)', [
                'user_id' => $user->id,
                'role' => $user->role,
                'route' => $request->path()
            ]);
            return $next($request);
        }

        // Vérifier les rôles pour les autres utilisateurs
        if (!in_array($user->role, $roles)) {
            Log::warning('❌ Middleware EnsureRole - Rôle refusé', [
                'role_actuel' => $user->role,
                'roles_requis' => $roles,
                'user_id' => $user->id,
                'user_email' => $user->email
            ]);

            return response()->json([
                'message' => 'Forbidden - Rôle incorrect',
                'current_role' => $user->role,
                'required_roles' => $roles,
                'user_id' => $user->id
            ], 403);
        }

        Log::info('✅ Middleware EnsureRole - Accès autorisé', [
            'user_id' => $user->id,
            'role' => $user->role
        ]);

        return $next($request);
    }
}
