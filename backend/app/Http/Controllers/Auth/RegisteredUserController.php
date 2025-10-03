<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Apprenant;
use App\Notifications\WelcomeEmail;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class RegisteredUserController extends Controller
{
    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (Auth::attempt(['email' => $request->email, 'password' => $request->password])) {
            $user = Auth::user();
            $token = $user->createToken('api-token')->plainTextToken;

            // Chercher l'apprenant lié (avec metier)
            $apprenant = Apprenant::where('user_id', $user->id)->with('metier')->first();

            // 🔽 Tableau de redirection par rôle
            $redirects = [
                'apprenant' => '/dashboard/apprenant',
                'enseignant' => '/dashboard/enseignant',
                'coordinateur' => '/dashboard/coordinateur',
                'chef_departement' => '/dashboard/chef',
                'admin' => '/admin'
            ];

            return response()->json([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'annee' => $apprenant ? $apprenant->annee : null,
                    'metier' => $apprenant && $apprenant->metier ? $apprenant->metier->nom : null
                ],
                'token' => $token,
                'redirect' => $redirects[$user->role] ?? '/' // 🔥 Ajout ici
            ]);
        }

        return response()->json(['message' => 'Identifiants invalides.'], 401);
    }

    public function store(Request $request): JsonResponse
    {
        // Validation commune
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => 'required|in:apprenant,enseignant,coordinateur,assistant,admin',
        ];

        // Si c'est un apprenant, on ajoute validation metier_id et annee
        if ($request->role === 'apprenant') {
            $rules['metier_id'] = ['required', 'integer', 'exists:metiers,id'];
            $rules['annee'] = ['required', 'integer', 'in:1,2'];
        }

        $request->validate($rules);

        $user = User::create([
            'name' => $request->name,
            'email' => strtolower($request->email),
            'password' => Hash::make($request->password),
            'role' => $request->role,
        ]);

        // Créer un profil Apprenant si le rôle est 'apprenant'
        if ($user->role === 'apprenant') {
            $existingApprenant = Apprenant::where('email', $user->email)->first();

            if (!$existingApprenant) {
                $parts = explode(' ', $request->name, 2);
                $nom = $parts[0];
                $prenom = $parts[1] ?? '';

                Apprenant::create([
                    'matricule' => 'MAT' . rand(1000, 9999),
                    'nom' => $nom,
                    'prenom' => $prenom,
                    'email' => $user->email,
                    'annee' => $request->annee,
                    'metier_id' => $request->metier_id,
                    'user_id' => $user->id
                ]);
            }
        }

        // ✅ Envoyer l'email à TOUS les nouveaux utilisateurs
        $user->notify(new WelcomeEmail($user));

        // Marquer comme inscrit
        event(new Registered($user));

        // Répondre avec succès
        return response()->json([
            'message' => 'Compte créé avec succès',
            'token' => $user->createToken('api-token')->plainTextToken,
            'user' => $user
        ], 201);
    }
}
