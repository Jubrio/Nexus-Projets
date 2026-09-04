'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { AxiosError } from 'axios';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const justRegistered = searchParams.get('registered') === 'true';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    setIsSubmitting(true);

    try {
      const result = await login(data.email, data.password);

      if (result.requiresTwoFactor) {
        router.push(`/login/2fa?email=${encodeURIComponent(result.email || data.email)}`);
        return;
      }

      router.push('/dashboard');
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 429) {
        setServerError('Trop de tentatives. Veuillez réessayer dans une minute.');
      } else if (err instanceof AxiosError && err.response?.data?.errors?.email) {
        setServerError(err.response.data.errors.email[0]);
      } else {
        setServerError('Identifiants incorrects.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-gray-900">NEXUS</h1>
          <h2 className="mt-2 text-center text-xl text-gray-600">Se connecter</h2>
        </div>

        {justRegistered && (
          <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
            Compte créé avec succès. Vérifiez votre email, puis connectez-vous.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
          {serverError && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{serverError}</div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              {...register('password')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-black hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-black px-4 py-2 text-white transition hover:bg-gray-800 disabled:opacity-50"
          >
            {isSubmitting ? 'Connexion...' : 'Se connecter'}
          </button>

          <p className="text-center text-sm text-gray-600">
            Pas encore de compte ?{' '}
            <Link href="/register" className="font-medium text-black hover:underline">
              S&apos;inscrire
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
