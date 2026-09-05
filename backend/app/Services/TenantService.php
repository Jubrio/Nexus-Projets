<?php

namespace App\Services;

use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Str;

class TenantService
{
    /**
     * Crée une nouvelle organisation avec ses 3 rôles par défaut
     * (Owner, Admin, Member), et assigne le rôle Owner à l'utilisateur créateur.
     */
    public function createTenantForUser(User $user, string $organizationName): Tenant
    {
        $tenant = Tenant::create([
            'name' => $organizationName,
            'slug' => $this->generateUniqueSlug($organizationName),
        ]);

        $user->update(['tenant_id' => $tenant->id]);

        $allPermissions = Permission::all();

        $ownerRole = Role::create([
            'tenant_id' => $tenant->id,
            'name' => 'Owner',
            'slug' => 'owner',
        ]);
        $ownerRole->permissions()->attach($allPermissions->pluck('id'));

        $adminRole = Role::create([
            'tenant_id' => $tenant->id,
            'name' => 'Admin',
            'slug' => 'admin',
        ]);
        // Admin a tout sauf la gestion de l'organisation elle-même (facturation, suppression)
        $adminPermissions = $allPermissions->reject(
            fn (Permission $p) => $p->slug === 'organization.manage'
        );
        $adminRole->permissions()->attach($adminPermissions->pluck('id'));

        $memberRole = Role::create([
            'tenant_id' => $tenant->id,
            'name' => 'Member',
            'slug' => 'member',
        ]);
        // Member : lecture seule + création de contenu de base, pas de gestion
        $memberPermissions = $allPermissions->filter(
            fn (Permission $p) => str_ends_with($p->slug, '.view')
                || in_array($p->slug, ['tickets.create', 'documents.upload'], true)
        );
        $memberRole->permissions()->attach($memberPermissions->pluck('id'));

        // L'utilisateur créateur devient Owner de son organisation
        $user->roles()->attach($ownerRole->id);

        return $tenant;
    }

    private function generateUniqueSlug(string $name): string
    {
        $baseSlug = Str::slug($name);
        $slug = $baseSlug;
        $counter = 1;

        while (Tenant::where('slug', $slug)->exists()) {
            $slug = $baseSlug.'-'.$counter;
            $counter++;
        }

        return $slug;
    }
}
