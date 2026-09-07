<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Notifications\TicketCommented;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TicketCommentController extends Controller
{
    public function index(Request $request, Ticket $ticket): JsonResponse
    {
        $this->authorize('tickets.view');

        return response()->json($ticket->comments()->with('user')->get());
    }

    public function store(Request $request, Ticket $ticket): JsonResponse
    {
        $this->authorize('tickets.edit');

        $validated = $request->validate([
            'content' => 'required|string|max:2000',
        ]);

        $comment = $ticket->comments()->create([
            'user_id' => $request->user()->id,
            'content' => $validated['content'],
        ]);

        $comment->load('user');

        // Notifie le créateur du ticket et l'assigné, sauf la personne qui commente elle-même
        $recipients = collect([$ticket->creator, $ticket->assignee])
            ->filter()
            ->unique('id')
            ->reject(fn ($user) => $user->id === $request->user()->id);

        foreach ($recipients as $recipient) {
            $recipient->notify(new TicketCommented($comment));
        }

        return response()->json($comment, 201);
    }
}
