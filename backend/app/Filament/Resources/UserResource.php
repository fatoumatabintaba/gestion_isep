<?php

namespace App\Filament\Resources;

use App\Filament\Resources\UserResource\Pages;
use App\Models\User;
use App\Models\Metier;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Model;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Select;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Actions\EditAction;

class UserResource extends Resource
{
    protected static ?string $model = User::class;
    protected static ?string $navigationIcon = 'heroicon-o-users';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                TextInput::make('name')
                    ->required()
                    ->maxLength(255),

                TextInput::make('prenom')
                    ->required()
                    ->maxLength(255),

                TextInput::make('email')
                    ->email()
                    ->required()
                    ->unique(ignoreRecord: true)
                    ->maxLength(255),

                Select::make('role')
                    ->options([
                        'apprenant' => 'Apprenant',
                        'enseignant' => 'Enseignant',
                        'coordinateur' => 'Coordinateur',
                        'chef_departement' => 'Chef de département',
                    ])
                    ->required()
                    ->reactive(), // ✅ Important pour les conditions

                // ✅ CORRIGÉ : CHAMP ANNÉE UNIQUEMENT POUR LES APPRENANTS
                Select::make('annee')
                    ->label('Année scolaire')
                    ->options([
                        '1A' => '1ère Année',
                        '2A' => '2ème Année',
                        '3A' => '3ème Année',
                        '4A' => '4ème Année',
                        '5A' => '5ème Année',
                    ])
                    ->required(fn ($get) => $get('role') === 'apprenant') // ✅ SEULEMENT pour apprenants
                    ->hidden(fn ($get) => $get('role') !== 'apprenant')   // ✅ CACHÉ pour autres rôles
                    ->placeholder('Sélectionnez l\'année')
                    ->searchable(),

                TextInput::make('password')
                    ->password()
                    ->dehydrateStateUsing(fn ($state) => \Hash::make($state))
                    ->dehydrated(fn ($state) => filled($state))
                    ->required(fn (string $context): bool => $context === 'create'),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')->sortable()->searchable(),
                TextColumn::make('prenom')->sortable()->searchable(),
                TextColumn::make('email')->sortable()->searchable(),
                TextColumn::make('role')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'coordinateur' => 'warning',
                        'chef_departement' => 'danger',
                        'admin' => 'secondary',
                        'enseignant' => 'info',
                        'apprenant' => 'success',
                        default => 'gray',
                    })
                    ->sortable(),
                // ✅ CORRIGÉ : COLONNE ANNÉE AVEC VALEUR PAR DÉFAUT
                TextColumn::make('annee')
                    ->label('Année')
                    ->formatStateUsing(fn ($state) => $state ?: 'N/A')
                    ->badge()
                    ->color(fn ($state) => $state ? 'primary' : 'gray')
                    ->sortable()
                    ->searchable(),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable(),
            ])
            ->actions([
                EditAction::make(),
            ])
            ->bulkActions([
                \Filament\Tables\Actions\BulkActionGroup::make([
                    \Filament\Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListUsers::route('/'),
            'create' => Pages\CreateUser::route('/create'),
            'edit' => Pages\EditUser::route('/{record}/edit'),
        ];
    }
    public static function canAccess(): bool
{
    $user = auth()->user();
    return $user && ($user->name === 'binta' || $user->role === 'admin');
}

    public static function canCreate(): bool
    {
        $user = auth()->user();
        return $user && in_array($user->role, ['admin', 'chef_departement', 'coordinateur']);
    }

    public static function canEdit(Model $record): bool
    {
        $user = auth()->user();
        return $user && in_array($user->role, ['admin', 'chef_departement', 'coordinateur']);
    }

    public static function canDelete(Model $record): bool
    {
        $user = auth()->user();
        return $user && in_array($user->role, ['admin', 'chef_departement', 'coordinateur']);
    }
}
