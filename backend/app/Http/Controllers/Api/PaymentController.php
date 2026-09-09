<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('invoices.view');

        $query = Payment::with('client', 'invoice')->latest();

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->input('client_id'));
        }

        if ($request->filled('invoice_id')) {
            $query->where('invoice_id', $request->input('invoice_id'));
        }

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('invoices.manage');

        $validated = $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'method' => 'sometimes|in:cash,bank_transfer,credit_card,check',
            'reference' => 'nullable|string|max:255',
        ]);

        $invoice = Invoice::with('payments')->findOrFail($validated['invoice_id']);

        // Protection IDOR : la facture doit appartenir au même tenant
        if ($invoice->tenant_id !== $request->user()->tenant_id) {
            abort(404);
        }

        $remaining = $invoice->getRemainingAmount();

        if ($validated['amount'] > $remaining) {
            throw ValidationException::withMessages([
                'amount' => ["Le montant depasse le solde restant ({$remaining} €)."],
            ]);
        }

        $payment = DB::transaction(function () use ($validated, $invoice, $request) {
            $payment = Payment::create([
                'invoice_id' => $invoice->id,
                'client_id' => $invoice->client_id,
                'amount' => $validated['amount'],
                'payment_date' => $validated['payment_date'],
                'method' => $validated['method'] ?? 'bank_transfer',
                'reference' => $validated['reference'] ?? null,
            ]);

            // Mettre à jour le statut de la facture si elle est completement payee
            $newRemaining = $invoice->getRemainingAmount() - $validated['amount'];

            if ($newRemaining <= 0) {
                $invoice->update(['status' => 'paid']);
            } elseif ($invoice->status === 'draft') {
                $invoice->update(['status' => 'sent']);
            }

            return $payment;
        });

        return response()->json($payment->load('client', 'invoice'), 201);
    }

    public function destroy(Payment $payment): JsonResponse
    {
        $this->authorize('invoices.manage');

        DB::transaction(function () use ($payment) {
            $invoice = $payment->invoice;
            $payment->delete();

            // Remettre la facture en statut sent ou draft
            if ($invoice->status === 'paid') {
                $remaining = $invoice->getRemainingAmount();
                if ($remaining > 0) {
                    $invoice->update(['status' => 'sent']);
                }
            }
        });

        return response()->json(['message' => 'Paiement supprime avec succes.']);
    }
}
