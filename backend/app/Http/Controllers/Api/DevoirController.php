<?php

namespace App\Http\Controllers\Api;

use App\Models\Devoir;
use App\Models\Soumission;
use App\Models\Apprenant;
use App\Models\Uea;
use App\Models\User;
use App\Models\Metier;
use App\Notifications\DevoirCree;
use App\Notifications\DevoirSoumis;
use App\Notifications\DevoirCorrige;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Notification;

class DevoirController extends Controller
{
    /**
     * ✅ CORRIGÉ : Lister les devoirs de l'enseignant connecté
     */
    public function mesDevoirs(Request $request)
    {
        $enseignantId = $request->user()->id;

        $devoirs = Devoir::with([
            'uea:id,nom,code',
            'enseignant:id,name',
            'metier:id,nom' // ✅ AJOUT : Charger la relation métier
        ])
        ->where('enseignant_id', $enseignantId)
        ->withCount('soumissions')
        ->orderBy('created_at', 'desc')
        ->get();

        // ✅ CORRECTION : Ajouter l'URL complète du fichier ET les champs manquants
        $devoirs->transform(function ($devoir) {
            $devoir->uea_nom = $devoir->uea->nom ?? 'N/A';
            // ✅ Retourner l'URL complète du fichier
            $devoir->fichier_consigne_url = $devoir->fichier_consigne ? Storage::url($devoir->fichier_consigne) : null;
            // ✅ CORRECTION : Utiliser la relation métier au lieu d'une propriété inexistante
            $devoir->metier = $devoir->metier ? $devoir->metier->nom : 'Non spécifié';
            $devoir->annee = $devoir->annee ?? '?';
            return $devoir;
        });

        return response()->json($devoirs);
    }

    /**
     * ✅ NOUVELLE MÉTHODE : Lister les devoirs pour l'apprenant connecté
     */
    public function devoirsApprenant(Request $request)
    {
        $user = $request->user();

        // Récupérer les devoirs selon le métier et l'année de l'apprenant
        $devoirs = Devoir::where('metier_id', $user->metier_id)
            ->where('annee', $user->annee)
            ->with(['uea:id,nom', 'enseignant:id,name'])
            ->withCount(['soumissions' => function($query) use ($user) {
                $query->where('apprenant_id', $user->id);
            }])
            ->orderBy('created_at', 'desc')
            ->get();

        // Formater la réponse
        $devoirsFormatted = $devoirs->map(function ($devoir) use ($user) {
            return [
                'id' => $devoir->id,
                'titre' => $devoir->titre,
                'description' => $devoir->description,
                'uea_nom' => $devoir->uea->nom ?? 'N/A',
                'date_limite' => $devoir->date_limite,
                'coefficient' => $devoir->coefficient,
                'fichier_sujet' => $devoir->fichier_consigne ? Storage::url($devoir->fichier_consigne) : null,
                'enseignant_nom' => $devoir->enseignant->name ?? 'N/A',
                'soumissions_count' => $devoir->soumissions_count,
                'created_at' => $devoir->created_at,
                'updated_at' => $devoir->updated_at,
                'peut_soumettre' => now()->lte($devoir->date_limite) // ✅ Si la date limite n'est pas dépassée
            ];
        });

        return response()->json($devoirsFormatted);
    }

    /**
     * ✅ NOUVELLE MÉTHODE : Récupérer la soumission d'un apprenant pour un devoir
     */
    public function maSoumission(Request $request, $devoirId)
    {
        $user = $request->user();

        $soumission = Soumission::where('devoir_id', $devoirId)
            ->where('apprenant_id', $user->id)
            ->first();

        if (!$soumission) {
            return response()->json(['error' => 'Soumission non trouvée'], 404);
        }

        return response()->json([
            'id' => $soumission->id,
            'fichier' => $soumission->fichier_rendu ? Storage::url($soumission->fichier_rendu) : null,
            'feedback' => $soumission->feedback,
            'note' => $soumission->note,
            'retard' => $soumission->retard,
            'date_soumission' => $soumission->created_at
        ]);
    }

    /**
     * ✅ NOUVELLE MÉTHODE : Soumettre un devoir (avec fichier) pour apprenant
     */
    public function soumettreDevoir(Request $request, $devoirId)
    {
        $request->validate([
            'fichier' => 'required|file|max:51200|mimes:pdf,zip,rar,txt,doc,docx'
        ]);

        $user = $request->user();
        $devoir = Devoir::with('enseignant')->findOrFail($devoirId);

        // Vérifier si l'apprenant a le droit de soumettre ce devoir
        if ($devoir->metier_id !== $user->metier_id || $devoir->annee !== $user->annee) {
            return response()->json([
                'error' => 'Vous n\'êtes pas autorisé à soumettre ce devoir'
            ], 403);
        }

        // Vérifier si la date limite est dépassée
        $retard = now()->gt($devoir->date_limite);
        if ($retard) {
            return response()->json([
                'error' => 'La date limite de soumission est dépassée'
            ], 400);
        }

        // Gérer l'upload du fichier
        if ($request->hasFile('fichier')) {
            $file = $request->file('fichier');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('soumissions', $fileName, 'public');
        }

        // Créer ou mettre à jour la soumission
        $soumission = Soumission::updateOrCreate(
            [
                'devoir_id' => $devoirId,
                'apprenant_id' => $user->id
            ],
            [
                'fichier_rendu' => $filePath,
                'date_soumission' => now(),
                'retard' => false,
                'statut' => 'soumis'
            ]
        );

        // 🔔 Notification à l'enseignant
        if ($devoir->enseignant) {
            try {
                $devoir->enseignant->notify(new DevoirSoumis($soumission));
            } catch (\Exception $e) {
                Log::warning("Échec d'envoi de notification à l'enseignant", ['error' => $e->getMessage()]);
            }
        }

        return response()->json([
            'message' => 'Devoir soumis avec succès ! L\'enseignant a été notifié.',
            'soumission' => $soumission
        ]);
    }

    /**
     * ✅ NOUVELLE MÉTHODE : Envoyer un feedback pour une soumission
     */
    public function envoyerFeedback(Request $request, $soumissionId)
    {
        $request->validate([
            'feedback' => 'required|string|max:1000',
            'note' => 'required|numeric|between:0,20'
        ]);

        $soumission = Soumission::with(['devoir', 'apprenant'])->findOrFail($soumissionId);

        // Vérifier que l'enseignant est bien celui qui a créé le devoir
        if ($soumission->devoir->enseignant_id !== $request->user()->id) {
            return response()->json([
                'error' => 'Vous n\'êtes pas autorisé à corriger ce devoir'
            ], 403);
        }

        $soumission->update([
            'feedback' => $request->feedback,
            'note' => $request->note,
            'date_correction' => now(),
            'statut' => 'corrigé'
        ]);

        // 🔔 Notification à l'apprenant
        if ($soumission->apprenant) {
            try {
                $soumission->apprenant->notify(new DevoirCorrige($soumission));
            } catch (\Exception $e) {
                Log::warning("Échec d'envoi de notification à l'apprenant", ['error' => $e->getMessage()]);
            }
        }

        return response()->json([
            'message' => 'Devoir corrigé et feedback envoyé ! L\'apprenant a été notifié.',
            'soumission' => $soumission
        ]);
    }

    /**
     * Créer un nouveau devoir (par l'enseignant) - CORRIGÉ
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'uea_nom' => 'required|string|max:255',
            'titre' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date_limite' => 'required|date',
            'fichier_sujet' => 'nullable|file|max:51200|mimes:pdf,zip',
            'coefficient' => 'nullable|integer|min:1|max:10',
            'type_sujet' => 'required|in:texte,fichier',
            'metier' => 'required|string|max:255',
            'annee' => 'required|string|max:255'
        ]);

        // ✅ Trouve ou crée l'UEA
        $uea = Uea::firstOrCreate(
            ['nom' => $validated['uea_nom']],
            [
                'code' => strtoupper(substr($validated['uea_nom'], 0, 3)) . rand(100, 999),
                'description' => $validated['description'] ?? 'Créée via devoir',
                'annee' => $validated['annee']
            ]
        );

        // ✅ Trouve le métier
        $metier = Metier::where('nom', $validated['metier'])->first();

        if (!$metier) {
            return response()->json([
                'message' => 'Métier non trouvé'
            ], 404);
        }

        // ✅ Associe l'UEA au métier si pas déjà fait
        if (!$uea->metiers()->where('metier_id', $metier->id)->exists()) {
            $uea->metiers()->attach($metier->id);
        }

        // ✅ Prépare les données du devoir
        $data = [
            'titre' => $validated['titre'],
            'description' => $validated['description'],
            'uea_id' => $uea->id,
            'enseignant_id' => $request->user()->id,
            'date_limite' => $validated['date_limite'],
            'coefficient' => $validated['coefficient'] ?? 1,
            'metier_id' => $metier->id,
            'annee' => $validated['annee']
        ];

        // ✅ Stocke le fichier sujet s'il existe et si type est fichier
        if ($request->hasFile('fichier_sujet') && $validated['type_sujet'] === 'fichier') {
            $file = $request->file('fichier_sujet');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $data['fichier_consigne'] = $file->storeAs('devoirs/sujets', $fileName, 'public');
        }

        // ✅ Crée le devoir
        $devoir = Devoir::create($data);
        $devoir->load('uea', 'enseignant', 'metier');

        // 🔔 Envoie une notification aux apprenants concernés
        $apprenants = User::where('metier_id', $metier->id)
                        ->where('annee', $validated['annee'])
                        ->where('role', 'apprenant')
                        ->get();

        $notificationCount = 0;
        foreach ($apprenants as $apprenant) {
            try {
                $apprenant->notify(new DevoirCree($devoir));
                $notificationCount++;
            } catch (\Exception $e) {
                Log::warning("Échec d'envoi de notification à {$apprenant->email}", ['error' => $e->getMessage()]);
            }
        }

        return response()->json([
            'message' => "Devoir créé avec succès pour {$validated['metier']} - Année {$validated['annee']} ! {$notificationCount} apprenant(s) notifié(s).",
            'devoir' => $devoir
        ], 201);
    }

    /**
     * ✅ NOUVELLE MÉTHODE : Récupérer les soumissions d'un devoir
     */
    public function getSoumissions(Request $request, $devoirId)
    {
        $devoir = Devoir::with([
            'soumissions.apprenant:id,name,email',
            'soumissions' => fn($q) => $q->orderBy('created_at', 'desc')
        ])->findOrFail($devoirId);

        // Vérifie que c'est bien l'enseignant du devoir
        if ($devoir->enseignant_id !== $request->user()->id) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        // Formate les données
        $soumissions = $devoir->soumissions->map(function ($soumission) {
            return [
                'id' => $soumission->id,
                'apprenant_nom' => $soumission->apprenant->name ?? 'N/A',
                'apprenant_email' => $soumission->apprenant->email ?? 'N/A',
                'fichier' => $soumission->fichier_rendu ? Storage::url($soumission->fichier_rendu) : null,
                'feedback' => $soumission->feedback,
                'note' => $soumission->note,
                'retard' => $soumission->retard,
                'statut' => $soumission->statut,
                'date_soumission' => $soumission->created_at,
                'date_correction' => $soumission->date_correction
            ];
        });

        return response()->json($soumissions);
    }
}
