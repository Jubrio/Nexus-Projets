<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WarehouseController extends Controller
{
    public function index(): JsonResponse
    {
        $this->authorize('inventory.view');

        return response()->json(Warehouse::latest()->get());
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('inventory.manage');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
        ]);

        $warehouse = Warehouse::create($validated);

        return response()->json($warehouse, 201);
    }

    public function update(Request $request, Warehouse $warehouse): JsonResponse
    {
        $this->authorize('inventory.manage');

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'location' => 'nullable|string|max:255',
        ]);

        $warehouse->update($validated);

        return response()->json($warehouse);
    }

    public function destroy(Warehouse $warehouse): JsonResponse
    {
        $this->authorize('inventory.manage');

        $warehouse->delete();

        return response()->json(['message' => 'Entrepôt supprimé avec succès.']);
    }
}
