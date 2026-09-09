<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function index(): JsonResponse
    {
        $this->authorize('invoices.view');

        $clients = Client::withCount('invoices')->latest()->get();

        return response()->json($clients);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('invoices.manage');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'company' => 'nullable|string|max:255',
            'tax_id' => 'nullable|string|max:100',
        ]);

        $client = Client::create($validated);

        return response()->json($client, 201);
    }

    public function show(Client $client): JsonResponse
    {
        $this->authorize('invoices.view');

        return response()->json($client->load('invoices'));
    }

    public function update(Request $request, Client $client): JsonResponse
    {
        $this->authorize('invoices.manage');

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'company' => 'nullable|string|max:255',
            'tax_id' => 'nullable|string|max:100',
        ]);

        $client->update($validated);

        return response()->json($client);
    }

    public function destroy(Client $client): JsonResponse
    {
        $this->authorize('invoices.manage');

        if ($client->invoices()->count() > 0) {
            return response()->json([
                'message' => 'Ce client a des factures. Supprimez-les d\'abord.'
            ], 422);
        }

        $client->delete();

        return response()->json(['message' => 'Client supprime avec succes.']);
    }
}
