<?php

namespace App\Notifications;

use App\Models\Justificatif; // ✅ Obligatoire
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class JustificatifValide extends Notification
{
    use Queueable;

    public function __construct(public Justificatif $justificatif)
    {
        // Le constructeur est bon
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        // ✅ On sécurise les accès
        $seance = $this->justificatif->seance;
        $ueaNom = $seance?->uea?->nom ?? 'Une UEA';
        $remarque = $this->justificatif->remarque ?: 'Aucune';

        return (new MailMessage)
            ->subject("✅ Absence justifiée : Votre absence du {$seance?->date} est validée")
            ->greeting("Bonjour {$notifiable->name},")
            ->line("Votre justification d’absence a été **validée** avec succès.")
            ->line("**Date de la séance :** {$seance?->date}")
            ->line("**UEA :** {$ueaNom}")
            ->line("**Motif :** {$this->justificatif->motif}")
            ->line("**Remarque du coordinateur :** {$remarque}")
            ->action('Voir ma justification', url('/app/justificatifs/' . $this->justificatif->id))
            ->line('Merci d’avoir justifié votre absence à temps.')
            ->line('Cordialement,')
            ->line('Le système de gestion des présences');
    }

    public function toArray($notifiable)
    {
        return [
            'justificatif_id' => $this->justificatif->id,
            'date_seance' => $seance?->date,
            'uea_nom' => $ueaNom,
            'motif' => $this->justificatif->motif,
        ];
    }
}
