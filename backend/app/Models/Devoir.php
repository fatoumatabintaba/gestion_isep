<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Devoir extends Model
{
    use HasFactory;

    // ✅ Champs pouvant être remplis
    protected $fillable = [
        'titre',
        'description',
        'uea_id',
        'enseignant_id',
        'date_limite',
        'coefficient',
        'fichier_consigne',
        'ouverte',
       'metier_id',
       'annee',
        'seance_id'
    ];

    // ✅ Cast de la date limite
    protected $casts = [
        'date_limite' => 'datetime',
        'ouverte' => 'boolean'
    ];

    // ✅ Charger automatiquement UEA et enseignant
    protected $with = ['uea', 'enseignant'];

    // 🔗 Un devoir appartient à une UEA
    public function uea()
    {
        return $this->belongsTo(\App\Models\Uea::class, 'uea_id');
    }

    // 🔗 Un devoir est créé par un enseignant (User)
    public function enseignant()
    {
        return $this->belongsTo(\App\Models\User::class, 'enseignant_id');
    }

    // 🔗 Un devoir a plusieurs soumissions
    public function soumissions()
    {
        return $this->hasMany(\App\Models\Soumission::class);
    }

    // 🔗 Accès au nombre de soumissions
    public function getSoumissionsCountAttribute()
    {
        return $this->soumissions()->count();
    }
     public function metier()
    {
        return $this->belongsTo(\App\Models\Metier::class, 'metier_id');
    }
    
}
