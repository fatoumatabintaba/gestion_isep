<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CoursEnLigneProgramme extends Notification
{
    use Queueable;
    public $seance;

    /**
     * Create a new notification instance.
     */
    public function __construct($seance)
    {
        $this->seance = $seance;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
        ->subject("🌐 Cours en ligne programmé : {$this->seance->uae->nom}")
        ->greeting("Bonjour {$notifiable->prenom},")
        ->line("Un nouveau cours en ligne vient d'être programmé.")
        ->line("**UEA :** {$this->seance->uae->nom}")
        ->line("**Date :** {$this->seance->date} à {$this->seance->heure_debut}")
        ->action('Rejoindre le cours', $this->seance->lien_reunion)
        ->salutation("À bientôt !");
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}
