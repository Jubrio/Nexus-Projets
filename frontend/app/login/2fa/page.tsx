'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AxiosError } from 'axios';

function TwoFactorVerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyTwoFactor } = useAuth();

  const email = searchParams.get('email') || '';
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await verifyTwoFactor(email, code);
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 429) {
        setError('Trop de tentatives. Veuillez réessayer dans une minute.');
      } else {
        setError('Code invalide.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!email) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
        Session expirée, veuillez vous reconnecter.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <p className="text-sm text-gray-600">
        Entrez le code à 6 chiffres généré par votre application d&apos;authentification, ou l&apos;un de
        vos codes de récupération.
      </p>

      <input
        type="text"
        inputMode="numeric"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="123456"
        autoFocus
        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-center text-lg tracking-widest text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
      />

      <button
        type="submit"
        disabled={isSubmitting || code.length < 6}
        className="w-full rounded-md bg-black px-4 py-2 text-white transition hover:bg-gray-800 disabled:opacity-50"
      >
        {isSubmitting ? 'Vérification...' : 'Vérifier'}
      </button>
    </form>
  );
}

export default function TwoFactorLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-gray-900">NEXUS</h1>
          <h2 className="mt-2 text-center text-xl text-gray-600">Vérification en deux étapes</h2>
        </div>

        <Suspense fallback={<p className="text-center text-gray-600">Chargement...</p>}>
          <TwoFactorVerifyForm />
        </Suspense>
      </div>
    </div>
  );
}
