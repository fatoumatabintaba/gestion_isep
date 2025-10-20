<?php

namespace App\Models;


use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Uea extends Model
{
    protected $table = 'ueas'; // ✅ Bon nom
    protected $fillable = ['code', 'nom', 'annee'];


    // une UEA appartient à plusieurs métiers
    public function metiers()
    {
        return $this->belongsToMany(Metier::class, 'metier_uea');
    }

    // une UEA a plusieurs séances
    public function seances(){
        return $this->hasMany(Seance::class);
    }
        

    // une UEA a plusieurs supports
    public function supports(){
        return $this->hasMany(Support::class);
    }

    // une UEA a plusieurs devoirs
    public function devoirs(){
        return $this->hasMany(Devoir::class);
    }


}
