'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">NEXUS</h1>
          <button
            onClick={handleLogout}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Se déconnecter
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900">Bienvenue, {user.name} 👋</h2>
          <dl className="mt-4 space-y-2 text-sm text-gray-600">
            <div>
              <dt className="inline font-medium text-gray-900">Email : </dt>
              <dd className="inline">{user.email}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-gray-900">Email vérifié : </dt>
              <dd className="inline">
                {user.email_verified_at ? '✅ Oui' : '⚠️ Non — vérifiez votre boîte mail'}
              </dd>
            </div>
          </dl>
        </div>
      </main>
    </div>
  );
}
