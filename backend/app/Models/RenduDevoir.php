<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RenduDevoir extends Model
{
    protected $fillable = ['devoir_id', 'apprenant_id', 'fichier', 'statut'];

    // Un rendu appartient à un devoir
    public function devoir()
    {
        return $this->belongsTo(Devoir::class);
    }

    // Un rendu est fait par un apprenant
    public function apprenant()
    {
        return $this->belongsTo(Apprenant::class);
    }
}
