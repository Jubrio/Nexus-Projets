<?php

namespace App\Mail;

use App\Models\Invitation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Invitation $invitation,
        public string $plainToken
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Invitation à rejoindre '.$this->invitation->tenant->name.' sur NEXUS',
        );
    }

    public function content(): Content
    {
        $acceptUrl = config('app.frontend_url').'/invitations/'.$this->plainToken;

        return new Content(
            markdown: 'emails.invitation',
            with: [
                'organizationName' => $this->invitation->tenant->name,
                'inviterName' => $this->invitation->invitedBy->name,
                'roleName' => $this->invitation->role->name,
                'acceptUrl' => $acceptUrl,
            ],
        );
    }
}
