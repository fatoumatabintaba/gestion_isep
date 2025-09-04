<?php

namespace App\Notifications;

use App\Models\Justificatif;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Notifications\JustificatifSoumis;


class JustificatifSoumis extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public Justificatif $justificatif)
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

        $apprenant = $this->justificatif->apprenant;
        $seance = $this->justificatif->seance;
         return (new MailMessage)
            ->subject("📄 Justificatif d'absence soumis : {$apprenant->nom} {$apprenant->prenom}")
            ->greeting("Bonjour {$notifiable->name},")
            ->line("Un apprenant vient de justifier son absence.")
            ->line("**Apprenant :** {$apprenant->prenom} {$apprenant->nom}")
            ->line("**UEA :** {$seance->uea->nom}")
            ->line("**Date de la séance :** {$seance->date}")
            ->line("**Motif :** {$this->justificatif->motif}")
            ->action('Voir la justification', url('/app/justificatifs/' . $this->justificatif->id))
            ->line('Merci de valider ou rejeter cette demande.')
            ->line('Cordialement,')
            ->line('Le système de gestion des présences');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
             'justificatif_id' => $this->justificatif->id,
            'apprenant_nom' => $this->justificatif->apprenant->nom,
            'apprenant_prenom' => $this->justificatif->apprenant->prenom,
            'uea_nom' => $this->justificatif->seance->uea->nom,
            'motif' => $this->justificatif->motif,
        ];
    }
}
