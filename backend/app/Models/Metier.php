<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Metier extends Model
{
    use HasFactory;

    // ✅ Champs pouvant être remplis
    protected $fillable = [
        'nom',
        'description'
    ];

    // 🔗 Un métier a plusieurs UEA (via la table pivot metier_uea)
    public function ueas()
    {
        return $this->belongsToMany(
            Uea::class,       // Modèle cible
            'metier_uea',     // Nom de la table pivot
            'metier_id',      // FK vers Metier
            'uea_id'          // FK vers Uea
        );
    }

    // 🔗 Un métier a plusieurs apprenants
    public function apprenants()
    {
        return $this->hasMany(Apprenant::class);
    }

    // 🔗 Un métier a un responsable
    public function responsableMetier()
    {
        return $this->hasOne(\App\Models\ResponsableMetier::class, 'metier_id');
    }
     public function devoirs()
    {
        return $this->hasMany(Devoir::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

   



}
