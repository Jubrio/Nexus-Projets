<?php

namespace App\Notifications;

use App\Models\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TicketAssigned extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Ticket $ticket)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Un ticket vous a été assigné : '.$this->ticket->title)
            ->line('Le ticket suivant vous a été assigné :')
            ->line('**'.$this->ticket->title.'**')
            ->line('Priorité : '.$this->ticket->priority)
            ->action('Voir le ticket', config('app.frontend_url').'/tickets/'.$this->ticket->id)
            ->line('Merci d\'utiliser NEXUS.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'ticket_assigned',
            'ticket_id' => $this->ticket->id,
            'ticket_title' => $this->ticket->title,
            'message' => 'Le ticket "'.$this->ticket->title.'" vous a été assigné.',
        ];
    }
}
