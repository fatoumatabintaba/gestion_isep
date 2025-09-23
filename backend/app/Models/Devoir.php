<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use \App\Models\Uea;
use App\Models\RenduDevoir;

class Devoir extends Model
{
    use HasFactory;
    protected $fillable = ['titre', 'description', 'uea_id', 'enseignant_id', 'date_limite','coefficient',
    'fichier_consigne','ouverte','seance_id'];

    protected $casts = [
        'date_limite' => 'datetime'
    ];
    // Dans le modèle
    protected $with = ['uea', 'enseignant'];

    // Un devoir appartient à une UEA

    // Dans Devoir.php
    public function uea()
    {
        return $this->belongsTo(Uea::class, 'uea_id');
    }


    // Un devoir est créé par un enseignant (User)
    public function enseignant()
    {
        return $this->belongsTo(\App\Models\User::class, 'enseignant_id');
    }

    // Un devoir a plusieurs rendus
    public function rendus()
    {
        return $this->hasMany(RenduDevoir::class);
    }


}
