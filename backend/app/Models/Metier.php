<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Metier extends Model
{
    protected $fillable = ['nom'];

    // un metier suit plusieurs UEAs
    public function ueas() {
        return $this->belongsToMany(Uea::class, 'metier_uea');
    }

    // un metier peut avoir plusieurs apprenants
    public function apprenants(){
        return $this->hasMany(Apprenant::class);
    }
}
