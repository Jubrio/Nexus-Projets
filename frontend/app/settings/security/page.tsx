'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/context/AuthContext';
import { enableTwoFactor, confirmTwoFactor, disableTwoFactor } from '@/lib/twoFactor';
import { AxiosError } from 'axios';
import Link from 'next/link';

type Step = 'idle' | 'qr-shown' | 'confirmed';

export default function SecuritySettingsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [step, setStep] = useState<Step>('idle');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  const handleEnable = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const data = await enableTwoFactor();
      setQrCodeUrl(data.qr_code_url);
      setSecret(data.secret);
      setStep('qr-shown');
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Une erreur est survenue.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const data = await confirmTwoFactor(code);
      setRecoveryCodes(data.recovery_codes);
      setStep('confirmed');
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Une erreur est survenue.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">NEXUS</h1>
          <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:underline">
            ← Retour au dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900">
            Authentification à deux facteurs (2FA)
          </h2>

          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}

          {step === 'idle' && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                Ajoutez une couche de sécurité supplémentaire à votre compte en activant la
                vérification en deux étapes.
              </p>
              <button
                onClick={handleEnable}
                disabled={isSubmitting}
                className="mt-4 rounded-md bg-black px-4 py-2 text-white transition hover:bg-gray-800 disabled:opacity-50"
              >
                {isSubmitting ? 'Génération...' : 'Activer le 2FA'}
              </button>
            </div>
          )}

          {step === 'qr-shown' && (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-gray-600">
                1. Scannez ce QR code avec Google Authenticator, Authy, ou une application
                similaire.
              </p>
              <div className="flex justify-center rounded-md border border-gray-200 p-6">
                <QRCodeSVG value={qrCodeUrl} size={200} />
              </div>
              <p className="text-center text-xs text-gray-500">
                Ou entrez cette clé manuellement : <code className="font-mono">{secret}</code>
              </p>

              <p className="text-sm text-gray-600">
                2. Entrez le code à 6 chiffres affiché dans votre application :
              </p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-center text-lg tracking-widest text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />

              <button
                onClick={handleConfirm}
                disabled={isSubmitting || code.length !== 6}
                className="w-full rounded-md bg-black px-4 py-2 text-white transition hover:bg-gray-800 disabled:opacity-50"
              >
                {isSubmitting ? 'Vérification...' : 'Confirmer et activer'}
              </button>
            </div>
          )}

          {step === 'confirmed' && (
            <div className="mt-4 space-y-4">
              <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
                2FA activé avec succès ! Conservez ces codes de récupération dans un endroit sûr
                — ils vous permettront de vous connecter si vous perdez l&apos;accès à votre
                application d&apos;authentification.
              </div>
              <div className="grid grid-cols-2 gap-2 rounded-md bg-gray-50 p-4 font-mono text-sm text-gray-900">
                {recoveryCodes.map((rc) => (
                  <div key={rc}>{rc}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
