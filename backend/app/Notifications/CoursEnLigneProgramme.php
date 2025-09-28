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
        $ueaNom = $this->seance->uae ? $this->seance->uae->nom : 'Une UEA';

       $mail = (new MailMessage)
        ->subject("🌐 Cours en ligne programmé : {$ueaNom}")
        ->greeting("Bonjour {$notifiable->prenom},")
        ->line("Un nouveau cours en ligne vient d'être programmé.")
        ->line("**UEA :** {$ueaNom}")
        ->line("**Date :** {$this->seance->date} à {$this->seance->heure_debut}");

    if ($this->seance->lien_reunion) {
        $mail->action('Rejoindre le cours', $this->seance->lien_reunion); //ftgomanrffmuhkfq
    } else {
        $mail->line('Le lien de réunion sera partagé prochainement.');
    }

    $mail->salutation("À bientôt !");

    return $mail;
}

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'titre' => "Cours en ligne programmé : {$this->seance->uae?->nom}",
            'message' => "Un nouveau cours en ligne est programmé le {$this->seance->date} à {$this->seance->heure_debut}.",
            'lien' => $this->seance->lien_reunion,
            'type' => 'cours_en_ligne',
            'seance_id' => $this->seance->id,
    ];
    }
}
