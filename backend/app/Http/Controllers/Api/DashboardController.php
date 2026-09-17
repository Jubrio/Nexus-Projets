<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Project;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $activeProjects = Project::where('status', 'active')->count();

        $openTickets = Ticket::whereIn('status', ['open', 'in_progress'])->count();

        $overdueTickets = Ticket::whereIn('status', ['open', 'in_progress'])
            ->whereNotNull('sla_due_at')
            ->where('sla_due_at', '<', now())
            ->count();

        $ticketsByStatus = Ticket::selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $lowStockProducts = Product::with('warehouses')
            ->get()
            ->filter(fn (Product $p) => $p->isLowStock())
            ->map(fn (Product $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'sku' => $p->sku,
                'total_stock' => $p->totalStock(),
                'threshold' => $p->low_stock_threshold,
            ])
            ->values();

        $unpaidTotal = Invoice::whereIn('status', ['sent', 'overdue'])->sum('total');

        $recentActivity = AuditLog::with('user')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (AuditLog $log) => [
                'id' => $log->id,
                'action' => $log->action,
                'auditable_type' => class_basename($log->auditable_type),
                'user_name' => $log->user?->name ?? 'Système',
                'created_at' => $log->created_at,
            ]);

        return response()->json([
            'active_projects' => $activeProjects,
            'open_tickets' => $openTickets,
            'overdue_tickets' => $overdueTickets,
            'tickets_by_status' => [
                'open' => $ticketsByStatus->get('open', 0),
                'in_progress' => $ticketsByStatus->get('in_progress', 0),
                'resolved' => $ticketsByStatus->get('resolved', 0),
                'closed' => $ticketsByStatus->get('closed', 0),
            ],
            'low_stock_products' => $lowStockProducts,
            'low_stock_count' => $lowStockProducts->count(),
            'unpaid_total' => (float) $unpaidTotal,
            'recent_activity' => $recentActivity,
        ]);
    }
}
