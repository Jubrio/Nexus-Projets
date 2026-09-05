<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

class Ticket extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id', 'assigned_to', 'created_by',
        'title', 'description', 'category', 'priority', 'status',
        'sla_due_at', 'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'sla_due_at' => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }

    // Délai SLA en heures, selon la priorité (section 4 du cahier des charges)
    public const SLA_HOURS = [
        'urgent' => 2,
        'high' => 4,
        'medium' => 24,
        'low' => 72,
    ];

    public static function calculateSlaDueAt(string $priority): Carbon
    {
        $hours = self::SLA_HOURS[$priority] ?? self::SLA_HOURS['medium'];

        return now()->addHours($hours);
    }

    public function isOverdue(): bool
    {
        return $this->status !== 'resolved'
            && $this->status !== 'closed'
            && $this->sla_due_at
            && $this->sla_due_at->isPast();
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(TicketComment::class)->latest();
    }
}
