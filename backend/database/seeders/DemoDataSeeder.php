<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\Product;
use App\Models\Project;
use App\Models\Role;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\Task;
use App\Models\Ticket;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\TenantService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $tenantService = app(TenantService::class);

        // ── Organisation 1 : Acme Corp ──────────────────────────────
        $alice = User::create([
            'name' => 'Alice Owner',
            'email' => 'alice@acme.local',
            'password' => Hash::make('TestPass123!'),
            'email_verified_at' => now(),
        ]);
        $tenantService->createTenantForUser($alice, 'Acme Corp');
        $acmeId = $alice->tenant_id;

        $charlie = User::create([
            'name' => 'Charlie Member',
            'email' => 'charlie@acme.local',
            'password' => Hash::make('TestPass123!'),
            'tenant_id' => $acmeId,
            'email_verified_at' => now(),
        ]);
        $memberRole = Role::where('tenant_id', $acmeId)->where('slug', 'member')->first();
        $charlie->roles()->attach($memberRole->id);

        // ── Organisation 2 : Beta Inc ────────────────────────────────
        $bob = User::create([
            'name' => 'Bob Owner',
            'email' => 'bob@beta.local',
            'password' => Hash::make('TestPass123!'),
            'email_verified_at' => now(),
        ]);
        $tenantService->createTenantForUser($bob, 'Beta Inc');

        // ── Projets / Tâches (Acme Corp) ─────────────────────────────
        $project = Project::create([
            'tenant_id' => $acmeId,
            'name' => 'Refonte du site web',
            'description' => 'Projet de refonte complète',
            'created_by' => $alice->id,
        ]);
        $project->members()->attach([$alice->id, $charlie->id]);

        Task::create([
            'tenant_id' => $acmeId, 'project_id' => $project->id,
            'title' => 'Concevoir la maquette', 'status' => 'todo',
            'priority' => 'high', 'position' => 1, 'created_by' => $alice->id,
        ]);
        Task::create([
            'tenant_id' => $acmeId, 'project_id' => $project->id,
            'title' => 'Développer la page d\'accueil', 'status' => 'in_progress',
            'priority' => 'medium', 'position' => 1, 'assignee_id' => $charlie->id,
            'created_by' => $alice->id,
        ]);
        Task::create([
            'tenant_id' => $acmeId, 'project_id' => $project->id,
            'title' => 'Cahier des charges', 'status' => 'done',
            'priority' => 'low', 'position' => 1, 'created_by' => $alice->id,
        ]);

        // ── Tickets (Acme Corp) ────────────────────────────────────
        Ticket::create([
            'tenant_id' => $acmeId,
            'title' => 'Le serveur ne répond plus',
            'description' => 'Erreur 500 sur toutes les pages',
            'category' => 'bug', 'priority' => 'urgent',
            'assigned_to' => $charlie->id, 'created_by' => $alice->id,
            'sla_due_at' => Ticket::calculateSlaDueAt('urgent'),
        ]);
        Ticket::create([
            'tenant_id' => $acmeId,
            'title' => 'Demande d\'export CSV',
            'category' => 'feature', 'priority' => 'low',
            'created_by' => $charlie->id,
            'sla_due_at' => Ticket::calculateSlaDueAt('low'),
        ]);

        // ── Inventaire (Acme Corp) ───────────────────────────────────
        $supplier = Supplier::create([
            'tenant_id' => $acmeId, 'name' => 'Fournisseur Tech SA',
            'email' => 'contact@fournisseurtech.com',
        ]);
        $warehouse = Warehouse::create([
            'tenant_id' => $acmeId, 'name' => 'Entrepôt Principal',
            'location' => 'Antananarivo',
        ]);
        $product = Product::create([
            'tenant_id' => $acmeId, 'supplier_id' => $supplier->id,
            'sku' => 'LAPTOP-001', 'name' => 'Ordinateur portable',
            'unit_price' => 850.00, 'low_stock_threshold' => 5,
        ]);

        StockMovement::create([
            'tenant_id' => $acmeId, 'product_id' => $product->id,
            'warehouse_id' => $warehouse->id, 'type' => 'in',
            'quantity' => 20, 'reason' => 'Réception commande fournisseur',
            'created_by' => $alice->id,
        ]);
        StockMovement::create([
            'tenant_id' => $acmeId, 'product_id' => $product->id,
            'warehouse_id' => $warehouse->id, 'type' => 'out',
            'quantity' => 18, 'reason' => 'Vente client',
            'created_by' => $alice->id,
        ]);
        DB::table('product_warehouse_stock')->insert([
            'product_id' => $product->id, 'warehouse_id' => $warehouse->id,
            'quantity' => 2, 'created_at' => now(), 'updated_at' => now(),
        ]);

        // ── Facturation (Acme Corp) ──────────────────────────────────
        $client = Client::create([
            'tenant_id' => $acmeId, 'name' => 'Client Exemple SARL',
            'email' => 'contact@clientexemple.com',
            'company' => 'Client Exemple SARL',
        ]);

        $subtotal = 1200.00;
        $taxRate = 20.00;
        $taxAmount = round($subtotal * $taxRate / 100, 2);
        $total = $subtotal + $taxAmount;

        $invoiceId = DB::table('invoices')->insertGetId([
            'tenant_id' => $acmeId, 'client_id' => $client->id,
            'invoice_number' => 'INV-2026-0001',
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'subtotal' => $subtotal, 'tax_rate' => $taxRate,
            'tax_amount' => $taxAmount, 'total' => $total,
            'status' => 'sent',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        DB::table('invoice_lines')->insert([
            [
                'invoice_id' => $invoiceId, 'description' => 'Ordinateur portable x1',
                'quantity' => 1, 'unit_price' => 850.00, 'discount' => 0,
                'total' => 850.00, 'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'invoice_id' => $invoiceId, 'description' => 'Prestation de service',
                'quantity' => 1, 'unit_price' => 350.00, 'discount' => 0,
                'total' => 350.00, 'created_at' => now(), 'updated_at' => now(),
            ],
        ]);

        DB::table('payments')->insert([
            'tenant_id' => $acmeId, 'invoice_id' => $invoiceId, 'client_id' => $client->id,
            'amount' => 500.00, 'payment_date' => now()->toDateString(),
            'method' => 'bank_transfer', 'reference' => 'VIR-2026-001',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        // ── Document exemple (Acme Corp) ─────────────────────────────
        DB::table('documents')->insert([
            'tenant_id' => $acmeId, 'user_id' => $alice->id,
            'documentable_type' => Project::class, 'documentable_id' => $project->id,
            'name' => 'Cahier des charges.pdf', 'file_name' => 'cahier-des-charges.pdf',
            'mime_type' => 'application/pdf', 'disk' => 'local',
            'path' => 'documents/demo/cahier-des-charges.pdf', 'size' => 245678,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        // ── Logs d'audit exemple (Acme Corp) ──────────────────────────
        DB::table('audit_logs')->insert([
            [
                'tenant_id' => $acmeId, 'user_id' => $alice->id, 'action' => 'create',
                'auditable_type' => Project::class, 'auditable_id' => $project->id,
                'new_values' => json_encode(['name' => $project->name]),
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'tenant_id' => $acmeId, 'user_id' => $alice->id, 'action' => 'create',
                'auditable_type' => \App\Models\Invoice::class, 'auditable_id' => $invoiceId,
                'new_values' => json_encode(['invoice_number' => 'INV-2026-0001', 'total' => $total]),
                'created_at' => now(), 'updated_at' => now(),
            ],
        ]);

        $this->command->info('Données de démonstration recréées avec succès.');
    }
}
