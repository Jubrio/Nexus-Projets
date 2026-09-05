<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            // Organisation
            ['group' => 'organization', 'slug' => 'organization.manage', 'name' => 'Gérer les paramètres de l\'organisation'],
            ['group' => 'organization', 'slug' => 'organization.invite', 'name' => 'Inviter des membres'],

            // Utilisateurs & rôles
            ['group' => 'users', 'slug' => 'users.view', 'name' => 'Voir les utilisateurs'],
            ['group' => 'users', 'slug' => 'users.manage', 'name' => 'Gérer les utilisateurs et rôles'],

            // Projets
            ['group' => 'projects', 'slug' => 'projects.view', 'name' => 'Voir les projets'],
            ['group' => 'projects', 'slug' => 'projects.create', 'name' => 'Créer des projets'],
            ['group' => 'projects', 'slug' => 'projects.edit', 'name' => 'Modifier les projets'],
            ['group' => 'projects', 'slug' => 'projects.delete', 'name' => 'Supprimer des projets'],

            // Tickets
            ['group' => 'tickets', 'slug' => 'tickets.view', 'name' => 'Voir les tickets'],
            ['group' => 'tickets', 'slug' => 'tickets.create', 'name' => 'Créer des tickets'],
            ['group' => 'tickets', 'slug' => 'tickets.edit', 'name' => 'Modifier les tickets'],

            // Inventaire
            ['group' => 'inventory', 'slug' => 'inventory.view', 'name' => 'Voir l\'inventaire'],
            ['group' => 'inventory', 'slug' => 'inventory.manage', 'name' => 'Gérer l\'inventaire'],

            // Facturation
            ['group' => 'invoices', 'slug' => 'invoices.view', 'name' => 'Voir les factures'],
            ['group' => 'invoices', 'slug' => 'invoices.manage', 'name' => 'Gérer les factures et paiements'],

            // Documents
            ['group' => 'documents', 'slug' => 'documents.view', 'name' => 'Voir les documents'],
            ['group' => 'documents', 'slug' => 'documents.upload', 'name' => 'Téléverser des documents'],

            // Audit
            ['group' => 'audit', 'slug' => 'audit.view', 'name' => 'Consulter les logs d\'audit'],
        ];

        foreach ($permissions as $permission) {
            Permission::updateOrCreate(
                ['slug' => $permission['slug']],
                $permission
            );
        }
    }
}
