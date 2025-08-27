<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Support extends Model
{
    protected $fillable = ['uae_id', 'enseignant_id', 'titre', 'description', 'type', 'fichier'];

    // Un support appartient à une UEA
    public function uae()
    {
        return $this->belongsTo(Uea::class);
    }

    // Un support est envoyé par un enseignant (User)
    public function enseignant()
    {
        return $this->belongsTo(\App\Models\User::class, 'enseignant_id');
    }
}
