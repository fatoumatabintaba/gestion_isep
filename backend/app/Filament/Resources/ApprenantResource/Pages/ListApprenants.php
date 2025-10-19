<?php

namespace App\Filament\Resources\ApprenantResource\Pages;

use App\Filament\Resources\ApprenantResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListApprenants extends ListRecords
{
    protected static string $resource = ApprenantResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
