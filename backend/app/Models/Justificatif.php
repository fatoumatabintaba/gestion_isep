<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Justificatif extends Model
{
    protected $fillable = ['apprenant_id', 'fichier', 'motif', 'statut', 'valideur_id', 'seance_id'];

    // Un justificatif appartient à un apprenant
    public function apprenant()
    {
        return $this->belongsTo(Apprenant::class);
    }

    // Un justificatif est validé par un coordinateur ou assistant (User)
    public function valideur()
    {
        return $this->belongsTo(\App\Models\User::class, 'valideur_id');
    }

    // Un justificatif concerne une séance
    public function seance()
    {
        return $this->belongsTo(Seance::class);
    }
}
