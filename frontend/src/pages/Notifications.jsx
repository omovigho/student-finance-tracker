import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import api from '../api/api.js';
import { useToast } from '../components/Toast.jsx';
import { formatDate } from '../utils/format.js';

const Notifications = () => {
  const [showUnread, setShowUnread] = useState(false);
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const shouldReduceMotion = useReducedMotion();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', { unread: showUnread }],
    queryFn: async () => {
      const { data: response } = await api.get('/api/notifications/', {
        params: { unread: showUnread || undefined }
      });
      return response;
    }
  });

  const notifications = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data.results)) return data.results;
    if (Array.isArray(data)) return data;
    return [];
  }, [data]);

  const markReadMutation = useMutation({
    mutationFn: (id) => api.post(`/api/notifications/${id}/mark-read/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => pushToast('Unable to update notification.', 'error')
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.post('/api/notifications/mark-all-read/'),
    onSuccess: () => {
      pushToast('All notifications marked as read.', 'success');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => pushToast('Something went wrong.', 'error')
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
          <p className="text-sm text-muted">Review updates from loans, scholarships, and finance workflows.</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <label className="inline-flex items-center gap-2 text-slate-600">
            <input
              type="checkbox"
              checked={showUnread}
              onChange={(event) => setShowUnread(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/60"
            />
            Show unread only
          </label>
          <button
            type="button"
            onClick={() => markAllMutation.mutate()}
            className="rounded-xl border border-primary px-4 py-2 font-semibold text-primary transition hover:bg-primary hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {markAllMutation.isPending ? 'Marking…' : 'Mark all as read'}
          </button>
        </div>
      </header>

      <div className="space-y-4">
        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-muted shadow-sm">Loading notifications…</div>
        ) : notifications.length ? (
          notifications.map((notification) => (
            <motion.article
              key={notification.id}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              className={`rounded-2xl border ${notification.is_read || notification.read ? 'border-slate-200 bg-white' : 'border-primary/40 bg-primary/5'} p-5 shadow-sm`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">{notification.title}</h2>
                  <p className="mt-1 text-xs text-muted">{formatDate(notification.created_at)}</p>
                  {notification.message && <p className="mt-3 text-sm text-slate-600">{notification.message}</p>}
                </div>
                {!notification.is_read && !notification.read && (
                  <button
                    type="button"
                    onClick={() => markReadMutation.mutate(notification.id)}
                    className="rounded-full border border-primary px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </motion.article>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-muted">
            No notifications to display.
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
