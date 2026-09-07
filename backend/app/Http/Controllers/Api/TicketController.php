<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\User;
use App\Notifications\TicketAssigned;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TicketController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('tickets.view');

        $query = Ticket::with('assignee', 'creator')->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->input('priority'));
        }

        $tickets = $query->get()->map(function (Ticket $ticket) {
            $ticket->is_overdue = $ticket->isOverdue();

            return $ticket;
        });

        return response()->json($tickets);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('tickets.create');

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'sometimes|in:general,bug,feature,support',
            'priority' => 'sometimes|in:low,medium,high,urgent',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        if (! empty($validated['assigned_to'])) {
            User::where('tenant_id', $request->user()->tenant_id)
                ->findOrFail($validated['assigned_to']);
        }

        $priority = $validated['priority'] ?? 'medium';

        $ticket = Ticket::create([
            ...$validated,
            'priority' => $priority,
            'created_by' => $request->user()->id,
            'sla_due_at' => Ticket::calculateSlaDueAt($priority),
        ]);

        if ($ticket->assigned_to) {
            $ticket->assignee->notify(new TicketAssigned($ticket));
        }

        return response()->json($ticket->load('assignee', 'creator'), 201);
    }

    public function show(Request $request, Ticket $ticket): JsonResponse
    {
        $this->authorize('tickets.view');

        $ticket->load('assignee', 'creator');
        $ticket->is_overdue = $ticket->isOverdue();

        return response()->json($ticket);
    }

    public function update(Request $request, Ticket $ticket): JsonResponse
    {
        $this->authorize('tickets.edit');

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'category' => 'sometimes|in:general,bug,feature,support',
            'priority' => 'sometimes|in:low,medium,high,urgent',
            'status' => 'sometimes|in:open,in_progress,resolved,closed',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        if (! empty($validated['assigned_to'])) {
            User::where('tenant_id', $request->user()->tenant_id)
                ->findOrFail($validated['assigned_to']);
        }

        $wasAssignedTo = $ticket->assigned_to;

        // Recalcule la date SLA si la priorité change
        if (isset($validated['priority']) && $validated['priority'] !== $ticket->priority) {
            $validated['sla_due_at'] = Ticket::calculateSlaDueAt($validated['priority']);
        }

        // Marque la date de résolution quand le statut passe à "resolved"
        if (isset($validated['status']) && $validated['status'] === 'resolved' && $ticket->status !== 'resolved') {
            $validated['resolved_at'] = now();
        }

        $ticket->update($validated);

        // Notifie le nouvel assigné, seulement si l'assignation vient de changer
        if (
            isset($validated['assigned_to'])
            && $validated['assigned_to'] !== $wasAssignedTo
            && $ticket->assignee
        ) {
            $ticket->assignee->notify(new TicketAssigned($ticket));
        }

        return response()->json($ticket->load('assignee', 'creator'));
    }

    public function destroy(Request $request, Ticket $ticket): JsonResponse
    {
        $this->authorize('tickets.edit');

        $ticket->delete();

        return response()->json(['message' => 'Ticket supprimé avec succès.']);
    }
}
