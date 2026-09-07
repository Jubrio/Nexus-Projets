'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  AppNotification,
} from '@/lib/notifications';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch {
      // Silencieux : ne pas gêner l'utilisateur si le polling échoue ponctuellement
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  const handleOpen = () => {
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.read_at) {
      await markNotificationAsRead(notification.id);
      await load();
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    await load();
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative rounded-md p-2 text-gray-600 hover:bg-gray-100"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
            <span className="text-sm font-medium text-gray-900">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-gray-500 hover:underline"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-gray-400">Aucune notification.</p>
            ) : (
              notifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={notification.data.ticket_id ? `/tickets/${notification.data.ticket_id}` : '#'}
                  onClick={() => handleNotificationClick(notification)}
                  className={`block border-b border-gray-50 px-4 py-3 text-sm hover:bg-gray-50 ${
                    !notification.read_at ? 'bg-blue-50/50 font-medium' : 'text-gray-600'
                  }`}
                >
                  {notification.data.message}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
