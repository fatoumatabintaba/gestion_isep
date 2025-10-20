<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;

class Apprenant extends Model
{
    use HasFactory, Notifiable;

    // ✅ Champs pouvant être remplis
    protected $fillable = [
        'prenom',
        'nom',
        'matricule',
        'email',
        'telephone',
        'annee',
        'metier_id',
        'user_id',
        'status'
    ];

    // 🔗 Un apprenant appartient à un utilisateur
    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    // 🔗 Un apprenant appartient à un métier
    public function metier()
    {
        return $this->belongsTo(Metier::class);
    }

    // 🔗 Un apprenant a plusieurs présences
    public function presences()
    {
        return $this->hasMany(Presence::class);
    }

    // 🔗 Un apprenant a plusieurs justificatifs
    public function justificatifs()
    {
        return $this->hasMany(Justificatif::class);
    }

    // 🔗 Un apprenant a plusieurs soumissions de devoirs (pas "rendus")
    public function soumissions()
    {
        return $this->hasMany(Soumission::class);
    }

    // 🔔 Canal de notification par email
    public function routeNotificationForMail()
    {
        return $this->email;
    }
}
