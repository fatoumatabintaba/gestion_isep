<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Justificatif;
use App\Models\User;
use App\Models\Seance;
use App\Models\Apprenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class JustificatifController extends Controller
{
    /**
     * Déposer un justificatif
     */
    public function store(Request $request)
    {
        $request->validate([
            'seance_id' => 'required|exists:seances,id',
            'motif' => 'required|string|max:500',
            'fichier' => 'required|file|max:2048|mimes:pdf,jpg,jpeg,png'
        ]);

        // Vérifier que l'utilisateur est un apprenant
        if ($request->user()->role !== 'apprenant') {
            return response()->json(['message' => 'Accès refusé. Seuls les apprenants peuvent déposer des justificatifs.'], 403);
        }

        // Vérifier que l'apprenant existe
        $apprenant = $request->user()->apprenant;
        if (!$apprenant) {
            return response()->json(['message' => 'Profil apprenant non trouvé.'], 404);
        }

        // ✅ VÉRIFICATION : L'apprenant doit appartenir à un des métiers autorisés (DWM, RT, ASRI)
        $metiersAutorises = ['DWM', 'RT', 'ASRI'];
        if (!in_array($apprenant->metier, $metiersAutorises)) {
            return response()->json([
                'message' => 'Accès refusé. Votre métier n\'est pas autorisé à déposer des justificatifs.',
                'votre_metier' => $apprenant->metier
            ], 403);
        }

        // ✅ VÉRIFICATION : L'apprenant doit être en année 1 ou 2
        if (!in_array($apprenant->annee, ['1', '2'])) {
            return response()->json([
                'message' => 'Accès refusé. Votre année n\'est pas valide.',
                'votre_annee' => $apprenant->annee
            ], 403);
        }

        $data = $request->only(['seance_id', 'motif']);
        $data['apprenant_id'] = $apprenant->id;

        // Gérer le fichier
        if ($request->hasFile('fichier')) {
            $data['fichier'] = $request->file('fichier')->store('justificatifs', 'public');
        }

        $justificatif = Justificatif::create($data);

        return response()->json([
            'message' => 'Justificatif déposé avec succès',
            'justificatif' => $justificatif->load('apprenant.user', 'seance.uea')
        ], 201);
    }

    /**
     * Récupérer les justificatifs pour un métier spécifique (avec filtre année)
     */
    public function justificatifsParMetier($metierId, Request $request)
    {
        $user = auth()->user();

        if ($user->role !== 'responsable_metier') {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $annee = $request->query('annee');

        $query = Justificatif::whereHas('apprenant', function($query) use ($metierId, $annee) {
            // ✅ Utilise le champ 'metier' de l'apprenant (string) au lieu de 'metier_id'
            $query->where('metier', $this->getMetierName($metierId));

            if ($annee && in_array($annee, ['1', '2'])) {
                $query->where('annee', $annee);
            }
        })
        ->with(['apprenant.user', 'seance.uea', 'valideur'])
        ->orderBy('created_at', 'desc');

        $justificatifs = $query->get();

        return response()->json([
            'justificatifs' => $justificatifs,
            'filters' => [
                'metier' => $this->getMetierName($metierId),
                'annee' => $annee,
                'total' => $justificatifs->count()
            ]
        ]);
    }

    /**
     * Récupérer les justificatifs en attente pour un métier spécifique (avec filtre année)
     */
    public function justificatifsEnAttenteParMetier($metierId, Request $request)
    {
        $user = auth()->user();

        if ($user->role !== 'responsable_metier') {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $annee = $request->query('annee');

        $query = Justificatif::whereHas('apprenant', function($query) use ($metierId, $annee) {
            // ✅ Utilise le champ 'metier' de l'apprenant (string)
            $query->where('metier', $this->getMetierName($metierId));

            if ($annee && in_array($annee, ['1', '2'])) {
                $query->where('annee', $annee);
            }
        })
        ->where('statut', 'en_attente')
        ->with(['apprenant.user', 'seance.uea'])
        ->orderBy('created_at', 'asc');

        $justificatifs = $query->get();

        return response()->json([
            'justificatifs' => $justificatifs,
            'filters' => [
                'metier' => $this->getMetierName($metierId),
                'annee' => $annee,
                'total' => $justificatifs->count()
            ]
        ]);
    }

    /**
     * Récupérer tous les justificatifs avec filtres
     */
    public function tousJustificatifs(Request $request)
    {
        $user = $request->user();
        $allowedRoles = ['coordinateur', 'admin', 'chef_departement', 'assistant', 'responsable_metier'];

        if (!in_array($user->role, $allowedRoles)) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $metier = $request->query('metier'); // Maintenant c'est le nom du métier (string)
        $annee = $request->query('annee');

        $query = Justificatif::with(['apprenant.user', 'seance.uea', 'valideur']);

        // ✅ FILTRES PAR MÉTIER (nom) ET ANNÉE
        if ($metier) {
            $query->whereHas('apprenant', function($q) use ($metier) {
                $q->where('metier', $metier);
            });
        }

        if ($annee && in_array($annee, ['1', '2'])) {
            $query->whereHas('apprenant', function($q) use ($annee) {
                $q->where('annee', $annee);
            });
        }

        $justificatifs = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'justificatifs' => $justificatifs,
            'filters' => [
                'metier' => $metier,
                'annee' => $annee,
                'total' => $justificatifs->count()
            ]
        ]);
    }

    /**
     * Récupérer les justificatifs en attente avec filtres
     */
    public function justificatifsEnAttente(Request $request)
    {
        $user = $request->user();
        $allowedRoles = ['coordinateur', 'admin', 'chef_departement', 'assistant', 'responsable_metier'];

        if (!in_array($user->role, $allowedRoles)) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $metier = $request->query('metier');
        $annee = $request->query('annee');

        $query = Justificatif::where('statut', 'en_attente')
            ->with(['apprenant.user', 'seance.uea']);

        // ✅ FILTRES PAR MÉTIER (nom) ET ANNÉE
        if ($metier) {
            $query->whereHas('apprenant', function($q) use ($metier) {
                $q->where('metier', $metier);
            });
        }

        if ($annee && in_array($annee, ['1', '2'])) {
            $query->whereHas('apprenant', function($q) use ($annee) {
                $q->where('annee', $annee);
            });
        }

        $justificatifs = $query->orderBy('created_at', 'asc')->get();

        return response()->json([
            'justificatifs' => $justificatifs,
            'filters' => [
                'metier' => $metier,
                'annee' => $annee,
                'total' => $justificatifs->count()
            ]
        ]);
    }

    /**
     * Helper pour convertir l'ID métier en nom
     */
    private function getMetierName($metierId)
    {
        $metiers = [
            1 => 'DWM',
            2 => 'RT',
            3 => 'ASRI'
        ];

        return $metiers[$metierId] ?? 'Inconnu';
    }

    // ... (les autres méthodes restent inchangées : index, updateStatut, mesJustificatifs, download, show, destroy)
}
