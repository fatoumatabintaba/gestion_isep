<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ResponsableMetierResource\Pages;
use App\Models\ResponsableMetier;
use App\Models\User;
use App\Models\Metier;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class ResponsableMetierResource extends Resource
{
    protected static ?string $model = ResponsableMetier::class;

    protected static ?string $navigationIcon = 'heroicon-o-user-circle';

    protected static ?string $navigationGroup = 'Gestion Métiers';

    protected static ?int $navigationSort = 1;

    protected static ?string $navigationLabel = 'Responsables de Métier';
    protected static ?string $pluralModelLabel = 'Responsables de Métier';
    protected static ?string $modelLabel = 'Responsable de Métier';

    // 🔐 Accès uniquement pour le chef de département
    public static function canCreate(): bool
    {
        $user = auth()->user();
        return $user && $user->role === 'chef_departement';
    }

    public static function canEdit(\Illuminate\Database\Eloquent\Model $record): bool
    {
        $user = auth()->user();
        return $user && $user->role === 'chef_departement';
    }

    public static function canDelete(\Illuminate\Database\Eloquent\Model $record): bool
    {
        $user = auth()->user();
        return $user && $user->role === 'chef_departement';
    }

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Select::make('user_id')
                    ->label('Enseignant')
                    ->options(
                        User::where('role', 'enseignant')
                            ->pluck('name', 'id')
                    )
                    ->searchable()
                    ->required()
                    ->unique(ignoreRecord: true)
                    ->hint('Sélectionnez un enseignant qui deviendra responsable')
                    ->preload(),

                Forms\Components\Select::make('metier_id')
                    ->label('Métier')
                    ->options(
                        Metier::pluck('nom', 'id')
                    )
                    ->required()
                    ->unique(ignoreRecord: true)
                    ->searchable()
                    ->preload(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('user.name')
                    ->label('Responsable')
                    ->sortable()
                    ->searchable()
                    ->weight('bold')
                    ->color('primary'),

                Tables\Columns\TextColumn::make('metier.nom')
                    ->label('Métier')
                    ->sortable()
                    ->searchable()
                    ->badge()
                    ->color('info'),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Créé le')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            // RelationManagers si besoin
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListResponsableMetiers::route('/'),
            'create' => Pages\CreateResponsableMetier::route('/create'),
            'edit' => Pages\EditResponsableMetier::route('/{record}/edit'),
        ];
    }
}
