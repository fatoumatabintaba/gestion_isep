<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ResponsableMetier extends Model
{
    use HasFactory;
     protected $fillable = ['user_id', 'metier_id'];
       public function user()
    {
        return $this->belongsTo(\App\Models\User::class, 'user_id');
    }

    public function metier()
    {
        return $this->belongsTo(\App\Models\Metier::class, 'metier_id');
    }
}
