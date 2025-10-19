<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Presence extends Model
{
    use HasFactory;

    // ✅ Champs pouvant être remplis
    protected $fillable = [
        'seance_id',
        'apprenant_id',
        'date',       // ✅ Ajout : permet de gérer plusieurs jours
        'statut',
        'commentaire'       // present / absent / retard / demi-journee
    ];

    // ✅ Date doit être castée
    protected $casts = [
        'date' => 'date'
    ];

    // 🔗 Une présence appartient à une séance
    public function seance()
    {
        return $this->belongsTo(Seance::class);
    }

    // 🔗 Une présence concerne un apprenant
    public function apprenant()
    {
        return $this->belongsTo(Apprenant::class);
    }
}
