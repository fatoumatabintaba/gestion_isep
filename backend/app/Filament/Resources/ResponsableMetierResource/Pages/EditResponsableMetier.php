<?php

namespace App\Filament\Resources\ResponsableMetierResource\Pages;

use App\Filament\Resources\ResponsableMetierResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditResponsableMetier extends EditRecord
{
    protected static string $resource = ResponsableMetierResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
