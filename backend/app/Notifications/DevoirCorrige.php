<?php

namespace App\Notifications;
use App\Models\Soumission;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DevoirCorrige extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct()
    {
        //
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

        $titre = $this->soumission->devoir->titre;
        $note = $this->soumission->note;
        $feedback = $this->soumission->feedback;
        return (new MailMessage)
            ->subject("✅ Devoir corrigé : {$titre}")
            ->greeting("Bonjour {$notifiable->name},")
            ->line("Votre devoir **{$titre}** a été corrigé.")
            ->line("**Note :** {$note}/20")
            ->line("**Feedback :** {$feedback}")
            ->line($this->soumission->fichier_corrige
                ? "[Télécharger le fichier corrigé](http://localhost:8000/storage/{$this->soumission->fichier_corrige})"
                : "Aucun fichier corrigé fourni.")
            ->action('Voir ma soumission', url('/app/devoirs/' . $this->soumission->id))
            ->line('Merci pour votre travail !')
            ->line('Cordialement,')
            ->line('L’équipe pédagogique');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'soumission_id' => $this->soumission->id,
            'note' => $this->soumission->note,
            'feedback' => $this->soumission->feedback,
            'devoir_titre' => $this->soumission->devoir->titre,
        ];
    }
}
