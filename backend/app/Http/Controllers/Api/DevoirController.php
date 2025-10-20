<?php

namespace App\Http\Controllers\Api;

use App\Models\Devoir;
use App\Models\Soumission;
use App\Models\Apprenant;
use App\Models\Uea;
use App\Models\User;
use App\Notifications\DevoirCree;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class DevoirController extends Controller
{
    /**
     * ✅ NOUVELLE MÉTHODE : Lister les devoirs de l'enseignant connecté
     */
    public function mesDevoirs(Request $request)
    {
        $enseignantId = $request->user()->id;

        $devoirs = Devoir::with([
            'uea:id,nom,code',
            'enseignant:id,name'
        ])
        ->where('enseignant_id', $enseignantId)
        ->withCount('soumissions')
        ->orderBy('created_at', 'desc')
        ->get();

        // Ajoute le nom de l'UEA directement dans chaque devoir
        $devoirs->transform(function ($devoir) {
            $devoir->uea_nom = $devoir->uea->nom ?? 'N/A';
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
        $devoirs = Devoir::whereHas('uea.metiers', function($query) use ($user) {
                $query->where('metiers.id', $user->metier_id);
            })
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
                'updated_at' => $devoir->updated_at
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
        $devoir = Devoir::findOrFail($devoirId);

        // Vérifier si la date limite est dépassée
        if (now()->gt($devoir->date_limite)) {
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

        return response()->json([
            'message' => 'Devoir soumis avec succès',
            'soumission' => $soumission
        ]);
    }

    /**
     * ✅ NOUVELLE MÉTHODE : Envoyer un feedback pour une soumission
     */
    public function envoyerFeedback(Request $request, $soumissionId)
    {
        $request->validate([
            'feedback' => 'required|string|max:1000'
        ]);

        $soumission = Soumission::with('devoir')->findOrFail($soumissionId);

        // Vérifier que l'enseignant est bien celui qui a créé le devoir
        if ($soumission->devoir->enseignant_id !== $request->user()->id) {
            return response()->json([
                'error' => 'Vous n\'êtes pas autorisé à corriger ce devoir'
            ], 403);
        }

        $soumission->update([
            'feedback' => $request->feedback,
            'date_correction' => now()
        ]);

        return response()->json([
            'message' => 'Feedback envoyé avec succès',
            'soumission' => $soumission
        ]);
    }

    /**
     * Lister tous les devoirs d'une UEA (par ID ou nom)
     */
    public function index($ueaIdOrNom)
    {
        $uea = Uea::where('id', $ueaIdOrNom)
                   ->orWhere('nom', 'like', '%' . $ueaIdOrNom . '%')
                   ->first();

        if (!$uea) {
            return response()->json(['message' => 'UEA non trouvée'], 404);
        }

        $devoirs = Devoir::with([
            'enseignant:id,name',
            'soumissions.apprenant:id,prenom,nom,matricule',
            'soumissions' => fn($q) => $q->where('apprenant_id', request()->user()?->apprenant?->id)
        ])->where('uea_id', $uea->id)->get();

        return response()->json($devoirs);
    }

    /**
     * Créer un nouveau devoir (par l'enseignant)
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
            'type_sujet' => 'required|in:texte,fichier'
        ]);

        // ✅ Trouve ou crée l'UEA
        $uea = Uea::firstOrCreate(
            ['nom' => $validated['uea_nom']],
            [
                'code' => strtoupper(substr($validated['uea_nom'], 0, 3)) . rand(100, 999),
                'description' => $validated['description'] ?? 'Créée via devoir',
                'annee' => 1
            ]
        );

        // ✅ Prépare les données du devoir
        $data = [
            'titre' => $validated['titre'],
            'description' => $validated['description'],
            'uea_id' => $uea->id,
            'enseignant_id' => $request->user()->id,
            'date_limite' => $validated['date_limite'],
            'coefficient' => $validated['coefficient'] ?? 1,
        ];

        // ✅ Stocke le fichier sujet s'il existe et si type est fichier
        if ($request->hasFile('fichier_sujet') && $validated['type_sujet'] === 'fichier') {
            $file = $request->file('fichier_sujet');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $data['fichier_consigne'] = $file->storeAs('devoirs/sujets', $fileName, 'public');
        }

        // ✅ Crée le devoir
        $devoir = Devoir::create($data);
        $devoir->load('uea', 'enseignant');

        // 🔔 Envoie une notification aux apprenants du métier
        $metier = $uea->metiers->first();
        if ($metier) {
            $apprenants = User::where('metier_id', $metier->id)
                            ->where('role', 'apprenant')
                            ->get();
            foreach ($apprenants as $apprenant) {
                try {
                    $apprenant->notify(new DevoirCree($devoir));
                } catch (\Exception $e) {
                    Log::warning("Échec d'envoi de notification à {$apprenant->email}", ['error' => $e->getMessage()]);
                }
            }
        } else {
            Log::info("Aucun métier lié à l'UEA ID: {$uea->id}");
        }

        return response()->json([
            'message' => 'Devoir créé avec succès',
            'devoir' => $devoir
        ], 201);
    }

    /**
     * Soumettre un devoir (par l'apprenant) - Ancienne méthode conservée
     */
    public function soumettre(Request $request, $devoirId)
    {
        $request->validate([
            'fichier_rendu' => 'required|file|max:51200',
            'commentaire' => 'nullable|string|max:500'
        ]);

        $devoir = Devoir::findOrFail($devoirId);
        $apprenant = $request->user();

        $retard = now()->gt($devoir->date_limite);

        $soumission = Soumission::updateOrCreate(
            [
                'devoir_id' => $devoirId,
                'apprenant_id' => $apprenant->id
            ],
            [
                'fichier_rendu' => $request->file('fichier_rendu')->store('devoirs/rendus', 'public'),
                'commentaire' => $request->commentaire,
                'retard' => $retard,
                'statut' => 'soumis'
            ]
        );

        // 🔔 Notification à l'enseignant
        if ($devoir->enseignant) {
            try {
                $devoir->enseignant->notify(new \App\Notifications\DevoirSoumis($soumission));
            } catch (\Exception $e) {
                Log::warning("Échec d'envoi de notification à l'enseignant", ['error' => $e->getMessage()]);
            }
        }

        return response()->json([
            'message' => $retard ? 'Devoir soumis en retard' : 'Devoir soumis à temps',
            'soumission' => $soumission->load('apprenant')
        ], 201);
    }

    /**
     * Corriger un devoir (par l'enseignant)
     */
    public function corriger(Request $request, $soumissionId)
    {
        $request->validate([
            'note' => 'required|integer|between:0,20',
            'feedback' => 'required|string',
            'fichier_corrige' => 'nullable|file|max:2048'
        ]);

        $soumission = Soumission::with('devoir', 'apprenant')->findOrFail($soumissionId);

        $data = $request->only(['note', 'feedback']);

        if ($request->hasFile('fichier_corrige')) {
            $data['fichier_corrige'] = $request->file('fichier_corrige')->store('devoirs/corriges', 'public');
        }

        $soumission->update($data);

        // 🔔 Notification à l'apprenant
        if ($soumission->apprenant) {
            try {
                $soumission->apprenant->notify(new \App\Notifications\DevoirCorrige($soumission));
            } catch (\Exception $e) {
                Log::warning("Échec d'envoi de notification à l'apprenant", ['error' => $e->getMessage()]);
            }
        }

        return response()->json([
            'message' => 'Devoir corrigé et noté',
            'soumission' => $soumission
        ]);
    }

    /**
     * ✅ NOUVELLE MÉTHODE : Récupérer les soumissions d'un devoir
     */
    public function getSoumissions(Request $request, $devoirId)
    {
        $devoir = Devoir::with([
            'soumissions.apprenant:id,name',
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
                'fichier' => $soumission->fichier_rendu ? Storage::url($soumission->fichier_rendu) : null,
                'feedback' => $soumission->feedback,
                'note' => $soumission->note,
                'retard' => $soumission->retard,
                'created_at' => $soumission->created_at
            ];
        });

        return response()->json($soumissions);
    }
}
