<?php

namespace App\Http\Controllers\Auth;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Apprenant;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Http\JsonResponse;


class RegisteredUserController extends Controller
{


    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */

    // Méthode de login
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (Auth::attempt(['email' => $request->email, 'password' => $request->password])) {
            $user = Auth::user();
            $token  = $user->createToken('api-token')->plainTextToken;
            return response()->json(['user' => $user, 'token' => $token]);
        }

        return response()->json(['message' => 'Identifiants invalides.'], 401);
    }
   public function store(Request $request): JsonResponse
{
    $request->validate([
        'name' => ['required', 'string', 'max:255'],
        'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
        'password' => ['required','confirmed', Rules\Password::defaults()],
        'role' => 'required|in:apprenant,enseignant,coordinateur,assistant,admin',
    ]);

    $user = User::create([
        'name' => $request->name,
        'email' => strtolower($request->email),  // minuscule forcée ici
        'password' => Hash::make($request->password),
        'role' => $request->role,

    ]);

    // Dans RegisteredUserController@store

    if ($user->role === 'apprenant') {
        $parts = explode(' ', $request->name, 2); // permet si jamais un utilisateur a un nom compose donc il prend tout apres le premier espace
        $nom = $parts[0];
        $prenom = $parts[1] ?? '';
        Apprenant::create([
            'matricule' => 'MAT' . rand(1000, 9999),
            'nom' => $nom,
            'prenom' => $prenom,
            'email' => $user->email,
            'annee' => 1,
            'metier_id' => 1, // À adapter
            'user_id' => $user->id
        ]);
}

    event(new Registered($user));
    // Auth::login($user);

    return response()->json([
            'message' => 'Compte créé avec succès',
            'token' => $user->createToken('api-token')->plainTextToken,
            'user' => $user
        ], 201);
}

}
