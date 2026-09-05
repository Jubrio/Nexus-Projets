<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

class TenantScope implements Scope
{
    /**
     * Filtre automatiquement toute requête sur ce modèle pour ne renvoyer
     * que les enregistrements appartenant au tenant de l'utilisateur connecté.
     * C'est la protection de base contre les attaques IDOR : même si un
     * contrôleur oublie de filtrer par tenant, cette sécurité s'applique quand même.
     */
    public function apply(Builder $builder, Model $model): void
    {
        // En console (seeders, commandes artisan), pas d'utilisateur connecté :
        // on ne filtre pas, sinon les seeders ne pourraient rien créer/lire.
        if (app()->runningInConsole()) {
            return;
        }

        if (Auth::check() && Auth::user()->tenant_id) {
            $builder->where($model->getTable().'.tenant_id', Auth::user()->tenant_id);
        }
    }
}
