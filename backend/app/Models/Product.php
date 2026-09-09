<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Product extends Model
{
    use BelongsToTenant, HasFactory, LogsActivity;

    protected $fillable = [
        'tenant_id', 'supplier_id', 'sku', 'name', 'description',
        'unit_price', 'low_stock_threshold',
    ];

    protected function casts(): array
    {
        return [
            'unit_price' => 'decimal:2',
        ];
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function warehouses(): BelongsToMany
    {
        return $this->belongsToMany(Warehouse::class, 'product_warehouse_stock')
            ->withPivot('quantity')
            ->withTimestamps();
    }

    public function totalStock(): int
    {
        return (int) $this->warehouses()->sum('product_warehouse_stock.quantity');
    }

    public function isLowStock(): bool
    {
        return $this->totalStock() <= $this->low_stock_threshold;
    }
}
