'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  getTicket,
  updateTicket,
  getTicketComments,
  addTicketComment,
  Ticket,
  TicketComment,
} from '@/lib/tickets';
import { getMembers, Member } from '@/lib/organization';

const STATUS_LABELS: Record<string, string> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  resolved: 'Résolu',
  closed: 'Fermé',
};

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = Number(params.id);
  const { user, isLoading: authLoading } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [ticketData, membersData, commentsData] = await Promise.all([
        getTicket(ticketId),
        getMembers(),
        getTicketComments(ticketId),
      ]);
      setTicket(ticketData);
      setMembers(membersData);
      setComments(commentsData);
    } catch {
      setLoadError("Ce ticket n'existe pas ou vous n'y avez pas accès.");
    } finally {
      setIsLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      loadData();
    }
  }, [authLoading, user, router, loadData]);

  const handleStatusChange = async (status: string) => {
    await updateTicket(ticketId, { status });
    await loadData();
  };

  const handleAssigneeChange = async (assignedTo: string) => {
    await updateTicket(ticketId, { assigned_to: assignedTo ? Number(assignedTo) : null });
    await loadData();
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsCommenting(true);
    try {
      const comment = await addTicketComment(ticketId, newComment);
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

  if (loadError || !ticket) {
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
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Link href="/tickets" className="text-sm text-gray-500 hover:underline">
            ← Tickets
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-start justify-between">
            <h1 className="text-xl font-bold text-gray-900">{ticket.title}</h1>
            {ticket.is_overdue && (
              <span className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                En retard (SLA dépassé)
              </span>
            )}
          </div>

          {ticket.description && (
            <p className="mt-2 text-sm text-gray-600">{ticket.description}</p>
          )}

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500">Statut</label>
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500">Assigné à</label>
              <select
                value={ticket.assignee?.id ?? ''}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              >
                <option value="">Non assigné</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-sm font-semibold text-gray-900">Commentaires</h2>

          <form onSubmit={handleAddComment} className="mt-3 flex gap-2">
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
              className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
            >
              Envoyer
            </button>
          </form>

          <div className="mt-4 space-y-3">
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
      </main>
    </div>
  );
}
