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
        'nom', // ✅ AJOUTER 'nom' ICI
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

    protected $casts = ['date' => 'date'];

    public function uea()
    {
        return $this->belongsTo(Uea::class);
    }

<<<<<<< HEAD

=======
>>>>>>> d1afd34fa47113daf1349c5a2f554532664d685f
    // Une séance est animée par un enseignant (User)
    public function enseignant()
    {
        return $this->belongsTo(\App\Models\User::class, 'enseignant_id');
    }

    // Une séance a plusieurs présences
    public function presences()
    {
        return $this->hasMany(Presence::class);
    }

    // Une séance peut avoir plusieurs justificatifs
    public function justificatifs()
    {
        return $this->hasMany(Justificatif::class);
    }

    public function metiers()
    {
        return $this->belongsToMany(Metier::class, 'uea_metier');
    }
<<<<<<< HEAD
    public function getUeaNomAttribute()
{
    return $this->uea_nom ?? 'UEA non spécifiée';
}





public function metier()
{
    return $this->belongsTo(Metier::class);
}
=======
>>>>>>> d1afd34fa47113daf1349c5a2f554532664d685f
}
