<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Project;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SearchController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = $request->input('q', '');
        $limit = $request->input('limit', 20);

        if (strlen($query) < 2) {
            return response()->json(['results' => []]);
        }

        $tenantId = $request->user()->tenant_id;
        $searchTerm = '%' . $query . '%';

        $results = [];

        // Projets
        if ($request->user()->hasPermission('projects.view')) {
            $results['projects'] = Project::where('tenant_id', $tenantId)
                ->where(function ($q) use ($searchTerm) {
                    $q->where('name', 'LIKE', $searchTerm)
                      ->orWhere('description', 'LIKE', $searchTerm);
                })
                ->limit($limit)
                ->get(['id', 'name', 'description', 'status'])
                ->toArray();
        }

        // Tickets
        if ($request->user()->hasPermission('tickets.view')) {
            $results['tickets'] = Ticket::where('tenant_id', $tenantId)
                ->where(function ($q) use ($searchTerm) {
                    $q->where('title', 'LIKE', $searchTerm)
                      ->orWhere('description', 'LIKE', $searchTerm);
                })
                ->limit($limit)
                ->get(['id', 'title', 'description', 'status', 'priority'])
                ->toArray();
        }

        // Clients
        if ($request->user()->hasPermission('invoices.view')) {
            $results['clients'] = Client::where('tenant_id', $tenantId)
                ->where(function ($q) use ($searchTerm) {
                    $q->where('name', 'LIKE', $searchTerm)
                      ->orWhere('company', 'LIKE', $searchTerm)
                      ->orWhere('email', 'LIKE', $searchTerm);
                })
                ->limit($limit)
                ->get(['id', 'name', 'company', 'email'])
                ->toArray();
        }

        // Factures
        if ($request->user()->hasPermission('invoices.view')) {
            $results['invoices'] = Invoice::where('tenant_id', $tenantId)
                ->where('invoice_number', 'LIKE', $searchTerm)
                ->limit($limit)
                ->get(['id', 'invoice_number', 'client_id', 'total', 'status'])
                ->load('client')
                ->toArray();
        }

        // Produits
        if ($request->user()->hasPermission('inventory.view')) {
            $results['products'] = Product::where('tenant_id', $tenantId)
                ->where(function ($q) use ($searchTerm) {
                    $q->where('name', 'LIKE', $searchTerm)
                      ->orWhere('sku', 'LIKE', $searchTerm)
                      ->orWhere('description', 'LIKE', $searchTerm);
                })
                ->limit($limit)
                ->get(['id', 'name', 'sku', 'unit_price', 'low_stock_threshold'])
                ->map(function ($product) {
                    $product->total_stock = $product->totalStock();
                    $product->is_low_stock = $product->isLowStock();
                    return $product;
                })
                ->toArray();
        }

        return response()->json([
            'query' => $query,
            'results' => $results,
        ]);
    }
}
