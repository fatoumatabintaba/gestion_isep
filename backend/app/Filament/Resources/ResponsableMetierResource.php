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
use Illuminate\Database\Eloquent\Model;

class ResponsableMetierResource extends Resource
{
    protected static ?string $model = ResponsableMetier::class;

    protected static ?string $navigationIcon = 'heroicon-o-user-circle';

    protected static ?string $navigationGroup = 'Gestion Métiers';

    protected static ?int $navigationSort = 1;

    protected static ?string $navigationLabel = 'Responsables de Métier';
    protected static ?string $pluralModelLabel = 'Responsables de Métier';
    protected static ?string $modelLabel = 'Responsable de Métier';

    // 🔐 AJOUTE CETTE MÉTHODE POUR AUTORISER L'ACCÈS À LA LISTE
    public static function canViewAny(): bool
    {
        $user = auth()->user();
        return $user && in_array($user->role, ['admin', 'chef_departement', 'coordinateur']);
    }

    // 🔐 Accès pour la création
    public static function canCreate(): bool
    {
        $user = auth()->user();
        return $user && in_array($user->role, ['admin', 'chef_departement', 'coordinateur']);
    }

    // 🔐 Accès pour l'édition
    public static function canEdit(Model $record): bool
    {
        $user = auth()->user();
        return $user && in_array($user->role, ['admin', 'chef_departement', 'coordinateur']);
    }

    // 🔐 Accès pour la suppression
    public static function canDelete(Model $record): bool
    {
        $user = auth()->user();
        return $user && in_array($user->role, ['admin', 'chef_departement', 'coordinateur']);
    }

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Select::make('user_id')
                    ->label('Enseignant')
                    ->options(
                        User::where('role', 'enseignant')
                            ->whereDoesntHave('responsableMetier') // ✅ Empêche les doublons
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
                        Metier::whereDoesntHave('responsableMetier') // ✅ Empêche les doublons
                            ->pluck('nom', 'id')
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
