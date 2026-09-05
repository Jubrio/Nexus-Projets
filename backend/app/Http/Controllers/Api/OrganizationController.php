<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrganizationController extends Controller
{
    /**
     * Liste les membres de l'organisation courante avec leurs rôles.
     * Le TenantScope filtre déjà automatiquement par tenant.
     */
    public function users(Request $request): JsonResponse
    {
        $this->authorize('users.view');

        $users = User::with('roles')
            ->where('tenant_id', $request->user()->tenant_id)
            ->get();

        return response()->json($users);
    }

    /**
     * Liste les rôles disponibles dans l'organisation avec leurs permissions.
     */
    public function roles(Request $request): JsonResponse
    {
        $this->authorize('users.view');

        $roles = Role::with('permissions')
            ->where('tenant_id', $request->user()->tenant_id)
            ->get();

        return response()->json($roles);
    }

    /**
     * Change le rôle d'un membre de l'organisation.
     */
    public function updateUserRole(Request $request, User $user): JsonResponse
    {
        $this->authorize('users.manage');

        $validated = $request->validate([
            'role_id' => 'required|exists:roles,id',
        ]);

        // Protection IDOR explicite : même si le TenantScope protège déjà les
        // requêtes globales, on vérifie ici manuellement car $user est résolu
        // par Laravel via route-model-binding, qui ignore le scope par défaut
        // sur une résolution directe par ID.
        if ($user->tenant_id !== $request->user()->tenant_id) {
            abort(404);
        }

        $role = Role::where('tenant_id', $request->user()->tenant_id)
            ->findOrFail($validated['role_id']);

        // Empêche de retirer le dernier Owner de l'organisation
        if ($user->hasRole('owner') && $role->slug !== 'owner') {
            $ownersCount = User::where('tenant_id', $user->tenant_id)
                ->whereHas('roles', fn ($q) => $q->where('slug', 'owner'))
                ->count();

            if ($ownersCount <= 1) {
                return response()->json([
                    'message' => 'Impossible de retirer le dernier propriétaire de l\'organisation.',
                ], 422);
            }
        }

        $user->roles()->sync([$role->id]);

        return response()->json([
            'message' => 'Rôle mis à jour avec succès.',
            'user' => $user->load('roles'),
        ]);
    }
}
