<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Devoir extends Model
{
    protected $fillable = ['titre', 'description', 'uae_id', 'enseignant_id', 'date_limite'];

    protected $casts = [
        'date_limite' => 'datetime'
    ];

    // Un devoir appartient à une UEA
    public function uea()
    {
        return $this->belongsTo(\App\Models\Uea::class);
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
