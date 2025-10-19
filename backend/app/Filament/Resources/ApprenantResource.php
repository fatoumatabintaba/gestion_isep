<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ApprenantResource\Pages;
use App\Models\Apprenant;
use App\Models\User;
use App\Notifications\CompteValide; // ✅ Importe la notification
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;
use Filament\Forms\Components\Select;


class ApprenantResource extends Resource
{
    protected static ?string $model = Apprenant::class;

    protected static ?string $navigationIcon = 'heroicon-o-user-group';
    protected static ?string $navigationLabel = 'Apprenants';
    protected static ?string $pluralModelLabel = 'Apprenants';
    protected static ?string $modelLabel = 'Apprenant';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Select::make('user_id')
                    ->relationship('user', 'name')
                    ->label('Utilisateur')
                    ->required()
                    ->searchable(),

                Forms\Components\TextInput::make('matricule')
                    ->label('Matricule')
                    ->maxLength(255),

                Forms\Components\TextInput::make('nom')
                    ->label('Nom')
                    ->required()
                    ->maxLength(255),

                Forms\Components\TextInput::make('prenom')
                    ->label('Prénom')
                    ->required() // Champ prénom rendu obligatoire
                    ->maxLength(255),

                Forms\Components\TextInput::make('email')
                    ->label('Email')
                    ->email()
                    ->maxLength(255),

                Forms\Components\Select::make('metier_id')
                    ->relationship('metier', 'nom')
                    ->label('Métier')
                    ->required()
                    ->searchable(),

                Forms\Components\TextInput::make('annee')
                    ->label('Année')
                    ->numeric()
                    ->minValue(1)
                    ->maxValue(2)
                    ->required(),

                Forms\Components\Select::make('status')
                    ->label('Statut')
                    ->options([
                        'en_attente' => 'En attente',
                        'valide' => 'Validé',
                    ])
                    ->required(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('user.name')
                    ->label('Nom utilisateur')
                    ->sortable()
                    ->searchable(),

                Tables\Columns\TextColumn::make('matricule')
                    ->label('Matricule')
                    ->sortable()
                    ->searchable(),

                Tables\Columns\TextColumn::make('metier.nom')
                    ->label('Métier')
                    ->sortable()
                    ->searchable(),

                Tables\Columns\TextColumn::make('annee')
                    ->label('Année')
                    ->sortable(),

                Tables\Columns\BadgeColumn::make('status')
                    ->label('Statut')
                    ->colors([
                        'warning' => 'en_attente',
                        'success' => 'valide',
                        'danger' => 'rejete'
                    ])
                    ->formatStateUsing(fn ($state) => match ($state) {
                        'en_attente' => 'En attente',
                        'valide' => 'Validé',
                        'rejete' => 'Rejeté',
                        default => ucfirst($state),
                    }),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->label('Statut')
                    ->options([
                        'en_attente' => 'En attente',
                        'valide' => 'Validé',
                        'rejete' => 'Rejeté'
                    ]),

                Tables\Filters\SelectFilter::make('metier_id')
                    ->label('Métier')
                    ->relationship('metier', 'nom'),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),
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
            // Ajouter des gestionnaires de relation si besoin
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListApprenants::route('/'),
            'create' => Pages\CreateApprenant::route('/create'),
            'edit' => Pages\EditApprenant::route('/{record}/edit'),
        ];
    }
    // Ajoute cette méthode pour filtrer uniquement les utilisateurs avec role = 'apprenant'
public static function getEloquentQuery(): Builder
{
    return parent::getEloquentQuery()
        ->whereHas('user', fn ($query) => $query->where('role', 'apprenant'));
}
}
