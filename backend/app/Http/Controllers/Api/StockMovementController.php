<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Warehouse;
use App\Models\User;
use App\Notifications\LowStockAlert;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StockMovementController extends Controller
{
    public function index(Product $product): JsonResponse
    {
        $this->authorize('inventory.view');

        $movements = StockMovement::where('product_id', $product->id)
            ->with('warehouse', 'creator')
            ->latest()
            ->get();

        return response()->json($movements);
    }

    public function store(Request $request, Product $product): JsonResponse
    {
        $this->authorize('inventory.manage');

        $validated = $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'type' => 'required|in:in,out,adjustment',
            'quantity' => 'required|integer|min:1',
            'reason' => 'nullable|string|max:255',
        ]);

        $warehouse = Warehouse::where('tenant_id', $request->user()->tenant_id)
            ->findOrFail($validated['warehouse_id']);

        $movement = DB::transaction(function () use ($validated, $product, $warehouse, $request) {
            $stock = DB::table('product_warehouse_stock')
                ->where('product_id', $product->id)
                ->where('warehouse_id', $warehouse->id)
                ->lockForUpdate()
                ->first();

            $currentQuantity = $stock->quantity ?? 0;

            $newQuantity = match ($validated['type']) {
                'in' => $currentQuantity + $validated['quantity'],
                'out' => $currentQuantity - $validated['quantity'],
                'adjustment' => $validated['quantity'],
            };

            if ($newQuantity < 0) {
                throw ValidationException::withMessages([
                    'quantity' => ["Stock insuffisant. Stock actuel : {$currentQuantity}."],
                ]);
            }

            DB::table('product_warehouse_stock')->updateOrInsert(
                ['product_id' => $product->id, 'warehouse_id' => $warehouse->id],
                ['quantity' => $newQuantity, 'updated_at' => now(), 'created_at' => now()]
            );

            return StockMovement::create([
                'product_id' => $product->id,
                'warehouse_id' => $warehouse->id,
                'type' => $validated['type'],
                'quantity' => $validated['quantity'],
                'reason' => $validated['reason'] ?? null,
                'created_by' => $request->user()->id,
            ]);
        });

        $product->refresh();
        if ($product->isLowStock()) {
            $this->sendLowStockAlert($product);
        }

        return response()->json([
            'movement' => $movement->load('warehouse', 'creator'),
            'new_total_stock' => $product->totalStock(),
        ], 201);
    }

    public function export(Product $product): StreamedResponse
    {
        $this->authorize('inventory.view');

        $movements = StockMovement::where('product_id', $product->id)
            ->with('warehouse', 'creator')
            ->latest()
            ->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="mouvements_' . $product->sku . '_' . date('Y-m-d') . '.csv"',
        ];

        $callback = function () use ($movements) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, ['Date', 'Type', 'Quantite', 'Entrepot', 'Motif', 'Cree par']);

            $typeLabels = [
                'in' => 'Entree',
                'out' => 'Sortie',
                'adjustment' => 'Ajustement',
            ];

            foreach ($movements as $movement) {
                fputcsv($handle, [
                    $movement->created_at->format('d/m/Y H:i'),
                    $typeLabels[$movement->type] ?? $movement->type,
                    $movement->quantity,
                    $movement->warehouse->name,
                    $movement->reason ?? '',
                    $movement->creator->name,
                ]);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    private function sendLowStockAlert(Product $product): void
    {
        $users = User::where('tenant_id', $product->tenant_id)
            ->whereHas('roles', function ($query) {
                $query->whereHas('permissions', function ($q) {
                    $q->where('slug', 'inventory.view');
                });
            })
            ->get();

        foreach ($users as $user) {
            $user->notify(new LowStockAlert($product));
        }
    }
}
