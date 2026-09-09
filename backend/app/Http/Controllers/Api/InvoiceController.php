<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\InvoiceLine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InvoiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('invoices.view');

        $query = Invoice::with('client')->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->input('client_id'));
        }

        $invoices = $query->get()->map(function (Invoice $invoice) {
            return [
                ...$invoice->toArray(),
                'is_overdue' => $invoice->isOverdue(),
                'paid_amount' => $invoice->getPaidAmount(),
                'remaining_amount' => $invoice->getRemainingAmount(),
            ];
        });

        return response()->json($invoices);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('invoices.manage');

        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'issue_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:issue_date',
            'tax_rate' => 'sometimes|numeric|min:0|max:100',
            'notes' => 'nullable|string',
            'lines' => 'required|array|min:1',
            'lines.*.description' => 'required|string|max:255',
            'lines.*.quantity' => 'required|integer|min:1',
            'lines.*.unit_price' => 'required|numeric|min:0',
            'lines.*.discount' => 'nullable|numeric|min:0',
        ]);

        // Protection IDOR : le client doit appartenir au même tenant
        Client::where('tenant_id', $request->user()->tenant_id)
            ->findOrFail($validated['client_id']);

        $invoice = DB::transaction(function () use ($validated, $request) {
            $subtotal = 0;
            $linesData = [];

            foreach ($validated['lines'] as $line) {
                $discount = $line['discount'] ?? 0;
                $total = ($line['quantity'] * $line['unit_price']) - $discount;
                $subtotal += $total;

                $linesData[] = [
                    'description' => $line['description'],
                    'quantity' => $line['quantity'],
                    'unit_price' => $line['unit_price'],
                    'discount' => $discount,
                    'total' => $total,
                ];
            }

            $taxRate = $validated['tax_rate'] ?? 0;
            $taxAmount = $subtotal * ($taxRate / 100);
            $total = $subtotal + $taxAmount;

            $invoiceNumber = $this->generateInvoiceNumber();

            $invoice = Invoice::create([
                'client_id' => $validated['client_id'],
                'invoice_number' => $invoiceNumber,
                'issue_date' => $validated['issue_date'],
                'due_date' => $validated['due_date'],
                'subtotal' => $subtotal,
                'tax_rate' => $taxRate,
                'tax_amount' => $taxAmount,
                'total' => $total,
                'notes' => $validated['notes'] ?? null,
                'status' => 'draft',
            ]);

            foreach ($linesData as $lineData) {
                InvoiceLine::create([
                    'invoice_id' => $invoice->id,
                    ...$lineData,
                ]);
            }

            return $invoice->load('client', 'lines');
        });

        return response()->json($invoice, 201);
    }

    public function show(Invoice $invoice): JsonResponse
    {
        $this->authorize('invoices.view');

        return response()->json([
            ...$invoice->load('client', 'lines', 'payments')->toArray(),
            'is_overdue' => $invoice->isOverdue(),
            'paid_amount' => $invoice->getPaidAmount(),
            'remaining_amount' => $invoice->getRemainingAmount(),
        ]);
    }

    public function update(Request $request, Invoice $invoice): JsonResponse
    {
        $this->authorize('invoices.manage');

        if ($invoice->status === 'paid') {
            throw ValidationException::withMessages([
                'status' => ['Impossible de modifier une facture payee.'],
            ]);
        }

        $validated = $request->validate([
            'status' => 'sometimes|in:draft,sent,paid,overdue,cancelled',
            'due_date' => 'sometimes|date|after_or_equal:issue_date',
            'notes' => 'nullable|string',
        ]);

        if (isset($validated['status']) && $validated['status'] === 'paid') {
            $validated['status'] = 'paid';
        }

        $invoice->update($validated);

        return response()->json($invoice->load('client'));
    }

    public function destroy(Invoice $invoice): JsonResponse
    {
        $this->authorize('invoices.manage');

        if ($invoice->status === 'paid') {
            return response()->json([
                'message' => 'Impossible de supprimer une facture payee.'
            ], 422);
        }

        DB::transaction(function () use ($invoice) {
            $invoice->lines()->delete();
            $invoice->payments()->delete();
            $invoice->delete();
        });

        return response()->json(['message' => 'Facture supprimee avec succes.']);
    }

    private function generateInvoiceNumber(): string
    {
        $year = date('Y');
        $month = date('m');
        $last = Invoice::whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->count();

        return 'INV-' . $year . $month . '-' . str_pad($last + 1, 4, '0', STR_PAD_LEFT);
    }
}
