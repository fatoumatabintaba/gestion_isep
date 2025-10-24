<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AbsenceNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $absent;
    public $seance;

    /**
     * Create a new notification instance.
     */
    public function __construct($absent, $seance)
    {
        $this->absent = $absent;
        $this->seance = $seance;
    }

    /**
     * Get the notification's delivery channels.
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
            ->subject('🚨 Notification d\'Absence - ' . $this->seance->nom)
            ->greeting('Bonjour ' . $this->absent['nom'] . ',')
            ->line('Votre absence a été signalée pour la séance suivante :')
            ->line('**Séance :** ' . $this->seance->nom)
            ->line('**UEA :** ' . $this->seance->uea_nom)
            ->line('**Date :** ' . \Carbon\Carbon::parse($this->seance->date)->format('d/m/Y'))
            ->line('**Heure :** ' . $this->seance->heure_debut . ' - ' . $this->seance->heure_fin)
            ->line('**Salle :** ' . $this->seance->salle)
            ->line('**Enseignant :** ' . $this->absent['enseignant'])
            ->action('Accéder à la plateforme', url('/login'))
            ->line('Si vous pensez qu\'il s\'agit d\'une erreur, contactez rapidement votre enseignant.')
            ->salutation('Cordialement,<br>Département EIT');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        return [
            'seance_id' => $this->seance->id,
            'seance_nom' => $this->seance->nom,
            'apprenant_nom' => $this->absent['nom'],
            'date' => $this->seance->date,
        ];
    }
}
