<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

class WelcomeEnseignant extends Notification implements ShouldQueue
{
    use Queueable;

    public $password; // Le mot de passe temporaire est transmis, pas généré ici

    /**
     * Create a new notification instance.
     *
     * @param string $password
     */
    public function __construct(string $password)
    {
        $this->password = $password;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via($notifiable): array
    {
        return ['mail'];
    }

    /**
     * Build the mail representation of the notification.
     */
    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Bienvenue ! Voici vos identifiants')
            ->greeting("Bonjour {$notifiable->name},")
            ->line("Votre compte a été créé par le chef de département.")
            ->line("Voici vos identifiants de connexion :")
            ->line("**Email :** {$notifiable->email}")
            ->line("**Mot de passe :** {$this->password}")
            ->action('Se connecter', url('/login'))
            ->line("Nous vous recommandons de changer votre mot de passe après la première connexion.")
            ->salutation('Cordialement, ISEP Academy');
    }
}
