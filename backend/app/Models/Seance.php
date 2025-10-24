<?php
namespace App\Models;

use App\Models\Uea;
use App\Models\Presence;
use App\Models\Justificatif;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Seance extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'uea_id',
        'uea_nom',
        'metier_id',
        'annee',
        'enseignant_id',
        'salle',
        'date',
        'heure_debut',
        'heure_fin',
        'duree',
        'type',
        'lien_reunion',
        'statut'
    ];

    protected $casts = [
        'date' => 'date'
    ];

    // Relations
    public function uea()
    {
        return $this->belongsTo(Uea::class);
    }

    public function enseignant()
    {
        return $this->belongsTo(\App\Models\User::class, 'enseignant_id');
    }

    public function presences()
    {
        return $this->hasMany(Presence::class);
    }

    public function justificatifs()
    {
        return $this->hasMany(Justificatif::class);
    }

    public function metiers()
    {
        return $this->belongsToMany(Metier::class, 'uea_metier');
    }

    public function metier()
    {
        return $this->belongsTo(Metier::class);
    }

    // Accesseurs
    public function getUeaNomAttribute()
    {
        return $this->attributes['uea_nom'] ?? 'UEA non spécifiée';
    }

    // ✅ AJOUT : Méthode statique pour récupérer les cours en ligne
    public static function getCoursEnLigneByMetierAnnee($nomMetier, $annee)
    {
        return self::where('type', 'en_ligne')
            ->where(function($query) use ($nomMetier) {
                $query->whereHas('metier', function($q) use ($nomMetier) {
                    $q->where('nom', $nomMetier)
                      ->orWhere('code', $nomMetier);
                })
                ->orWhere('salle', 'LIKE', "%{$nomMetier}%");
            })
            ->where('annee', $annee)
            ->with(['uea', 'enseignant', 'metier'])
            ->orderBy('date', 'desc')
            ->orderBy('heure_debut', 'asc')
            ->get()
            ->map(function ($cours) {
                return [
                    'id' => $cours->id,
                    'nom' => $cours->nom,
                    'description' => $cours->uea_nom,
                    'date' => $cours->date,
                    'heure_debut' => $cours->heure_debut,
                    'heure_fin' => $cours->heure_fin,
                    'lien_reunion' => $cours->lien_reunion,
                    'plateforme' => self::detectPlateforme($cours->lien_reunion),
                    'uea_nom' => $cours->uea_nom,
                    'enseignant' => $cours->enseignant ? [
                        'name' => $cours->enseignant->name,
                        'email' => $cours->enseignant->email
                    ] : null,
                    'metier' => $cours->metier ? [
                        'nom' => $cours->metier->nom,
                        'code' => $cours->metier->code
                    ] : null
                ];
            });
    }

    // ✅ AJOUT : Détecter la plateforme depuis l'URL
    private static function detectPlateforme($lienReunion)
    {
        if (!$lienReunion) return 'autre';

        if (stripos($lienReunion, 'meet.google.com') !== false) {
            return 'google_meet';
        }
        if (stripos($lienReunion, 'zoom.us') !== false) {
            return 'zoom';
        }
        if (stripos($lienReunion, 'teams.microsoft.com') !== false) {
            return 'teams';
        }

        return 'autre';
    }

    // ✅ AJOUT : Scope pour filtrer facilement les cours en ligne
    public function scopeCoursEnLigne($query)
    {
        return $query->where('type', 'en_ligne');
    }

    public function scopeByMetier($query, $metierId)
    {
        return $query->where('metier_id', $metierId);
    }

    public function scopeByAnnee($query, $annee)
    {
        return $query->where('annee', $annee);
    }
}
