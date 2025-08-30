<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Devoir;
use App\Models\Apprenant;

class Soumission extends Model
{
     protected $fillable = [
        'devoir_id',
        'apprenant_id',
        'fichier_rendu',
        'commentaire',
        'note',
        'feedback',
        'fichier_corrige',
        'retard'
    ];

    // Un lien vers le devoir
    public function devoir()
    {
        return $this->belongsTo(Devoir::class);
    }

     // Un lien vers l'apprenant
    public function apprenant()
    {
        return $this->belongsTo(Apprenant::class);
    }

    // Optionnel : accesseur pour savoir si c’est en retard
    public function getStatutSoumissionAttribute()
    {
        return $this->retard ? 'En retard' : 'À temps';
    }
}
