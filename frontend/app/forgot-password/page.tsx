'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);

    try {
      await forgotPassword(data.email);
    } finally {
      // On affiche toujours le même message, que l'email existe ou non
      // (anti-énumération, cohérent avec le comportement du backend)
      setIsSubmitted(true);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-gray-900">NEXUS</h1>
          <h2 className="mt-2 text-center text-xl text-gray-600">Mot de passe oublié</h2>
        </div>

        {isSubmitted ? (
          <div className="space-y-4">
            <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
              Si cet email existe dans notre système, un lien de réinitialisation vient de vous
              être envoyé. Vérifiez votre boîte mail.
            </div>
            <p className="text-center text-sm text-gray-600">
              <Link href="/login" className="font-medium text-black hover:underline">
                Retour à la connexion
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <p className="text-sm text-gray-600">
              Entrez votre adresse email, nous vous enverrons un lien pour réinitialiser votre
              mot de passe.
            </p>

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
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-black px-4 py-2 text-white transition hover:bg-gray-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Envoi en cours...' : 'Envoyer le lien'}
            </button>

            <p className="text-center text-sm text-gray-600">
              <Link href="/login" className="font-medium text-black hover:underline">
                Retour à la connexion
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
