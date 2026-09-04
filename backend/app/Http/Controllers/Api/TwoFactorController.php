<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorController extends Controller
{
    protected Google2FA $google2fa;

    public function __construct()
    {
        $this->google2fa = new Google2FA();
    }

    /**
     * Génère un nouveau secret 2FA et un QR code à scanner.
     * Le 2FA n'est PAS encore actif à ce stade — il faut confirmer avec un code valide.
     */
    public function enable(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasTwoFactorEnabled()) {
            return response()->json(['message' => 'Le 2FA est déjà activé.'], 422);
        }

        $secret = $this->google2fa->generateSecretKey();

        $user->forceFill([
            'two_factor_secret' => $secret,
            'two_factor_confirmed_at' => null,
        ])->save();

        $qrCodeUrl = $this->google2fa->getQRCodeUrl(
            config('app.name'),
            $user->email,
            $secret
        );

        return response()->json([
            'message' => 'Scannez ce QR code avec votre application d\'authentification, puis confirmez avec un code.',
            'secret' => $secret,
            'qr_code_url' => $qrCodeUrl,
        ]);
    }

    /**
     * Confirme l'activation du 2FA avec le premier code saisi par l'utilisateur.
     * Génère aussi les codes de récupération à ce moment-là.
     */
    public function confirm(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string',
        ]);

        $user = $request->user();

        if (! $user->two_factor_secret) {
            return response()->json(['message' => 'Aucune procédure d\'activation 2FA en cours.'], 422);
        }

        $valid = $this->google2fa->verifyKey($user->two_factor_secret, $validated['code']);

        if (! $valid) {
            return response()->json(['message' => 'Code invalide.'], 422);
        }

        $recoveryCodes = collect(range(1, 8))->map(function () {
            return Str::random(10).'-'.Str::random(10);
        })->toArray();

        $user->forceFill([
            'two_factor_confirmed_at' => now(),
            'two_factor_recovery_codes' => json_encode($recoveryCodes),
        ])->save();

        return response()->json([
            'message' => '2FA activé avec succès.',
            'recovery_codes' => $recoveryCodes,
        ]);
    }

    /**
     * Désactive le 2FA. Exige le mot de passe pour confirmer une action sensible.
     */
    public function disable(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'password' => 'required|string',
        ]);

        $user = $request->user();

        if (! Hash::check($validated['password'], $user->password)) {
            return response()->json(['message' => 'Mot de passe incorrect.'], 422);
        }

        $user->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ])->save();

        return response()->json(['message' => '2FA désactivé avec succès.']);
    }

    /**
     * Vérifie le code 2FA lors de la connexion (deuxième étape du login).
     */
    public function verify(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'code' => 'required|string',
        ]);

        $user = \App\Models\User::where('email', $validated['email'])->first();

        if (! $user || ! $user->hasTwoFactorEnabled()) {
            return response()->json(['message' => 'Requête invalide.'], 422);
        }

        $valid = $this->google2fa->verifyKey($user->two_factor_secret, $validated['code']);

        // Vérifie aussi les codes de récupération si le code TOTP échoue
        if (! $valid && $user->two_factor_recovery_codes) {
            $recoveryCodes = json_decode($user->two_factor_recovery_codes, true);

            if (in_array($validated['code'], $recoveryCodes, true)) {
                $valid = true;

                // Le code de récupération utilisé est retiré (usage unique)
                $remainingCodes = array_values(array_diff($recoveryCodes, [$validated['code']]));
                $user->forceFill([
                    'two_factor_recovery_codes' => json_encode($remainingCodes),
                ])->save();
            }
        }

        if (! $valid) {
            return response()->json(['message' => 'Code invalide.'], 422);
        }

        Auth::login($user, true);
        $request->session()->regenerate();

        return response()->json([
            'message' => 'Connexion réussie.',
            'user' => $user,
        ]);
    }
}
