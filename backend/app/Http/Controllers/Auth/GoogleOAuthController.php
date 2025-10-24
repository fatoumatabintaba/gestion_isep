<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoogleOAuthController extends Controller
{
    /**
     * Rediriger vers Google pour l'authentification OAuth
     */
    public function redirect()
    {
        $params = [
            'client_id' => config('services.google.client_id'),
            'redirect_uri' => config('services.google.redirect'),
            'response_type' => 'code',
            'scope' => implode(' ', [
                'https://www.googleapis.com/auth/calendar.events',
                'https://www.googleapis.com/auth/calendar',
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/userinfo.profile',
            ]),
            'access_type' => 'offline', // Pour obtenir un refresh token
            'prompt' => 'consent', // Forcer le consentement
        ];

        $url = 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query($params);

        return redirect($url);
    }

    /**
     * Traiter le callback de Google
     */
    public function callback(Request $request)
    {
        if ($request->has('error')) {
            return redirect('/dashboard/enseignant')
                ->with('error', 'Connexion Google annulée');
        }

        $code = $request->get('code');

        try {
            // ✅ Échanger le code contre un access token
            $response = Http::post('https://oauth2.googleapis.com/token', [
                'code' => $code,
                'client_id' => config('services.google.client_id'),
                'client_secret' => config('services.google.client_secret'),
                'redirect_uri' => config('services.google.redirect'),
                'grant_type' => 'authorization_code',
            ]);

            if (!$response->successful()) {
                throw new \Exception('Erreur lors de l\'échange du code: ' . $response->body());
            }

            $tokenData = $response->json();

            // ✅ Sauvegarder le token dans le profil utilisateur
            $user = auth()->user();
            $user->update([
                'google_access_token' => $tokenData['access_token'],
                'google_refresh_token' => $tokenData['refresh_token'] ?? $user->google_refresh_token,
                'google_token_expires_at' => now()->addSeconds($tokenData['expires_in']),
            ]);

            Log::info('✅ Google OAuth réussi pour user: ' . $user->id);

            return redirect('/dashboard/enseignant')
                ->with('success', '✅ Compte Google connecté avec succès ! Vous pouvez maintenant créer des Google Meet.');

        } catch (\Exception $e) {
            Log::error('❌ Erreur Google OAuth: ' . $e->getMessage());

            return redirect('/dashboard/enseignant')
                ->with('error', '❌ Erreur lors de la connexion Google: ' . $e->getMessage());
        }
    }

    /**
     * Rafraîchir le token Google (appelé automatiquement si expiré)
     */
    public function refreshToken($user)
    {
        if (!$user->google_refresh_token) {
            throw new \Exception('Aucun refresh token disponible');
        }

        $response = Http::post('https://oauth2.googleapis.com/token', [
            'client_id' => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
            'refresh_token' => $user->google_refresh_token,
            'grant_type' => 'refresh_token',
        ]);

        if (!$response->successful()) {
            throw new \Exception('Erreur refresh token: ' . $response->body());
        }

        $tokenData = $response->json();

        $user->update([
            'google_access_token' => $tokenData['access_token'],
            'google_token_expires_at' => now()->addSeconds($tokenData['expires_in']),
        ]);

        return $tokenData['access_token'];
    }
}
