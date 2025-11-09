import { Fragment, useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Bars3Icon,
  BellIcon,
  ChartPieIcon,
  DocumentCheckIcon,
  HomeIcon,
  TagIcon,
  XMarkIcon,
  ClipboardDocumentListIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, AcademicCapIcon, BanknotesIcon, UserCircleIcon } from '@heroicons/react/24/solid';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import useAuth from '../hooks/useAuth.js';
import api from '../api/api.js';
import { formatCurrency, formatDate } from '../utils/format.js';

const baseNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { to: '/finances/incomes', label: 'Incomes', icon: ArrowTrendingUpIcon },
  { to: '/finances/expenses', label: 'Expenses', icon: ArrowTrendingDownIcon },
  { to: '/finances/summary', label: 'Summary', icon: ChartPieIcon },
  { to: '/scholarships', label: 'Scholarships', icon: AcademicCapIcon },
  { to: '/scholarships/history', label: 'Scholarship History', icon: DocumentCheckIcon },
  { to: '/loans', label: 'Loans', icon: BanknotesIcon },
  { to: '/notifications', label: 'Notifications', icon: BellIcon },
  { to: '/profile', label: 'Profile', icon: UserCircleIcon }
];

const NotificationPreview = ({ notifications = [], onViewAll }) => {
  if (!notifications.length) {
    return <p className="px-4 py-3 text-sm text-muted">You are all caught up.</p>;
  }

  return (
    <div className="max-h-72 w-80 overflow-y-auto">
      <ul className="divide-y divide-slate-100">
        {notifications.map((notification) => (
          <li key={notification.id} className="p-4">
            <p className="text-sm font-medium text-slate-900">{notification.title}</p>
            {notification.message && <p className="mt-1 text-xs text-muted">{notification.message}</p>}
            <p className="mt-2 text-xs text-muted">{formatDate(notification.created_at)}</p>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onViewAll}
        className="flex w-full items-center justify-center gap-2 border-t border-slate-100 px-4 py-3 text-sm font-medium text-primary transition hover:bg-slate-50"
      >
        View all notifications
      </button>
    </div>
  );
};

const AppShell = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications', 'header'],
    queryFn: async () => {
      const { data } = await api.get('/api/notifications/', {
        params: { ordering: '-created_at', page_size: 5 }
      });
      return data;
    },
    staleTime: 60 * 1000
  });

  const unreadCount = useMemo(() => {
    if (!notificationsData) return 0;
    if (typeof notificationsData.unread_count === 'number') {
      return notificationsData.unread_count;
    }
    if (Array.isArray(notificationsData.results)) {
      return notificationsData.results.filter((item) => !item.is_read && !item.read).length;
    }
    return 0;
  }, [notificationsData]);

  const previewNotifications = useMemo(() => {
    if (!notificationsData) return [];
    if (Array.isArray(notificationsData.results)) {
      return notificationsData.results.slice(0, 5);
    }
    if (Array.isArray(notificationsData)) {
      return notificationsData.slice(0, 5);
    }
    return [];
  }, [notificationsData]);

  const handleSignOut = () => {
    logout();
  };

  const isAdmin = Boolean(user && (user.role === 'admin' || user.is_staff));

  const navItems = useMemo(() => {
    if (!isAdmin) {
      return baseNavItems;
    }
    return [
      ...baseNavItems.slice(0, 6),
      { to: '/admin/scholarships', label: 'Manage Scholarships', icon: AcademicCapIcon },
      { to: '/admin/categories', label: 'Expense Categories', icon: TagIcon },
      { to: '/admin/loan-schemes', label: 'Loan Schemes', icon: AdjustmentsHorizontalIcon },
      { to: '/admin/loan-applications', label: 'Loan Applications', icon: ClipboardDocumentListIcon },
      ...baseNavItems.slice(6)
    ];
  }, [isAdmin]);

  const renderNavLink = (item) => (
    <NavLink
      key={item.to}
      to={item.to}
      className={({ isActive }) =>
        clsx(
          'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
          isActive ? 'bg-primary text-white shadow-soft' : 'text-muted hover:bg-primary/10 hover:text-primary'
        )
      }
      onClick={() => setSidebarOpen(false)}
    >
      <item.icon className="h-5 w-5" aria-hidden="true" />
      {item.label}
    </NavLink>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden min-h-screen w-64 flex-shrink-0 border-r border-slate-100 bg-white px-4 py-6 lg:block">
        <div className="flex items-center justify-between px-2">
          <span className="text-base font-semibold text-primary">Finance Tracker</span>
        </div>
        <nav className="mt-8 flex flex-col gap-1">{navItems.map(renderNavLink)}</nav>
        <div className="mt-10 rounded-xl bg-primary/5 px-4 py-6 text-sm text-muted">
          <p className="font-semibold text-primary">Monthly balance</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatCurrency(user?.current_balance ?? 0)}
          </p>
          <p className="mt-1 text-xs text-muted">Track income versus expenses across your active projects.</p>
        </div>
      </aside>

      <div className="flex w-full flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-3 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden"
                onClick={() => setSidebarOpen((prev) => !prev)}
                aria-label="Toggle navigation"
              >
                <Bars3Icon className="h-5 w-5" aria-hidden="true" />
              </button>
              <div className="hidden text-sm font-medium text-muted sm:block">
                {user?.first_name ? `Hi, ${user.first_name}` : 'Student Finance Dashboard'}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((prev) => !prev)}
                  className="relative rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  aria-label="View notifications"
                >
                  <BellIcon className="h-5 w-5" aria-hidden="true" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 origin-top-right rounded-xl border border-slate-100 bg-white shadow-xl">
                    <NotificationPreview
                      notifications={previewNotifications}
                      onViewAll={() => {
                        navigate('/notifications');
                        setNotificationsOpen(false);
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden flex-col text-right text-xs font-medium text-muted sm:flex">
                  <span className="text-slate-900">{user?.first_name} {user?.last_name}</span>
                  <span>{user?.email}</span>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-full border border-primary/30 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      <AnimatePresence>
        {sidebarOpen && (
          <AnimateSidebar
            key="mobile-sidebar"
            onClose={() => setSidebarOpen(false)}
            shouldReduceMotion={shouldReduceMotion}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-base font-semibold text-primary">Finance Tracker</span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                aria-label="Close navigation"
              >
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <nav className="px-4 pb-6">
              <div className="flex flex-col gap-1">{navItems.map(renderNavLink)}</div>
            </nav>
          </AnimateSidebar>
        )}
      </AnimatePresence>
    </div>
  );
};

const AnimateSidebar = ({ onClose, shouldReduceMotion, children }) => {
  return (
    <Fragment>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-slate-900/40"
        onClick={onClose}
        role="presentation"
      />
      <motion.aside
        initial={shouldReduceMotion ? false : { x: '-100%' }}
        animate={shouldReduceMotion ? { opacity: 1 } : { x: 0 }}
        exit={shouldReduceMotion ? { opacity: 0 } : { x: '-100%' }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-slate-100 bg-white shadow-xl lg:hidden"
      >
        {children}
      </motion.aside>
    </Fragment>
  );
};

export default AppShell;
