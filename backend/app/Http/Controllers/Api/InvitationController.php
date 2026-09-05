<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\InvitationMail;
use App\Models\Invitation;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class InvitationController extends Controller
{
    /**
     * Envoie une invitation par email pour rejoindre l'organisation.
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('organization.invite');

        $validated = $request->validate([
            'email' => 'required|email',
            'role_id' => 'required|exists:roles,id',
        ]);

        $tenantId = $request->user()->tenant_id;

        // Empêche d'inviter quelqu'un déjà membre de l'organisation
        if (User::where('tenant_id', $tenantId)->where('email', $validated['email'])->exists()) {
            return response()->json([
                'message' => 'Cet email appartient déjà à un membre de l\'organisation.',
            ], 422);
        }

        // Vérifie que le rôle appartient bien au tenant courant (protection IDOR)
        $role = Role::where('tenant_id', $tenantId)->findOrFail($validated['role_id']);

        // Génère un token aléatoire ; seul son hash est stocké en base
        // (même principe que les mots de passe, pour qu'une fuite de la DB
        // ne permette pas de rejouer les invitations en attente)
        $plainToken = Str::random(40);

        $invitation = Invitation::create([
            'tenant_id' => $tenantId,
            'role_id' => $role->id,
            'invited_by' => $request->user()->id,
            'email' => $validated['email'],
            'token' => hash('sha256', $plainToken),
            'expires_at' => now()->addDays(7),
        ]);

        Mail::to($validated['email'])->send(new InvitationMail($invitation, $plainToken));

        return response()->json([
            'message' => 'Invitation envoyée avec succès.',
        ], 201);
    }

    /**
     * Vérifie un token d'invitation et renvoie ses infos (publique, pas d'auth requise).
     */
    public function show(string $token): JsonResponse
    {
        $invitation = Invitation::with('tenant', 'role')
            ->where('token', hash('sha256', $token))
            ->first();

        if (! $invitation || ! $invitation->isValid()) {
            return response()->json(['message' => 'Cette invitation est invalide ou a expiré.'], 404);
        }

        return response()->json([
            'organization_name' => $invitation->tenant->name,
            'role_name' => $invitation->role->name,
            'email' => $invitation->email,
        ]);
    }

    /**
     * Accepte une invitation : crée le compte et rejoint l'organisation.
     */
    public function accept(Request $request, string $token): JsonResponse
    {
        $invitation = Invitation::where('token', hash('sha256', $token))->first();

        if (! $invitation || ! $invitation->isValid()) {
            return response()->json(['message' => 'Cette invitation est invalide ou a expiré.'], 404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'password' => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()->symbols()],
        ]);

        // Re-vérifie qu'aucun compte n'a été créé entre-temps avec cet email
        if (User::where('email', $invitation->email)->exists()) {
            return response()->json(['message' => 'Un compte existe déjà avec cet email.'], 422);
        }

        $user = DB::transaction(function () use ($validated, $invitation) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $invitation->email,
                'password' => Hash::make($validated['password']),
                'tenant_id' => $invitation->tenant_id,
                'email_verified_at' => now(), // email déjà confirmé implicitement (invitation reçue)
            ]);

            $user->roles()->attach($invitation->role_id);

            $invitation->update(['accepted_at' => now()]);

            return $user;
        });

        return response()->json([
            'message' => 'Compte créé avec succès. Vous pouvez maintenant vous connecter.',
            'user' => $user,
        ], 201);
    }
}
