<?php

namespace App\Filament\Resources\EnseignantResource\Pages;

use App\Filament\Resources\EnseignantResource;
use Filament\Resources\Pages\EditRecord;

class EditEnseignant extends EditRecord
{
    protected static string $resource = EnseignantResource::class;

    protected static ?string $title = 'Modifier l’enseignant';

    // ✅ Supprime getHeaderActions() si tu veux cacher le bouton "Delete"
    // Ou garde-le vide
    protected function getHeaderActions(): array
    {
        return [
            // Actions\DeleteAction::make(), // ❌ Supprimé
        ];
    }
}
