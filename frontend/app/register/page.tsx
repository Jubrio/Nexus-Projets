'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { AxiosError } from 'axios';

const registerSchema = z
  .object({
    organizationName: z.string().min(2, "Le nom de l'organisation doit contenir au moins 2 caractères"),
    name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    email: z.string().email('Email invalide'),
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

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    setIsSubmitting(true);

    try {
      await registerUser(
        data.organizationName,
        data.name,
        data.email,
        data.password,
        data.passwordConfirmation
      );
      router.push('/login?registered=true');
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-gray-900">NEXUS</h1>
          <h2 className="mt-2 text-center text-xl text-gray-600">Créer un compte</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
          {serverError && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{serverError}</div>
          )}

          <div>
            <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700">
              Nom de l&apos;organisation
            </label>
            <input
              id="organizationName"
              type="text"
              placeholder="Acme Corp"
              {...register('organizationName')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
            {errors.organizationName && (
              <p className="mt-1 text-sm text-red-600">{errors.organizationName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Votre nom complet
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

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

          <div>
            <label
              htmlFor="passwordConfirmation"
              className="block text-sm font-medium text-gray-700"
            >
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
            {isSubmitting ? 'Création en cours...' : 'Créer mon compte'}
          </button>

          <p className="text-center text-sm text-gray-600">
            Déjà un compte ?{' '}
            <Link href="/login" className="font-medium text-black hover:underline">
              Se connecter
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
