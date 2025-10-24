<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class VideoConferenceController extends Controller
{
    /**
     * Créer un événement Google Calendar avec Google Meet
     */
    public function creerGoogleMeet(Request $request)
    {
        $request->validate([
            'summary' => 'required|string',
            'description' => 'nullable|string',
            'startDateTime' => 'required|string', // ← CORRIGÉ
            'endDateTime' => 'required|string',   // ← CORRIGÉ
            'timeZone' => 'nullable|string',
        ]);

        try {
            $user = auth()->user();

            // ✅ Vérifier si l'utilisateur a un token Google OAuth
            if (!$user->google_access_token) {
                return response()->json([
                    'error' => 'Vous devez d\'abord connecter votre compte Google',
                    'auth_url' => url('/auth/google') // ← CORRIGÉ (route directe)
                ], 401);
            }

            // ✅ Générer un requestId unique
            $requestId = uniqid();

            // ✅ Créer l'événement Google Calendar avec Meet
            $response = Http::withToken($user->google_access_token)
                ->withOptions([
                    'query' => ['conferenceDataVersion' => 1] // ← CORRIGÉ (déplacé en query param)
                ])
                ->post('https://www.googleapis.com/calendar/v3/calendars/primary/events', [
                    'summary' => $request->summary,
                    'description' => $request->description,
                    'start' => [
                        'dateTime' => $request->startDateTime, // ← CORRIGÉ
                        'timeZone' => $request->timeZone ?? 'Africa/Dakar',
                    ],
                    'end' => [
                        'dateTime' => $request->endDateTime, // ← CORRIGÉ
                        'timeZone' => $request->timeZone ?? 'Africa/Dakar',
                    ],
                    'conferenceData' => [
                        'createRequest' => [
                            'requestId' => $requestId, // ← CORRIGÉ
                            'conferenceSolutionKey' => [
                                'type' => 'hangoutsMeet'
                            ]
                        ]
                    ],
                    'reminders' => [
                        'useDefault' => false,
                        'overrides' => [
                            ['method' => 'email', 'minutes' => 24 * 60],
                            ['method' => 'popup', 'minutes' => 30],
                        ],
                    ],
                ]);

            if ($response->successful()) {
                $eventData = $response->json();

                return response()->json([
                    'success' => true,
                    'meetLink' => $eventData['hangoutLink'] ?? null,
                    'eventId' => $eventData['id'],
                    'htmlLink' => $eventData['htmlLink'],
                    'message' => 'Événement Google Calendar créé avec succès'
                ]);
            }

            // ✅ Gérer le refresh token si expiré
            if ($response->status() === 401) {
                return response()->json([
                    'error' => 'Token Google expiré. Reconnectez-vous.',
                    'auth_url' => url('/auth/google') // ← CORRIGÉ
                ], 401);
            }

            throw new \Exception('Erreur Google API: ' . $response->body());

        } catch (\Exception $e) {
            Log::error('Erreur création Google Meet: ' . $e->getMessage());

            return response()->json([
                'error' => 'Erreur lors de la création du lien Google Meet',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Créer une réunion Zoom
     */
    public function creerZoomMeeting(Request $request)
    {
        $request->validate([
            'topic' => 'required|string',
            'type' => 'required|integer',
            'start_time' => 'required|string',
            'duration' => 'required|integer',
            'agenda' => 'nullable|string',
        ]);

        try {
            $user = auth()->user();

            // ✅ Vérifier si l'utilisateur a un token Zoom OAuth
            if (!$user->zoom_access_token) {
                return response()->json([
                    'error' => 'Vous devez d\'abord connecter votre compte Zoom',
                    'auth_url' => url('/auth/zoom') // ← CORRIGÉ
                ], 401);
            }

            // ✅ Créer la réunion Zoom via API
            $response = Http::withToken($user->zoom_access_token)
                ->post('https://api.zoom.us/v2/users/me/meetings', [
                    'topic' => $request->topic,
                    'type' => $request->type,
                    'start_time' => $request->start_time,
                    'duration' => $request->duration,
                    'timezone' => $request->timezone ?? 'Africa/Dakar',
                    'agenda' => $request->agenda,
                    'settings' => $request->settings ?? [
                        'host_video' => true,
                        'participant_video' => true,
                        'join_before_host' => false,
                        'mute_upon_entry' => true,
                        'waiting_room' => true,
                        'audio' => 'both',
                        'auto_recording' => 'none',
                    ]
                ]);

            if ($response->successful()) {
                $meetingData = $response->json();

                return response()->json([
                    'success' => true,
                    'join_url' => $meetingData['join_url'],
                    'meeting_id' => $meetingData['id'],
                    'password' => $meetingData['password'] ?? null,
                    'start_url' => $meetingData['start_url'], // Pour l'hôte
                    'message' => 'Réunion Zoom créée avec succès'
                ]);
            }

            if ($response->status() === 401) {
                return response()->json([
                    'error' => 'Token Zoom expiré. Reconnectez-vous.',
                    'auth_url' => url('/auth/zoom') // ← CORRIGÉ
                ], 401);
            }

            throw new \Exception('Erreur Zoom API: ' . $response->body());

        } catch (\Exception $e) {
            Log::error('Erreur création Zoom Meeting: ' . $e->getMessage());

            return response()->json([
                'error' => 'Erreur lors de la création de la réunion Zoom',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Générer un lien de démonstration (sans API)
     * Utile pour les tests
     */
    public function genererLienDemo(Request $request)
    {
        $request->validate([
            'plateforme' => 'required|in:google_meet,zoom,teams'
        ]);

        $plateforme = $request->plateforme;

        switch ($plateforme) {
            case 'google_meet':
                $code = $this->generateMeetCode();
                $lien = "https://meet.google.com/{$code}";
                break;

            case 'zoom':
                $meetingId = rand(100000000, 999999999);
                $password = substr(str_shuffle('abcdefghijklmnopqrstuvwxyz0123456789'), 0, 6);
                $lien = "https://zoom.us/j/{$meetingId}?pwd={$password}";
                break;

            case 'teams':
                $threadId = bin2hex(random_bytes(16));
                $lien = "https://teams.microsoft.com/l/meetup-join/{$threadId}";
                break;

            default:
                $lien = "https://example.com/meeting/" . uniqid();
        }

        return response()->json([
            'success' => true,
            'demo' => true,
            'lien' => $lien,
            'message' => '⚠️ Lien de démonstration généré. Configurez l\'API pour des vrais liens.'
        ]);
    }

    /**
     * Générer un code Google Meet aléatoire (format: xxx-yyyy-zzz)
     */
    private function generateMeetCode()
    {
        $chars = 'abcdefghijklmnopqrstuvwxyz';

        $part1 = substr(str_shuffle($chars), 0, 3);
        $part2 = substr(str_shuffle($chars), 0, 4);
        $part3 = substr(str_shuffle($chars), 0, 3);

        return "{$part1}-{$part2}-{$part3}";
    }

      /**
     * ✅ NOUVELLE MÉTHODE : Récupérer les cours en ligne pour l'apprenant
     */
    public function mesCoursEnLigne(Request $request)
    {
        try {
            $user = $request->user();

            // ✅ Solution temporaire : Retourner des données de démonstration
            // Vous pouvez remplacer cela par une vraie logique métier plus tard

            $coursDemo = [
                [
                    'id' => 1,
                    'titre' => 'Cours de Développement Web',
                    'description' => 'Introduction aux technologies web modernes',
                    'plateforme' => 'google_meet',
                    'lien' => 'https://meet.google.com/abc-defg-hij',
                    'date_cours' => now()->addDays(1)->toISOString(),
                    'enseignant' => 'Prof. Diallo',
                    'duree' => '2h'
                ],
                [
                    'id' => 2,
                    'titre' => 'TP Réseaux',
                    'description' => 'Travaux pratiques sur la configuration réseau',
                    'plateforme' => 'zoom',
                    'lien' => 'https://zoom.us/j/123456789',
                    'date_cours' => now()->addDays(2)->toISOString(),
                    'enseignant' => 'Prof. Ndiaye',
                    'duree' => '3h'
                ],
                [
                    'id' => 3,
                    'titre' => 'Base de données avancée',
                    'description' => 'Optimisation et requêtes complexes SQL',
                    'plateforme' => 'teams',
                    'lien' => 'https://teams.microsoft.com/l/meetup-join/xyz123',
                    'date_cours' => now()->addDays(3)->toISOString(),
                    'enseignant' => 'Prof. Sow',
                    'duree' => '1h30'
                ]
            ];

            return response()->json($coursDemo);

        } catch (\Exception $e) {
            Log::error('Erreur chargement cours en ligne: ' . $e->getMessage());

            return response()->json([
                'error' => 'Erreur lors du chargement des cours en ligne',
                'message' => $e->getMessage()
            ], 500);
        }
    }

}
