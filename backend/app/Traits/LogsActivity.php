<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

trait LogsActivity
{
    public static function bootLogsActivity()
    {
        static::created(function ($model) {
            $model->logActivity('create', null, $model->getAttributes());
        });

        static::updated(function ($model) {
            $model->logActivity('update', $model->getOriginal(), $model->getAttributes());
        });

        static::deleted(function ($model) {
            $model->logActivity('delete', $model->getAttributes(), null);
        });
    }

    protected function logActivity(string $action, $oldValues, $newValues)
    {
        if (!Auth::check()) {
            return;
        }

        AuditLog::create([
            'tenant_id' => Auth::user()->tenant_id,
            'user_id' => Auth::id(),
            'action' => $action,
            'auditable_type' => get_class($this),
            'auditable_id' => $this->id,
            'old_values' => $oldValues ? $this->sanitizeValues($oldValues) : null,
            'new_values' => $newValues ? $this->sanitizeValues($newValues) : null,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ]);
    }

    protected function sanitizeValues(array $values): array
    {
        // Ne pas logger les champs sensibles
        unset($values['password'], $values['remember_token'], $values['two_factor_secret']);

        return $values;
    }
}
