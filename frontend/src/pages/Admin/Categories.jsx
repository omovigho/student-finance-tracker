import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api.js';
import useAuth from '../../hooks/useAuth.js';
import { useToast } from '../../components/Toast.jsx';
import { formatDate } from '../../utils/format.js';

const Categories = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const { user, isBootstrapping } = useAuth();
  const isAdmin = Boolean(user && (user.role === 'admin' || user.is_staff));
  const [name, setName] = useState('');

  useEffect(() => {
    if (!isBootstrapping && !isAdmin) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAdmin, isBootstrapping, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ['finance', 'categories', 'admin'],
    queryFn: async () => {
      const { data: response } = await api.get('/api/finance/categories/');
      return response;
    },
    enabled: isAdmin
  });

  const categories = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data.results)) return data.results;
    if (Array.isArray(data)) return data;
    return [];
  }, [data]);

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/api/finance/categories/', payload),
    onSuccess: () => {
      pushToast('Category added successfully.', 'success');
      setName('');
      queryClient.invalidateQueries({ queryKey: ['finance', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'categories', 'options'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'categories', 'admin'] });
    },
    onError: (error) => {
      if (error?.response?.data?.name) {
        pushToast(error.response.data.name?.join(' ') ?? 'Category name already exists.', 'error');
      } else {
        pushToast('Unable to add category. Please try again.', 'error');
      }
    }
  });

  if (isBootstrapping) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-muted shadow-sm">Checking permissions…</div>;
  }

  if (!isAdmin) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      pushToast('Enter a category name before saving.', 'info');
      return;
    }
    await createMutation.mutateAsync({ name: trimmed });
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Expense categories</h1>
        <p className="text-sm text-muted">Create and review spending categories available to students.</p>
      </header>

      <section className="grid gap-6 md:grid-cols-[minmax(0,360px)_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Add a category</h2>
          <p className="mt-1 text-xs text-muted">Categories help students label expenses consistently.</p>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label htmlFor="category-name" className="block text-sm font-medium text-slate-700">
                Category name
              </label>
              <input
                id="category-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="e.g. Textbooks"
              />
            </div>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {createMutation.isPending ? 'Saving…' : 'Save category'}
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">Category list</h2>
            <p className="text-xs text-muted">Only administrators can add or modify categories.</p>
          </div>
          <div className="max-h-[480px] overflow-y-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-10 text-center text-sm text-muted">
                      Loading categories…
                    </td>
                  </tr>
                ) : categories.length ? (
                  categories.map((category) => (
                    <tr key={category.id} className="hover:bg-primary/5">
                      <td className="px-4 py-3 text-slate-900">{category.name}</td>
                      <td className="px-4 py-3 text-slate-600">{category.created_at ? formatDate(category.created_at) : '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-4 py-10 text-center text-sm text-muted">
                      No categories created yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Categories;
