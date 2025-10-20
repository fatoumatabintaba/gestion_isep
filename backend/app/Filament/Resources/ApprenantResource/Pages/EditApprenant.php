<?php

namespace App\Filament\Resources\ApprenantResource\Pages;

use App\Filament\Resources\ApprenantResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditApprenant extends EditRecord
{
    protected static string $resource = ApprenantResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
