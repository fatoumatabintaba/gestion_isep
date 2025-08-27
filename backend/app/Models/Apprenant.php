<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Uea; // Optionnel, si utilisé
use App\Models\User;
use App\Models\Metier;
use App\Models\Presence;
use App\Models\Justificatif;
use App\Models\RenduDevoir;

class Apprenant extends Model
{
    protected $fillable = ['matricule', 'nom', 'prenom', 'email', 'telephone',
        'annee', 'metier_id', 'user_id'];
    // un apprenant appartient a un utilisateur
    public function users(){
        return $this->belongsTo(\App\Models\User::class);
    }
    // un apprenant appartient a un metier
    public function metier()
    {
        return $this->belongsTo(Metier::class);
    }

    // un apprenant a plusieurs presences
    public function presences(){
        return $this->hasMany(Presence::class);
    }

    // Un apprenant a plusieurs justificatifs
    public function justificatifs()
    {
        return $this->hasMany(Justificatif::class);
    }

     // Un apprenant a plusieurs rendus de devoirs
    public function renduDevoirs()
    {
        return $this->hasMany(RenduDevoir::class);
    }

    public function user()
        {
            return $this->belongsTo(\App\Models\User::class, 'user_id');
        }
}
