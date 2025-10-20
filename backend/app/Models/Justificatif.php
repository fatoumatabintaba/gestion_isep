<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Justificatif extends Model
{
    use HasFactory;

    protected $fillable = [
        'apprenant_id',
        'seance_id',
        'fichier',
        'motif',
        'statut',
        'valideur_id'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Relations
    public function apprenant()
    {
        return $this->belongsTo(Apprenant::class);
    }

    public function seance()
    {
        return $this->belongsTo(Seance::class);
    }

    public function valideur()
    {
        return $this->belongsTo(User::class, 'valideur_id');
    }

    // Scopes
    public function scopeEnAttente($query)
    {
        return $query->where('statut', 'en_attente');
    }

    public function scopeValides($query)
    {
        return $query->where('statut', 'valide');
    }

    public function scopeRefuses($query)
    {
        return $query->where('statut', 'refuse');
    }

    // Accessors
    public function getStatutLibelleAttribute()
    {
        $statuts = [
            'en_attente' => 'En attente',
            'valide' => 'Validé',
            'refuse' => 'Refusé'
        ];

        return $statuts[$this->statut] ?? 'Inconnu';
    }

    public function getFichierUrlAttribute()
    {
        return $this->fichier ? asset('storage/' . $this->fichier) : null;
    }

    public function getNomFichierAttribute()
    {
        return $this->fichier ? basename($this->fichier) : null;
    }
}
