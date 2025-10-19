<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class OnlyBintaAccess
{
    public function handle($request, Closure $next): Response
    {
        \Log::info('🟡 Middleware exécuté', [
            'email' => auth()->user()?->email,
            'role' => auth()->user()?->role,
            'route' => $request->route()?->getName(),
        ]);

        $user = Auth::user();

        // 🔒 Vérification de connexion
        if (! $user) {
            abort(403, 'Accès refusé. Veuillez vous connecter.');
        }

        // ✅ Cas 1 : accès complet réservé à Binta et à l'administrateur
        if ($user->email === 'bintadjenga1@gmail.com' || $user->role === 'admin') {
            return $next($request);
        }

        // ✅ Cas 2 : accès partiel pour le chef de département
        if ($user->role === 'chef_departement') {
            $allowedRoutes = [
                // Pages générales
                'filament.binta.pages.dashboard',

                // ResponsableMetier - TOUTES les routes nécessaires
                'filament.binta.resources.responsable-metiers.index',
                'filament.binta.resources.responsable-metiers.create',
                'filament.binta.resources.responsable-metiers.store',
                'filament.binta.resources.responsable-metiers.edit',
                'filament.binta.resources.responsable-metiers.update',
                'filament.binta.resources.responsable-metiers.view',

                // UserResource - si tu veux qu'il puisse voir/gérer les utilisateurs
                'filament.binta.resources.users.index',
                'filament.binta.resources.users.create',
                'filament.binta.resources.users.store',
                'filament.binta.resources.users.edit',
                'filament.binta.resources.users.update',
                'filament.binta.resources.users.view',

                // Autres ressources si nécessaire
                'filament.binta.resources.metiers.index',
                'filament.binta.resources.metiers.view',
            ];

            $routeName = $request->route()?->getName();

            if (in_array($routeName, $allowedRoutes)) {
                return $next($request);
            }

            // 🔍 Log pour debugger les routes bloquées
            \Log::warning('Route non autorisée pour chef_departement', [
                'route' => $routeName,
                'user' => $user->email
            ]);

            abort(403, 'Accès interdit. Vous n\'avez pas les permissions nécessaires pour cette page.');
        }

        // ✅ Cas 3 : Ajoute aussi le coordinateur si nécessaire
        if ($user->role === 'coordinateur') {
            $allowedRoutes = [
                'filament.binta.pages.dashboard',
                'filament.binta.resources.users.index',
                'filament.binta.resources.users.create',
                'filament.binta.resources.users.store',
                'filament.binta.resources.users.edit',
                'filament.binta.resources.users.update',
                'filament.binta.resources.users.view',
            ];

            $routeName = $request->route()?->getName();

            if (in_array($routeName, $allowedRoutes)) {
                return $next($request);
            }

            abort(403, 'Accès interdit. Vous n\'avez pas les permissions nécessaires pour cette page.');
        }

        // 🚫 Tous les autres rôles sont bloqués
        abort(403, 'Accès interdit. Vous n\'êtes pas autorisé à accéder à cet espace.');
    }
}
