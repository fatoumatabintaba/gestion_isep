<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Apprenant;
use App\Models\Metier;
use App\Notifications\WelcomeEmail;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class RegisteredUserController extends Controller
{
    /**
     * Connexion : génère un token Sanctum
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:8',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Identifiants incorrects'], 401);
        }

        // 🔐 Vérifie si l'utilisateur est un apprenant en attente
        if ($user->role === 'apprenant') {
            $apprenant = $user->apprenant;

            if (!$apprenant || $apprenant->status !== 'valide') {
                return response()->json([
                    'message' => 'Votre compte est en attente d\'approbation par l\'administrateur.'
                ], 403);
            }
        }

        // ✅ Récupère les infos directement depuis le modèle User
        // (metier_id et annee sont des colonnes de la table `users`)
        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'annee' => $user->annee,        // ✅ Depuis users
                'metier_id' => $user->metier_id, // ✅ Depuis users
            ],
            'token' => $user->createToken('api-token')->plainTextToken
        ]);
    }

    /**
     * Inscription : uniquement pour les apprenants
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $rules = [
                'name' => ['required', 'string', 'max:255'],
                'prenom' => ['required', 'string', 'max:255'],
                'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
                'password' => ['required', 'confirmed', Rules\Password::defaults()],
                'role' => 'required|in:apprenant', // ✅ Seul apprenant autorisé ici
            ];

            if ($request->role === 'apprenant') {
                $rules['metier_id'] = ['required', 'integer', 'exists:metiers,id'];
                $rules['annee'] = ['required', 'integer', 'in:1,2'];
            }

            $validated = $request->validate($rules);

            $user = User::create([
                'name' => $validated['name'],
                'prenom' => $validated['prenom'],
                'email' => strtolower($validated['email']),
                'password' => Hash::make($validated['password']),
                'role' => 'apprenant', // ✅ Force le rôle ici
                'metier_id' => $validated['metier_id'] ?? null,
                'annee' => $validated['annee'] ?? null,
            ]);

            if ($user->role === 'apprenant') {
                $existingApprenant = Apprenant::where('email', $user->email)->first();

                if (!$existingApprenant) {
                    $parts = explode(' ', $validated['name'], 2);
                    $nom = $parts[0] ?? '';
                    $prenom = $parts[1] ?? '';

                    Apprenant::create([
                        'matricule' => 'MAT' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
                        'nom' => $nom,
                        'prenom' => $prenom,
                        'email' => $user->email,
                        'annee' => $validated['annee'],
                        'metier_id' => $validated['metier_id'],
                        'user_id' => $user->id,
                        'status' => 'en_attente'
                    ]);
                }
            }

            $user->notify(new WelcomeEmail($user));
            event(new Registered($user));

            return response()->json([
                'message' => 'Compte créé avec succès',
                'token' => $user->createToken('api-token')->plainTextToken,
                 'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'annee' => $user->annee,
                    'metier_id' => $user->metier_id, // ✅ Même format que login
                ]
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Erreur inscription:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Erreur serveur. Veuillez réessayer.'
            ], 500);
        }
    }

    /**
     * Déconnexion
     */
    // public function logout(Request $request)
    // {
    //     $user = $request->user();
    //     if ($user) {
    //         $user->currentAccessToken()->delete();
    //     }
    //     return response()->json(['message' => 'Déconnecté']);
    // }
    public function logout(Request $request)
{
    $request->user()->currentAccessToken()->delete();
    return response()->json(['message' => 'Déconnecté avec succès']);
}

    /**
     * Valider un apprenant
     */
    public function valider($id)
    {
        $apprenant = Apprenant::findOrFail($id);
        $apprenant->status = 'valide';
        $apprenant->save();

        // ✅ Envoie une notification
        $apprenant->user?->notify(new \App\Notifications\CompteValide($apprenant));

        return response()->json(['message' => 'Apprenant validé avec succès']);
    }
}
