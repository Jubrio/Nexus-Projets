<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    /**
     * Liste les tâches d'un projet, groupées par statut (pratique pour le Kanban).
     */
    public function index(Request $request, Project $project): JsonResponse
    {
        $this->authorize('projects.view');

        $tasks = $project->tasks()
            ->with('assignee', 'creator')
            ->orderBy('position')
            ->get()
            ->groupBy('status');

        return response()->json([
            'todo' => $tasks->get('todo', collect())->values(),
            'in_progress' => $tasks->get('in_progress', collect())->values(),
            'done' => $tasks->get('done', collect())->values(),
        ]);
    }

    public function store(Request $request, Project $project): JsonResponse
    {
        $this->authorize('tickets.create'); // toute personne pouvant créer du contenu de base

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'sometimes|in:low,medium,high',
            'assignee_id' => 'nullable|exists:users,id',
            'due_date' => 'nullable|date',
        ]);

        // Protection IDOR : l'assigné doit appartenir au même tenant
        if (! empty($validated['assignee_id'])) {
            User::where('tenant_id', $request->user()->tenant_id)
                ->findOrFail($validated['assignee_id']);
        }

        $maxPosition = $project->tasks()->where('status', 'todo')->max('position') ?? 0;

        $task = $project->tasks()->create([
            ...$validated,
            'status' => 'todo',
            'position' => $maxPosition + 1,
            'created_by' => $request->user()->id,
        ]);

        return response()->json($task->load('assignee', 'creator'), 201);
    }

    /**
     * Met à jour une tâche : titre, description, priorité, assignation,
     * ou changement de colonne Kanban (status) + position.
     */
    public function update(Request $request, Project $project, Task $task): JsonResponse
    {
        $this->authorize('projects.edit');

        // Protection IDOR : la tâche doit bien appartenir au projet indiqué dans l'URL
        if ($task->project_id !== $project->id) {
            abort(404);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:todo,in_progress,done',
            'priority' => 'sometimes|in:low,medium,high',
            'assignee_id' => 'nullable|exists:users,id',
            'position' => 'sometimes|integer|min:0',
            'due_date' => 'nullable|date',
        ]);

        if (! empty($validated['assignee_id'])) {
            User::where('tenant_id', $request->user()->tenant_id)
                ->findOrFail($validated['assignee_id']);
        }

        $task->update($validated);

        return response()->json($task->load('assignee', 'creator'));
    }

    public function destroy(Request $request, Project $project, Task $task): JsonResponse
    {
        $this->authorize('projects.delete');

        if ($task->project_id !== $project->id) {
            abort(404);
        }

        $task->delete();

        return response()->json(['message' => 'Tâche supprimée avec succès.']);
    }
}
