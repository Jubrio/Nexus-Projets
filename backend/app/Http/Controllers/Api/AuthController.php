<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        event(new \Illuminate\Auth\Events\Registered($user));

        return response()->json([
            'message' => 'Inscription réussie. Veuillez vérifier votre email.',
            'user' => $user,
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Les identifiants fournis sont incorrects.'],
            ]);
        }

        // Si le 2FA est activé, on ne connecte PAS l'utilisateur directement.
        // On demande le code TOTP via une étape supplémentaire (/auth/2fa/verify).
        if ($user->hasTwoFactorEnabled()) {
            return response()->json([
                'message' => 'Code de vérification à deux facteurs requis.',
                'requires_2fa' => true,
                'email' => $user->email,
            ]);
        }

        Auth::login($user, true);
        $request->session()->regenerate();

        return response()->json([
            'message' => 'Connexion réussie.',
            'user' => Auth::user(),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Déconnexion réussie.',
        ]);
    }

    public function user(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }
}
