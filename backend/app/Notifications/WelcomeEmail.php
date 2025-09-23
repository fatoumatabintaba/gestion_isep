<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use App\Models\User;
use App\Models\Apprenant;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;


class WelcomeEmail extends Notification
{
    use Queueable;

    public $user;

    public function __construct($user)
    {
        $this->user = $user;
    }

    public function via($notifiable)
   {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        $roleMessages = [
            'apprenant' => 'consulter vos cours, devoirs, et progresser dans votre apprentissage.',
            'enseignant' => 'gérer les cours et devoirs.',
            'coordinateur' => 'superviser les activités pédagogiques.',
            'chef_departement' => 'piloter la stratégie pédagogique du département.',
            'admin' => 'gérer les utilisateurs et les paramètres du système.'
        ];

        $message = $roleMessages[$this->user->role] ?? 'accéder à la plateforme ISEP.';

        return (new MailMessage)
            ->subject("🎉 Bienvenue, {$this->user->name} !")
            ->greeting("Bonjour {$this->user->name},")
            ->line("Votre compte a été créé avec succès sur la plateforme ISEP.")
            ->line("Vous pouvez désormais {$message}")
            ->action('Se connecter', url('/login'))
            ->line('Cordialement,')
            ->salutation('Le système ISEP');
    }

    public function toArray($notifiable)
    {
        return [
            'user_id' => $this->user->id,
            'name' => $this->user->name,
            'role' => $this->user->role,
        ];
    }
}


// class WelcomeEmail extends Notification
// {
//     use Queueable;
//     public $user;

//     /**
//      * Create a new notification instance.
//      */
//     public function __construct(User $user)
//     {
//         $this->user = $user;
//     }

//     /**
//      * Get the notification's delivery channels.
//      *
//      * @return array<int, string>
//      */
//     public function via(object $notifiable): array
//     {
//         return ['mail'];
//     }

//     /**
//      * Get the mail representation of the notification.
//      */
//     public function toMail(object $notifiable): MailMessage
//     {

//         return (new MailMessage)
//                     ->subject("Bienvenu dans ISEP THIES, {$this->user->name}!")
//                     ->greeting(" Bonjour, {$this->user->name} !")
//                     ->line("Felicitation votre compte a ete creer avec succe")
//                     ->line("**Role :** {$this->user->Role} ")
//                     ->line("vous pouvez maintenant vous connecter a notre plateforme")
//                     ->action('se connecter', url('/login'))
//                     ->line('merci de faire partie de notre systeme pedagogique')
//                     ->line('Cordialement')
//                     ->line($personalMessage)
//                     ->salutation('L\'equipe ISEP THIES');

//     }

//     /**
//      * Get the array representation of the notification.
//      *
//      * @return array<string, mixed>
//      */
//     public function toArray(object $notifiable): array
//     {
//         return [
//             'user_id' => $this->user->id,
//             'name' => $this->user->name,
//             'role' => $this->user->role,
//             'message' => 'votre compte a ete cre avec succes'
//         ];
//     }
// }
