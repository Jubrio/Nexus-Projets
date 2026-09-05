<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Génère un lien de reset password vers le frontend Next.js
        // au lieu d'une route Laravel classique (inexistante en API pure)
        ResetPassword::createUrlUsing(function ($user, string $token) {
            return config('app.frontend_url').'/reset-password?token='.$token.'&email='.urlencode($user->email);
        });

        // Connecte le système RBAC (rôles/permissions par tenant) aux Gates
        // natifs de Laravel. Permet d'utiliser $user->can('slug'), @can('slug')
        // côté Blade, ou le middleware 'can:slug' sur les routes.
        Gate::before(function (User $user, string $ability) {
            return $user->hasPermission($ability) ? true : null;
        });
    }
}
