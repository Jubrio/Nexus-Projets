<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    /**
     * Liste les projets de l'organisation courante.
     * Le TenantScope filtre déjà automatiquement par tenant.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('projects.view');

        $projects = Project::with('creator')
            ->withCount('tasks')
            ->latest()
            ->get();

        return response()->json($projects);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('projects.create');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $project = Project::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'created_by' => $request->user()->id,
        ]);

        // Le créateur devient automatiquement membre du projet
        $project->members()->attach($request->user()->id);

        return response()->json($project->load('creator'), 201);
    }

    /**
     * Affiche un projet avec ses membres.
     * Le TenantScope protège déjà contre l'accès cross-tenant via route-model-binding
     * grâce au global scope appliqué automatiquement sur Project::class.
     */
    public function show(Request $request, Project $project): JsonResponse
    {
        $this->authorize('projects.view');

        return response()->json($project->load('creator', 'members'));
    }

    public function update(Request $request, Project $project): JsonResponse
    {
        $this->authorize('projects.edit');

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:active,archived',
        ]);

        $project->update($validated);

        return response()->json($project);
    }

    public function destroy(Request $request, Project $project): JsonResponse
    {
        $this->authorize('projects.delete');

        $project->delete();

        return response()->json(['message' => 'Projet supprimé avec succès.']);
    }

    /**
     * Ajoute un membre existant de l'organisation à un projet.
     */
    public function addMember(Request $request, Project $project): JsonResponse
    {
        $this->authorize('projects.edit');

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        // Protection IDOR : l'utilisateur ajouté doit appartenir au même tenant
        $user = \App\Models\User::where('tenant_id', $request->user()->tenant_id)
            ->findOrFail($validated['user_id']);

        $project->members()->syncWithoutDetaching([$user->id]);

        return response()->json($project->load('members'));
    }
}
