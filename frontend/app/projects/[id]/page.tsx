'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  getProject,
  getTasks,
  createTask,
  updateTaskStatus,
  getTaskComments,
  addTaskComment,
  Project,
  Task,
  TasksByStatus,
  TaskComment,
} from '@/lib/projects';

const COLUMNS: { key: keyof TasksByStatus; label: string }[] = [
  { key: 'todo', label: 'À faire' },
  { key: 'in_progress', label: 'En cours' },
  { key: 'done', label: 'Terminé' },
];

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
};

export default function ProjectKanbanPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = Number(params.id);
  const { user, isLoading: authLoading } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<TasksByStatus>({ todo: [], in_progress: [], done: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [projectData, tasksData] = await Promise.all([
        getProject(projectId),
        getTasks(projectId),
      ]);
      setProject(projectData);
      setTasks(tasksData);
    } catch {
      setLoadError("Ce projet n'existe pas ou vous n'y avez pas accès.");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      loadData();
    }
  }, [authLoading, user, router, loadData]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingTask(true);

    try {
      await createTask(projectId, newTaskTitle);
      setNewTaskTitle('');
      setShowTaskForm(false);
      await loadData();
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleMoveTask = async (task: Task, newStatus: 'todo' | 'in_progress' | 'done') => {
    await updateTaskStatus(projectId, task.id, newStatus);
    await loadData();
  };

  const openTask = async (task: Task) => {
    setSelectedTask(task);
    const data = await getTaskComments(task.id);
    setComments(data);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newComment.trim()) return;

    setIsCommenting(true);
    try {
      const comment = await addTaskComment(selectedTask.id, newComment);
      setComments([comment, ...comments]);
      setNewComment('');
    } finally {
      setIsCommenting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  if (loadError || !project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-md bg-red-50 p-4 text-sm text-red-700">
          {loadError}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <Link href="/projects" className="text-sm text-gray-500 hover:underline">
              ← Projets
            </Link>
            <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
          </div>
          <button
            onClick={() => setShowTaskForm(!showTaskForm)}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            + Nouvelle tâche
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {showTaskForm && (
          <form onSubmit={handleCreateTask} className="mb-6 flex gap-3 rounded-lg bg-white p-4 shadow">
            <input
              type="text"
              required
              placeholder="Titre de la tâche"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
            <button
              type="submit"
              disabled={isCreatingTask}
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {isCreatingTask ? 'Ajout...' : 'Ajouter'}
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {COLUMNS.map((column) => (
            <div key={column.key} className="rounded-lg bg-gray-100 p-4">
              <h2 className="mb-3 text-sm font-semibold text-gray-700">
                {column.label} ({tasks[column.key].length})
              </h2>

              <div className="space-y-3">
                {tasks[column.key].map((task) => (
                  <div
                    key={task.id}
                    onClick={() => openTask(task)}
                    className="cursor-pointer rounded-md bg-white p-3 shadow-sm transition hover:shadow-md"
                  >
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${PRIORITY_COLORS[task.priority]}`}
                      >
                        {task.priority}
                      </span>
                      {task.assignee && (
                        <span className="text-xs text-gray-400">{task.assignee.name}</span>
                      )}
                    </div>

                    <div className="mt-3 flex gap-1" onClick={(e) => e.stopPropagation()}>
                      {COLUMNS.filter((c) => c.key !== column.key).map((target) => (
                        <button
                          key={target.key}
                          onClick={() => handleMoveTask(task, target.key)}
                          className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                        >
                          → {target.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      {selectedTask && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/30 px-4"
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{selectedTask.title}</h3>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <h4 className="mt-6 text-sm font-medium text-gray-700">Commentaires</h4>
            <form onSubmit={handleAddComment} className="mt-2 flex gap-2">
              <input
                type="text"
                placeholder="Ajouter un commentaire..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
              <button
                type="submit"
                disabled={isCommenting}
                className="rounded-md bg-black px-3 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
              >
                Envoyer
              </button>
            </form>

            <div className="mt-4 max-h-64 space-y-3 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="rounded-md bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-700">{comment.user.name}</p>
                  <p className="mt-1 text-sm text-gray-600">{comment.content}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-sm text-gray-400">Aucun commentaire pour l&apos;instant.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
