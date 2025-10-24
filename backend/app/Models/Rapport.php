<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Rapport extends Model
{
    use HasFactory;

     protected $fillable = [
        'user_id',
        'metier',
        'code_metier',
        'statistiques',
        'periode',
        'justificatifs_traites',
        'statut',
        'date_soumission',
        'date_validation',
        'date_rejet',
        'envoye_administration',
        'date_envoi_administration'
    ];


     protected $casts = [
        'statistiques' => 'array',
        'date_soumission' => 'datetime',
        'date_validation' => 'datetime',
        'date_rejet' => 'datetime',
        'date_envoi_administration' => 'datetime',
        'envoye_administration' => 'boolean'
    ];

     public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

     public function getCoordinateurAttribute(): string
    {
        return $this->user->name ?? 'Utilisateur inconnu';
    }
     public function getCoordinateurEmailAttribute(): string
    {
        return $this->user->email ?? 'Email inconnu';
    }

    public function scopeEnAttente($query)
    {
        return $query->where('statut', 'en_attente');
    }

    public function scopeValides($query)
    {
        return $query->where('statut', 'valide');
    }

    public function scopeRejetes($query)
    {
        return $query->where('statut', 'rejete');
    }
}
