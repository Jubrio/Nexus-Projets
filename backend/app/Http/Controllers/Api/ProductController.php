<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Supplier;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ProductController extends Controller
{
    public function index(): JsonResponse
    {
        $this->authorize('inventory.view');

        $products = Product::with('supplier', 'warehouses')->latest()->get()->map(function (Product $product) {
            return [
                ...$product->toArray(),
                'total_stock' => $product->totalStock(),
                'is_low_stock' => $product->isLowStock(),
            ];
        });

        return response()->json($products);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('inventory.manage');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'unit_price' => 'required|numeric|min:0',
            'low_stock_threshold' => 'sometimes|integer|min:0',
        ]);

        if (! empty($validated['supplier_id'])) {
            Supplier::where('tenant_id', $request->user()->tenant_id)
                ->findOrFail($validated['supplier_id']);
        }

        $product = Product::create($validated);

        return response()->json($product->load('supplier'), 201);
    }

    public function show(Product $product): JsonResponse
    {
        $this->authorize('inventory.view');

        return response()->json([
            ...$product->load('supplier', 'warehouses')->toArray(),
            'total_stock' => $product->totalStock(),
            'is_low_stock' => $product->isLowStock(),
        ]);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $this->authorize('inventory.manage');

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'sku' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'unit_price' => 'sometimes|numeric|min:0',
            'low_stock_threshold' => 'sometimes|integer|min:0',
        ]);

        if (! empty($validated['supplier_id'])) {
            Supplier::where('tenant_id', $request->user()->tenant_id)
                ->findOrFail($validated['supplier_id']);
        }

        $product->update($validated);

        return response()->json($product->load('supplier'));
    }

    public function destroy(Product $product): JsonResponse
    {
        $this->authorize('inventory.manage');

        $product->delete();

        return response()->json(['message' => 'Produit supprime avec succes.']);
    }

    public function qrCode(Product $product): Response
    {
        $this->authorize('inventory.view');

        $data = json_encode([
            'id' => $product->id,
            'sku' => $product->sku,
            'name' => $product->name,
            'url' => config('app.frontend_url') . '/inventory/products/' . $product->id,
        ]);

        $options = new QROptions([
            'version' => 5,
            'outputType' => 'png',
            'eccLevel' => 1,
            'scale' => 10,
            'imageBase64' => false,
        ]);

        $qrCode = new QRCode($options);
        $imageData = $qrCode->render($data);

        return response($imageData)
            ->header('Content-Type', 'image/png')
            ->header('Content-Disposition', 'inline; filename="qrcode_' . $product->sku . '.png"');
    }
}
