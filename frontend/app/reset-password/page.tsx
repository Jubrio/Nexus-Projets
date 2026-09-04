'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { AxiosError } from 'axios';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
      .regex(/[A-Z]/, 'Le mot de passe doit contenir une majuscule')
      .regex(/[a-z]/, 'Le mot de passe doit contenir une minuscule')
      .regex(/[0-9]/, 'Le mot de passe doit contenir un chiffre')
      .regex(/[^A-Za-z0-9]/, 'Le mot de passe doit contenir un symbole'),
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['passwordConfirmation'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token || !email) {
      setServerError('Lien de réinitialisation invalide.');
      return;
    }

    setServerError(null);
    setIsSubmitting(true);

    try {
      await resetPassword(token, email, data.password, data.passwordConfirmation);
      router.push('/login?reset=true');
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.message) {
        setServerError(err.response.data.message);
      } else {
        setServerError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
        Ce lien de réinitialisation est invalide ou incomplet.{' '}
        <Link href="/forgot-password" className="font-medium underline">
          Demander un nouveau lien
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
      {serverError && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{serverError}</div>
      )}

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Nouveau mot de passe
        </label>
        <input
          id="password"
          type="password"
          {...register('password')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
      </div>

      <div>
        <label htmlFor="passwordConfirmation" className="block text-sm font-medium text-gray-700">
          Confirmer le mot de passe
        </label>
        <input
          id="passwordConfirmation"
          type="password"
          {...register('passwordConfirmation')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
        {errors.passwordConfirmation && (
          <p className="mt-1 text-sm text-red-600">{errors.passwordConfirmation.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-black px-4 py-2 text-white transition hover:bg-gray-800 disabled:opacity-50"
      >
        {isSubmitting ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-gray-900">NEXUS</h1>
          <h2 className="mt-2 text-center text-xl text-gray-600">Nouveau mot de passe</h2>
        </div>

        <Suspense fallback={<p className="text-center text-gray-600">Chargement...</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
