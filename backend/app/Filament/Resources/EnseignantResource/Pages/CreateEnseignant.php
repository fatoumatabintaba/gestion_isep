<?php

namespace App\Filament\Resources\EnseignantResource\Pages;

use App\Filament\Resources\EnseignantResource;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Support\Facades\Log;

class CreateEnseignant extends CreateRecord
{
    protected static string $resource = EnseignantResource::class;

    protected static ?string $title = 'Créer un enseignant';

    // ✅ Force le rôle AVANT la création
    protected function mutateFormDataBeforeCreate(array $data): array
    {
        Log::info('🔧 Avant création - Données reçues', $data);

        $data['role'] = 'enseignant'; // ✅ Rôle forcé ici

        Log::info('🔧 Rôle forcé à "enseignant"', [
            'email' => $data['email'],
            'role' => $data['role']
        ]);

        return $data;
    }

    // ✅ Redirection fiable vers /edit
    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('edit', ['record' => $this->record]);
    }
}
