<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id', 'client_id', 'invoice_number', 'issue_date', 'due_date',
        'subtotal', 'tax_rate', 'tax_amount', 'total', 'status', 'notes'
    ];

    protected function casts(): array
    {
        return [
            'issue_date' => 'date',
            'due_date' => 'date',
            'subtotal' => 'decimal:2',
            'tax_rate' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(InvoiceLine::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function isOverdue(): bool
    {
        return $this->status !== 'paid' && $this->status !== 'cancelled' && $this->due_date->isPast();
    }

    public function getPaidAmount(): float
    {
        return (float) $this->payments()->sum('amount');
    }

    public function getRemainingAmount(): float
    {
        return (float) $this->total - $this->getPaidAmount();
    }
}
