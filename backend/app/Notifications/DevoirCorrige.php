<?php

namespace App\Notifications;

use App\Models\Soumission;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Storage;

class DevoirCorrige extends Notification implements ShouldQueue
{
    use Queueable;

    public $soumission;

    /**
     * Create a new notification instance.
     */
    public function __construct(Soumission $soumission)
    {
        $this->soumission = $soumission;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $titre = $this->soumission->devoir->titre ?? 'Devoir';
        $note = $this->soumission->note ?? 'Non noté';
        $feedback = $this->soumission->feedback ?? 'Aucun feedback fourni';

        // ✅ Construction du message avec gestion des valeurs nulles
        $mailMessage = (new MailMessage)
            ->subject("✅ Devoir corrigé : {$titre}")
            ->greeting("Bonjour {$notifiable->name},")
            ->line("Votre devoir **{$titre}** a été corrigé.")
            ->line("**Note :** {$note}/20")
            ->line("**Feedback :** {$feedback}");

        // ✅ Ajout du lien vers le fichier corrigé s'il existe
        if ($this->soumission->fichier_corrige) {
            $fileUrl = Storage::url($this->soumission->fichier_corrige);
            $mailMessage->line("**Fichier corrigé :** [Télécharger](" . url($fileUrl) . ")");
        }

        // ✅ Lien vers la soumission
        $mailMessage->action('Voir ma soumission', url('/app/soumissions/' . $this->soumission->id))
            ->line('Merci pour votre travail !')
            ->line('Cordialement,')
            ->line('L\'équipe pédagogique');

        return $mailMessage;
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        return [
            'soumission_id' => $this->soumission->id,
            'devoir_id' => $this->soumission->devoir_id,
            'devoir_titre' => $this->soumission->devoir->titre ?? 'Devoir',
            'note' => $this->soumission->note,
            'feedback' => $this->soumission->feedback,
            'fichier_corrige' => $this->soumission->fichier_corrige,
            'type' => 'devoir_corrige',
            'message' => "Votre devoir '{$this->soumission->devoir->titre}' a été corrigé - Note: {$this->soumission->note}/20",
            'url' => '/app/soumissions/' . $this->soumission->id,
            'created_at' => now()->toDateTimeString()
        ];
    }

    /**
     * ✅ NOUVEAU : Méthode pour les notifications en base de données
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'soumission_id' => $this->soumission->id,
            'devoir_id' => $this->soumission->devoir_id,
            'devoir_titre' => $this->soumission->devoir->titre ?? 'Devoir',
            'note' => $this->soumission->note,
            'feedback' => $this->soumission->feedback,
            'enseignant' => $this->soumission->devoir->enseignant->name ?? 'Enseignant',
            'fichier_corrige' => $this->soumission->fichier_corrige ? Storage::url($this->soumission->fichier_corrige) : null,
            'type' => 'devoir_corrige',
            'message' => "Votre devoir '{$this->soumission->devoir->titre}' a été corrigé - Note: {$this->soumission->note}/20",
            'url' => '/app/soumissions/' . $this->soumission->id,
            'created_at' => now()->toDateTimeString()
        ];
    }
}
