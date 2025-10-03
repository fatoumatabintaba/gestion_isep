<?php

namespace App\Filament\Resources;

// ✅ Tous les 'use' en haut, PAS dans la classe
use App\Filament\Resources\UserResource\Pages;
use App\Models\User;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Model;

class UserResource extends Resource
{
    protected static ?string $model = User::class;
    protected static ?string $navigationIcon = 'heroicon-o-users';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                \Filament\Forms\Components\TextInput::make('name')
                    ->required()
                    ->maxLength(255),

                \Filament\Forms\Components\TextInput::make('email')
                    ->email()
                    ->required()
                    ->unique(ignoreRecord: true)
                    ->maxLength(255),

                \Filament\Forms\Components\Select::make('role')
                    ->options([
                        'coordinateur' => 'Coordinateur',
                        'chef_departement' => 'Chef de Département'

                    ])
                    ->required(),

                \Filament\Forms\Components\TextInput::make('password')
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
                \Filament\Tables\Columns\TextColumn::make('name')->sortable()->searchable(),
                \Filament\Tables\Columns\TextColumn::make('email')->sortable()->searchable(),
                \Filament\Tables\Columns\TextColumn::make('role')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                    'coordinateur' => 'warning',
                    'chef_departement' => 'danger',
                    'admin' => 'secondary',
                    'enseignant' => 'info',
                    'apprenant' => 'success',
                    default => 'gray', // Pour tout rôle inconnu
                })
                    ->sortable(),
                \Filament\Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable(),
            ])
            ->actions([
                \Filament\Tables\Actions\EditAction::make(),
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

    public static function canCreate(): bool
    {
        $user = auth()->user();
        return $user && ($user->name === 'binta' || $user->role === 'admin');
    }

    public static function canEdit(Model $record): bool
    {
        $user = auth()->user();
        return $user && ($user->name === 'binta' || $user->role === 'admin');
    }

    public static function canDelete(Model $record): bool
    {
        $user = auth()->user();
        return $user && ($user->name === 'binta' || $user->role === 'admin');
    }
}
