'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getMembers, getRoles, updateMemberRole, inviteMember, Member, Role } from '@/lib/organization';
import { AxiosError } from 'axios';

export default function TeamSettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoleId, setInviteRoleId] = useState<number | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [membersData, rolesData] = await Promise.all([getMembers(), getRoles()]);
      setMembers(membersData);
      setRoles(rolesData);
      if (rolesData.length > 0 && inviteRoleId === null) {
        const memberRole = rolesData.find((r) => r.slug === 'member');
        setInviteRoleId(memberRole ? memberRole.id : rolesData[0].id);
      }
    } catch {
      setLoadError("Vous n'avez pas accès à cette page.");
    } finally {
      setIsLoading(false);
    }
  }, [inviteRoleId]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, router]);

  const handleRoleChange = async (userId: number, roleId: number) => {
    try {
      await updateMemberRole(userId, roleId);
      await loadData();
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.message) {
        alert(err.response.data.message);
      }
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteRoleId) return;

    setInviteError(null);
    setInviteSuccess(false);
    setIsInviting(true);

    try {
      await inviteMember(inviteEmail, inviteRoleId);
      setInviteSuccess(true);
      setInviteEmail('');
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.message) {
        setInviteError(err.response.data.message);
      } else {
        setInviteError('Une erreur est survenue.');
      }
    } finally {
      setIsInviting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">NEXUS</h1>
          <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:underline">
            ← Retour au dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        {loadError ? (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{loadError}</div>
        ) : (
          <>
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-lg font-semibold text-gray-900">Inviter un membre</h2>

              {inviteSuccess && (
                <div className="mt-4 rounded-md bg-green-50 p-4 text-sm text-green-700">
                  Invitation envoyée avec succès.
                </div>
              )}
              {inviteError && (
                <div className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
                  {inviteError}
                </div>
              )}

              <form onSubmit={handleInvite} className="mt-4 flex gap-3">
                <input
                  type="email"
                  required
                  placeholder="email@exemple.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
                <select
                  value={inviteRoleId ?? ''}
                  onChange={(e) => setInviteRoleId(Number(e.target.value))}
                  className="rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="rounded-md bg-black px-4 py-2 text-white transition hover:bg-gray-800 disabled:opacity-50"
                >
                  {isInviting ? 'Envoi...' : 'Inviter'}
                </button>
              </form>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-lg font-semibold text-gray-900">
                Membres ({members.length})
              </h2>

              <div className="mt-4 divide-y divide-gray-100">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                    <select
                      value={member.roles[0]?.id ?? ''}
                      onChange={(e) => handleRoleChange(member.id, Number(e.target.value))}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
