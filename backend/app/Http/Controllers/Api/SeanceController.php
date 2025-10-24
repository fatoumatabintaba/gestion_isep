<?php

namespace App\Http\Controllers\Api;

use App\Models\Seance;
use App\Models\Uea;
use App\Models\User;
use App\Models\Apprenant;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Notifications\CoursEnLigneProgramme;
use App\Notifications\AbsenceNotification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SeanceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $seances = Seance::with('uea', 'enseignant', 'metier')->get();
        return response()->json($seances);
    }

    public function indexForCoordinateur()
    {
        $seances = \App\Models\Seance::with('enseignant', 'metier')->orderBy('date', 'desc')->get();
        return response()->json($seances);
    }

    public function indexForResponsableMetier(Request $request)
    {
        $user = $request->user();

        // ✅ CORRECTION: Utiliser where('metier_id') au lieu de where('metier')
        $seances = \App\Models\Seance::where('metier_id', $user->metier_id)
            ->with('enseignant', 'metier')
            ->orderBy('date', 'desc')
            ->get();

        return response()->json($seances);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nom' => 'required|string|max:255',
            'uea_nom' => 'required|string|max:255',
            'enseignant_id' => 'required|exists:users,id',
            'salle' => 'nullable|string|max:20',
            'date' => 'required|date',
            'heure_debut' => 'required',
            'heure_fin' => 'required',
            'duree' => 'required|in:4h,8h',
            'type' => 'required|in:presentiel,en_ligne',
            'statut' => 'required|in:programmee,effectuee,annulee',
            'metier_id' => 'required|exists:metiers,id', // ✅ CORRECTION: metier_id existe dans metiers
            'annee' => 'required|string',
            'lien_reunion' => 'nullable|url'
        ]);

        try {
            Log::info('🔵 Début création séance', $request->all());

            $seance = Seance::create([
                'nom' => $request->nom,
                'uea_nom' => $request->uea_nom,
                'metier_id' => $request->metier_id, // ✅ CORRECTION: metier_id au lieu de metier
                'annee' => $request->annee,
                'uea_id' => $request->uea_id ?? null,
                'enseignant_id' => $request->enseignant_id,
                'salle' => $request->salle ?? 'A101',
                'date' => $request->date,
                'heure_debut' => $request->heure_debut,
                'heure_fin' => $request->heure_fin,
                'duree' => $request->duree,
                'type' => $request->type,
                'lien_reunion' => $request->lien_reunion ? trim($request->lien_reunion) : null,
                'statut' => $request->statut,
            ]);

            Log::info('✅ Séance créée avec ID: ' . $seance->id, $seance->toArray());

            // ✅ CORRECTION: Utiliser metier_id au lieu de metier
            if ($seance->type === 'en_ligne' && $seance->metier_id && $seance->annee) {
                $this->envoyerNotificationsCoursEnLigne($seance);
            }

            return response()->json([
                'message' => 'Séance créée avec succès' . ($seance->type === 'en_ligne' ? ' et notifications envoyées !' : ''),
                'seance' => $seance->load('enseignant', 'metier')
            ], 201);

        } catch (\Exception $e) {
            Log::error('❌ Erreur création séance:', [
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile()
            ]);

            return response()->json([
                'message' => 'Erreur lors de la création de la séance',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ CORRECTION : Envoyer les notifications pour les cours en ligne
     */
    private function envoyerNotificationsCoursEnLigne(Seance $seance)
    {
        try {
            Log::info('📧 Début envoi notifications pour cours en ligne', [
                'seance_id' => $seance->id,
                'metier_id' => $seance->metier_id, // ✅ CORRECTION: metier_id au lieu de metier
                'annee' => $seance->annee
            ]);

            // ✅ CORRECTION: Utiliser where('metier_id') au lieu de where('metier')
            $apprenants = Apprenant::where('metier_id', $seance->metier_id)
                ->where('annee', $seance->annee)
                ->with('user')
                ->get();

            Log::info('👥 Apprenants trouvés: ' . $apprenants->count());

            $notificationsEnvoyees = 0;

            foreach ($apprenants as $apprenant) {
                if ($apprenant->user && $apprenant->user->email) {
                    try {
                        // ✅ UTILISER VOTRE NOTIFICATION EXISTANTE
                        $apprenant->user->notify(new CoursEnLigneProgramme($seance));
                        $notificationsEnvoyees++;

                        Log::info('✅ Notification envoyée à: ' . $apprenant->user->email, [
                            'apprenant_id' => $apprenant->id,
                            'user_id' => $apprenant->user->id
                        ]);

                    } catch (\Exception $e) {
                        Log::error('❌ Erreur envoi notification à ' . $apprenant->user->email . ': ' . $e->getMessage());
                    }
                } else {
                    Log::warning('⚠️ Apprenant sans user ou email: ' . $apprenant->id);
                }
            }

            Log::info("🎉 Notifications envoyées avec succès: {$notificationsEnvoyees}/{$apprenants->count()}");

        } catch (\Exception $e) {
            Log::error('❌ Erreur générale envoi notifications: ' . $e->getMessage(), [
                'seance_id' => $seance->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Affiche une séance spécifique
     */
    public function show(string $id)
    {
        $seance = Seance::with('uea', 'enseignant', 'metier', 'presences.apprenant')->find($id);

        if(!$seance){
            return response()->json(['message' => 'Séance non trouvée'], 404);
        }
        return response()->json($seance);
    }

    /**
     * Récupérer les séances d'un apprenant - CORRIGÉ ET OPTIMISÉ
     */
    public function mesSeances(Request $request)
    {
        try {
            $user = $request->user();

            \Log::info('🔍 mesSeances appelée', [
                'user_id' => $user->id,
                'role' => $user->role,
                'has_apprenant' => !is_null($user->apprenant)
            ]);

            // Vérifier que l'utilisateur est un apprenant
            if ($user->role !== 'apprenant') {
                return response()->json(['message' => 'Accès refusé. Rôle non autorisé.'], 403);
            }

            if (!$user->apprenant) {
                return response()->json(['message' => 'Profil apprenant non trouvé'], 404);
            }

            $apprenant = $user->apprenant;

            \Log::info('👥 Récupération séances pour apprenant', [
                'apprenant_id' => $apprenant->id,
                'metier_id' => $apprenant->metier_id,
                'annee' => $apprenant->annee
            ]);

            // ✅ CORRECTION: Utiliser where('metier_id') avec la valeur ID
            $seances = Seance::where('metier_id', $apprenant->metier_id)
                ->where('annee', $apprenant->annee)
                ->with(['enseignant', 'metier'])
                ->orderBy('date', 'desc')
                ->orderBy('heure_debut', 'asc')
                ->get()
                ->map(function ($seance) {
                    return [
                        'id' => $seance->id,
                        'nom' => $seance->nom,
                        'matiere' => $seance->uea_nom,
                        'date' => $seance->date,
                        'heure_debut' => $seance->heure_debut,
                        'heure_fin' => $seance->heure_fin,
                        'salle' => $seance->salle,
                        'type' => $seance->type,
                        'lien_reunion' => $seance->lien_reunion,
                        'enseignant' => $seance->enseignant ? [
                            'id' => $seance->enseignant->id,
                            'name' => $seance->enseignant->name
                        ] : null,
                        'metier' => $seance->metier ? [
                            'id' => $seance->metier->id,
                            'nom' => $seance->metier->nom
                        ] : null
                    ];
                });

            \Log::info('✅ Séances récupérées', ['count' => $seances->count()]);

            // ✅ CORRECTION: Si aucune séance trouvée, retourner un tableau vide au lieu d'erreur
            return response()->json($seances);

        } catch (\Exception $e) {
            \Log::error('❌ Erreur récupération séances apprenant', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // ✅ CORRECTION: Retourner un tableau vide en cas d'erreur au lieu de message d'erreur
            return response()->json([]);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        // À implémenter si nécessaire
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        // À implémenter si nécessaire
    }

    /**
     * ✅ CORRECTION : Méthode notifierAbsences complète avec gestion d'erreurs
     */
    public function notifierAbsences(Seance $seance, Request $request)
    {
        try {
            $absents = $request->input('absents', []);

            Log::info('📧 Début envoi notifications d\'absence', [
                'seance_id' => $seance->id,
                'nombre_absents' => count($absents)
            ]);

            $emailsEnvoyes = 0;
            $erreurs = [];

            foreach ($absents as $absent) {
                try {
                    // Vérifier que l'email est valide
                    if (filter_var($absent['email'], FILTER_VALIDATE_EMAIL)) {
                        // ✅ ENVOYER L'EMAIL AVEC LA NOTIFICATION
                        Mail::to($absent['email'])->send(new AbsenceNotification($absent, $seance));
                        $emailsEnvoyes++;

                        Log::info('✅ Email d\'absence envoyé avec succès', [
                            'email' => $absent['email'],
                            'apprenant' => $absent['nom']
                        ]);
                    } else {
                        $erreurs[] = "Email invalide pour {$absent['nom']}: {$absent['email']}";
                        Log::warning('⚠️ Email invalide', [
                            'apprenant' => $absent['nom'],
                            'email' => $absent['email']
                        ]);
                    }
                } catch (\Exception $e) {
                    $erreurs[] = "Erreur pour {$absent['nom']}: " . $e->getMessage();
                    Log::error('❌ Erreur envoi email', [
                        'email' => $absent['email'],
                        'erreur' => $e->getMessage()
                    ]);
                }
            }

            $response = [
                'success' => true,
                'message' => "$emailsEnvoyes email(s) d'absence envoyé(s) avec succès",
                'emails_envoyes' => $emailsEnvoyes,
                'total_absents' => count($absents)
            ];

            if (!empty($erreurs)) {
                $response['erreurs'] = $erreurs;
                $response['message'] .= " avec " . count($erreurs) . " erreur(s)";
            }

            Log::info('🎉 Envoi emails d\'absence terminé', $response);

            return response()->json($response);

        } catch (\Exception $e) {
            Log::error('❌ Erreur générale notifierAbsences', [
                'seance_id' => $seance->id,
                'erreur' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'envoi des emails d\'absence: ' . $e->getMessage()
            ], 500);
        }
    }
}
