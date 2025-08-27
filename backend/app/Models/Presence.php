<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Presence extends Model
{
    protected $fillable = ['seance_id', 'apprenant_id', 'statut'];

    // Une présence appartient à une séance
    public function seance()
    {
        return $this->belongsTo(Seance::class);
    }

    // Une présence appartient à un apprenant
    public function apprenant()
    {
        return $this->belongsTo(Apprenant::class);
    }
}
