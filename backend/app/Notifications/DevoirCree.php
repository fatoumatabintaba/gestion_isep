<?php

namespace App\Notifications;

use App\Models\Devoir;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DevoirCree extends Notification
{
    use Queueable;

    public $devoir;

    public function __construct(Devoir $devoir)
    {
        $this->devoir = $devoir;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

public function toMail($notifiable): MailMessage
{
    $ueaNom = $this->devoir->uea ? $this->devoir->uea->nom : 'Une UEA';
    $description = $this->devoir->description ?: 'Aucune description';
    $dateLimite = $this->devoir->date_limite ? $this->devoir->date_limite->format('d/m/Y à H:i') : 'Non définie';

    return (new MailMessage)
        ->subject("📝 Nouveau devoir : {$ueaNom}")
        ->greeting("Bonjour {$notifiable->name},")
        ->line("Un nouveau devoir a été publié pour l’UEA **{$ueaNom}**.")
        ->line("**Titre :** {$this->devoir->titre}")
        ->line("**Description :** {$description}")
        ->line("**Date limite :** {$dateLimite}")
        ->line("**Coefficient :** {$this->devoir->coefficient}")
        ->action('Voir le devoir', url('/app/devoirs/' . $this->devoir->id))
        ->line('Merci de le rendre avant la date limite.')
        ->line('Cordialement,')
        ->line('L’équipe pédagogique');
}

    public function toArray($notifiable)
    {
        return [
            'devoir_id' => $this->devoir->id,
            'titre' => $this->devoir->titre,
            'uea' => $this->devoir->uea?->nom,
            'date_limite' => $this->devoir->date_limite,
        ];
    }
}
