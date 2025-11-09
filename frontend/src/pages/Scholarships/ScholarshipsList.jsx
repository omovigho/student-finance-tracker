import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api.js';
import ScholarshipCard from '../../components/ScholarshipCard.jsx';

const ScholarshipsList = () => {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['scholarships', 'list'],
    queryFn: async () => {
      const { data: response } = await api.get('/api/scholarships/');
      return response;
    }
  });

  const scholarships = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data.results)) return data.results;
    if (Array.isArray(data)) return data;
    return [];
  }, [data]);

  const handleApply = (scholarship) => {
    navigate(`/scholarships/${scholarship.id}`);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Scholarship opportunities</h1>
        <p className="text-sm text-muted">
          Browse open programmes curated for students. Apply to any scholarship before the deadline passes.
        </p>
      </header>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-muted shadow-sm">Loading scholarships…</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {scholarships.length ? (
            scholarships.map((scholarship) => (
              <ScholarshipCard key={scholarship.id} scholarship={scholarship} onApply={handleApply} />
            ))
          ) : (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-muted">
              No scholarships available right now. Check back soon.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScholarshipsList;
