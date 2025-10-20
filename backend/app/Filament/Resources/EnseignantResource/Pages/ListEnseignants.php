<?php

namespace App\Filament\Resources\EnseignantResource\Pages;

use App\Filament\Resources\EnseignantResource;
use App\Notifications\WelcomeEnseignant;
use Filament\Resources\Pages\ListRecords;
use Filament\Tables\Actions\Action;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ListEnseignants extends ListRecords
{
    protected static string $resource = EnseignantResource::class;

    protected static ?string $title = 'Liste des enseignants';
    protected static ?string $navigationLabel = 'Enseignants';

    protected function getHeaderActions(): array
    {
        return [
            \Filament\Actions\CreateAction::make(),
        ];
    }

    // ✅ CORRECTION : Utiliser configureTable() au lieu de getTableActions()
    protected function configureTable(\Filament\Tables\Table $table): \Filament\Tables\Table
    {
        // Récupérer la table configurée dans la Resource
        $table = parent::configureTable($table);

        // Ajouter notre action supplémentaire aux actions existantes
        return $table->actions([
            ...$table->getActions(), // Garder toutes les actions existantes (Edit, etc.)
            Action::make('sendCredentials')
                ->label('Envoyer identifiants')
                ->icon('heroicon-s-envelope')
                ->color('success')
                ->action(function ($record) {
                    $this->envoyerIdentifiants($record);
                })
                ->requiresConfirmation()
                ->modalHeading('Envoyer les identifiants')
                ->modalDescription('Êtes-vous sûr de vouloir envoyer les identifiants de connexion à cet enseignant ? Un nouveau mot de passe temporaire sera généré.')
                ->modalSubmitActionLabel('Oui, envoyer'),
        ]);
    }

    protected function envoyerIdentifiants($enseignant)
    {
        try {
            // Générer un nouveau mot de passe temporaire
            $nouveauPassword = Str::random(10);

            Log::info("🔐 Génération nouveau mot de passe pour enseignant", [
                'enseignant_id' => $enseignant->id,
                'email' => $enseignant->email
            ]);

            // Mettre à jour le mot de passe
            $enseignant->update([
                'password' => bcrypt($nouveauPassword)
            ]);

            // ✅ ENVOYER EN FILE D'ATTENTE - Plus de timeout !
            dispatch(function () use ($enseignant, $nouveauPassword) {
                Log::info("📧 Envoi email en file d'attente", [
                    'enseignant_id' => $enseignant->id,
                    'email' => $enseignant->email
                ]);

                $enseignant->notify(new WelcomeEnseignant($nouveauPassword));

                Log::info("✅ Email envoyé avec succès", [
                    'enseignant_id' => $enseignant->id
                ]);
            });

            // Message de succès immédiat
            $this->notify('success', 'Les identifiants sont en cours d\'envoi par email');

        } catch (\Exception $e) {
            Log::error('❌ Erreur envoi identifiants', [
                'enseignant_id' => $enseignant->id,
                'error' => $e->getMessage()
            ]);

            $this->notify('danger', 'Erreur lors de l\'envoi: ' . $e->getMessage());
        }
    }
}
