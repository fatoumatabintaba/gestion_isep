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
        'metier_id',    // ✅ ASSUREZ-VOUS QUE C'EST LÀ
        'annee',
        'commentaire'       // present / absent / retard / demi-journee
    ];

    // ✅ Date doit être castée
    protected $casts = [
        'date' => 'date'
    ];
    // protected $attributes = [
    //     'metier_id' => 1,
    //     'annee' => 1
    // ];

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
