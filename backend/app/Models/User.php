<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

// ✅ Imports Filament
use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;

// ✅ Imports nécessaires
use App\Models\Apprenant;
use App\Models\Metier;
use App\Models\ResponsableMetier;
use App\Notifications\WelcomeEnseignant;

class User extends Authenticatable implements FilamentUser
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'prenom',
        'email',
        'password',
        'role',
        'metier_id',
        'annee',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($user) {
            Log::info('🔧 Création utilisateur - AVANT sauvegarde', [
                'email' => $user->email,
                'role' => $user->role ?? 'non défini',
                'password_present' => !empty($user->password),
            ]);

            if (!$user->password) {
                $tempPassword = Str::random(8);
                $user->password = bcrypt($tempPassword);

                // Stocker le mot de passe temporaire pour l'envoyer plus tard
                $user->temp_password = $tempPassword;
            }
        });

        static::created(function ($user) {
            Log::info('✅ Utilisateur créé avec succès', [
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
            ]);

            // ✅ Envoyer l'email APRÈS la création (et en file d'attente)
            if ($user->role === 'enseignant' && isset($user->temp_password)) {
                // ✅ Utiliser dispatch pour mettre en file d'attente
                dispatch(function () use ($user) {
                    $user->notify(new WelcomeEnseignant($user->temp_password));
                })->delay(now()->addSeconds(5)); // Petit délai pour être sûr
            }

            if ($user->role === 'apprenant') {
                Apprenant::create([
                    'user_id' => $user->id,
                    'prenom' => $user->prenom,
                    'nom' => $user->name,
                    'email' => $user->email,
                    'matricule' => self::generateMatricule(),
                    'metier_id' => $user->metier_id,
                    'annee' => $user->annee,
                ]);
            }
        });
    }

    private static function generateMatricule()
    {
        do {
            $matricule = 'APP-' . strtoupper(Str::random(6));
        } while (Apprenant::where('matricule', $matricule)->exists());

        return $matricule;
    }

    // 🔗 Relations
    public function apprenant()
    {
        return $this->hasOne(Apprenant::class);
    }

    public function responsableMetier()
    {
        return $this->hasOne(ResponsableMetier::class, 'user_id');
    }

    public function metier()
    {
        return $this->belongsTo(Metier::class);
    }

    // ✅ Filament access control
    public function canAccessPanel(Panel $panel): bool
    {
        // Autoriser uniquement admin et chef de département
        return in_array($this->role, ['admin', 'chef_departement']);
    }

    public function canAccessFilament(): bool
    {
        \Log::info('🧭 Vérification accès Filament', [
            'email' => $this->email,
            'role' => $this->role,
        ]);
        return in_array($this->role, ['admin', 'chef_departement']);
    }
<<<<<<< HEAD

    public function user()
{
    return $this->belongsTo(User::class);
}


=======
>>>>>>> d1afd34fa47113daf1349c5a2f554532664d685f
}
