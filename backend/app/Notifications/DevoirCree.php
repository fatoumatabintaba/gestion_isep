<?php

namespace App\Notifications;

use App\Models\Devoir;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DevoirCree extends Notification implements ShouldQueue
{
    use Queueable;

    public $devoir;

    public function __construct(Devoir $devoir)
    {
        $this->devoir = $devoir;
    }

    public function via($notifiable)
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable): MailMessage
    {
        // Charger les relations si nécessaire
        if (!$this->devoir->relationLoaded(['uea', 'metier'])) {
            $this->devoir->load(['uea', 'metier']);
        }

        $ueaNom = $this->devoir->uea ? $this->devoir->uea->nom : 'Une UEA';
        $description = $this->devoir->description ?: 'Aucune description';
        $dateLimite = $this->devoir->date_limite ? $this->devoir->date_limite->format('d/m/Y à H:i') : 'Non définie';

        // ✅ Récupérer le nom du métier comme string
        $metierNom = $this->devoir->metier ? $this->devoir->metier->nom : 'Non spécifié';

        return (new MailMessage)
            ->subject("📝 Nouveau devoir : {$ueaNom}")
            ->greeting("Bonjour {$notifiable->name},")
            ->line("Un nouveau devoir a été publié pour l'UEA **{$ueaNom}**.")
            ->line("**Métier :** {$metierNom} - **Année :** {$this->devoir->annee}")
            ->line("**Titre :** {$this->devoir->titre}")
            ->line("**Description :** {$description}")
            ->line("**Date limite :** {$dateLimite}")
            ->line("**Coefficient :** {$this->devoir->coefficient}")
            ->action('Voir le devoir', url('/app/devoirs/' . $this->devoir->id))
            ->line('Merci de le rendre avant la date limite.')
            ->line('Cordialement,')
            ->line('L\'équipe pédagogique');
    }

    public function toArray($notifiable)
    {
        // ✅ Envoyer le nom du métier comme string, pas l'objet complet
        $metierNom = $this->devoir->metier ? $this->devoir->metier->nom : 'Non spécifié';

        return [
            'devoir_id' => $this->devoir->id,
            'titre' => $this->devoir->titre,
            'uea' => $this->devoir->uea?->nom,
            'date_limite' => $this->devoir->date_limite,
            'metier' => $metierNom, // ✅ String, pas objet
            'annee' => $this->devoir->annee ?? '?',
            'type' => 'devoir_cree',
            'message' => "Nouveau devoir : {$this->devoir->titre}",
            'url' => '/app/devoirs/' . $this->devoir->id
        ];
    }

    public function toDatabase($notifiable)
    {
        $metierNom = $this->devoir->metier ? $this->devoir->metier->nom : 'Non spécifié';

        return [
            'devoir_id' => $this->devoir->id,
            'titre' => $this->devoir->titre,
            'uea_nom' => $this->devoir->uea?->nom,
            'enseignant' => $this->devoir->enseignant->name ?? 'Enseignant',
            'date_limite' => $this->devoir->date_limite,
            'metier' => $metierNom, // ✅ String, pas objet
            'annee' => $this->devoir->annee ?? '?',
            'type' => 'devoir_cree',
            'message' => "Nouveau devoir disponible : {$this->devoir->titre}",
            'url' => '/app/devoirs/' . $this->devoir->id,
            'created_at' => now()->toDateTimeString()
        ];
    }
}
