<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

// App\Models\Metier
class Metier extends Model
{
    protected $fillable = ['nom', 'description'];

    public function ueas()
    {
        return $this->belongsToMany(Uea::class);
    }

    public function apprenants()
    {
        return $this->hasMany(Apprenant::class);
    }
}
