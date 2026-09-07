<?php

namespace App\Notifications;

use App\Models\TicketComment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TicketCommented extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public TicketComment $comment)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'ticket_commented',
            'ticket_id' => $this->comment->ticket_id,
            'comment_author' => $this->comment->user->name,
            'message' => $this->comment->user->name.' a commenté le ticket "'.$this->comment->ticket->title.'".',
        ];
    }
}
