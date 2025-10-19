<?php

namespace App\Policies;

use App\Models\ResponsableMetier;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ResponsableMetierPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->role === 'chef_departement';
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, ResponsableMetier $responsableMetier): bool
    {
        return $user->role === 'chef_departement';
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->role === 'chef_departement';
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, ResponsableMetier $responsableMetier): bool
    {
        return $user->role === 'chef_departement';
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, ResponsableMetier $responsableMetier): bool
    {
        return $user->role === 'chef_departement';
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, ResponsableMetier $responsableMetier): bool
    {
        //
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, ResponsableMetier $responsableMetier): bool
    {
        //
    }
}
