'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getProjects, createProject, Project } from '@/lib/projects';
import { AxiosError } from 'axios';

export default function ProjectsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch {
      setLoadError("Vous n'avez pas accès à cette page.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      loadProjects();
    }
  }, [authLoading, user, router, loadProjects]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setIsCreating(true);

    try {
      const project = await createProject(name, description);
      setProjects([project, ...projects]);
      setName('');
      setDescription('');
      setShowForm(false);
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.message) {
        setCreateError(err.response.data.message);
      } else {
        setCreateError('Une erreur est survenue.');
      }
    } finally {
      setIsCreating(false);
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
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">NEXUS</h1>
          <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:underline">
            ← Retour au dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Projets</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            + Nouveau projet
          </button>
        </div>

        {loadError && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{loadError}</div>
        )}

        {showForm && (
          <form onSubmit={handleCreate} className="mb-6 rounded-lg bg-white p-6 shadow">
            {createError && (
              <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
                {createError}
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Nom du projet</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Description (optionnel)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <button
              type="submit"
              disabled={isCreating}
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {isCreating ? 'Création...' : 'Créer le projet'}
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="block rounded-lg bg-white p-5 shadow transition hover:shadow-md"
            >
              <h3 className="font-semibold text-gray-900">{project.name}</h3>
              {project.description && (
                <p className="mt-1 line-clamp-2 text-sm text-gray-500">{project.description}</p>
              )}
              <p className="mt-3 text-xs text-gray-400">
                {project.tasks_count ?? 0} tâche{(project.tasks_count ?? 0) !== 1 ? 's' : ''} ·
                {project.creator ? `Créé par ${project.creator.name}` : 'Créé par un utilisateur supprimé'}
              </p>
            </Link>
          ))}

          {projects.length === 0 && !loadError && (
            <p className="col-span-full text-center text-gray-500">
              Aucun projet pour l&apos;instant. Créez-en un pour commencer !
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
