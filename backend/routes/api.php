<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\TwoFactorController;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;

Route::prefix('v1')->group(function () {

    // Routes publiques (non authentifiées) — limitées à 5 tentatives/minute par IP
    Route::middleware('throttle:5,1')->group(function () {
        Route::post('/auth/register', [AuthController::class, 'register']);
        Route::post('/auth/login', [AuthController::class, 'login']);
    });

    // Vérification du code 2FA lors de la connexion — limité contre le brute-force
    Route::post('/auth/2fa/verify', [TwoFactorController::class, 'verify'])
        ->middleware('throttle:5,1');

    // Vérification d'email — lien signé, sécurisé contre la falsification
    Route::get('/auth/email/verify/{id}/{hash}', function (Request $request, $id, $hash) {
        $user = User::findOrFail($id);

        if (! hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            return response()->json(['message' => 'Lien de vérification invalide.'], 403);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email déjà vérifié.']);
        }

        $user->markEmailAsVerified();

        return response()->json(['message' => 'Email vérifié avec succès.']);
    })->middleware(['signed'])->name('verification.verify');

    // Mot de passe oublié — envoie un email avec un lien de réinitialisation
    Route::post('/auth/forgot-password', function (Request $request) {
        $validated = $request->validate(['email' => 'required|email']);

        Password::sendResetLink($validated);

        return response()->json([
            'message' => 'Si cet email existe, un lien de réinitialisation a été envoyé.',
        ]);
    })->middleware('throttle:3,1');

    // Réinitialisation du mot de passe avec le token reçu par email
    Route::post('/auth/reset-password', function (Request $request) {
        $validated = $request->validate([
            'token' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|confirmed|min:8',
        ]);

        $status = Password::reset(
            $validated,
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->setRememberToken(Str::random(60));

                $user->save();

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json(['message' => 'Mot de passe réinitialisé avec succès.']);
        }

        return response()->json(['message' => 'Ce lien de réinitialisation est invalide ou expiré.'], 422);
    })->middleware('throttle:3,1');

    // Routes protégées (authentification requise)
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/user', [AuthController::class, 'user']);

        // Renvoyer l'email de vérification — limité à 3/minute pour éviter le spam
        Route::post('/auth/email/resend', function (Request $request) {
            if ($request->user()->hasVerifiedEmail()) {
                return response()->json(['message' => 'Email déjà vérifié.']);
            }

            $request->user()->sendEmailVerificationNotification();

            return response()->json(['message' => 'Email de vérification renvoyé.']);
        })->middleware('throttle:3,1');

        // Gestion du 2FA — activation, confirmation, désactivation
        Route::prefix('2fa')->group(function () {
            Route::post('/enable', [TwoFactorController::class, 'enable']);
            Route::post('/confirm', [TwoFactorController::class, 'confirm']);
            Route::post('/disable', [TwoFactorController::class, 'disable']);
        });

        // Gestion de l'organisation — membres et rôles
        Route::prefix('organization')->group(function () {
            Route::get('/users', [OrganizationController::class, 'users']);
            Route::get('/roles', [OrganizationController::class, 'roles']);
            Route::put('/users/{user}/role', [OrganizationController::class, 'updateUserRole']);
        });
    });

});
