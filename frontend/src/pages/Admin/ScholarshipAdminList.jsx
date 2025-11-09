import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/api.js';
import { formatDate } from '../../utils/format.js';
import useAuth from '../../hooks/useAuth.js';

const ScholarshipAdminList = () => {
	const navigate = useNavigate();
	const { user, isBootstrapping } = useAuth();
	const isAdmin = Boolean(user && (user.role === 'admin' || user.is_staff));

	useEffect(() => {
		if (!isBootstrapping && !isAdmin) {
			navigate('/dashboard', { replace: true });
		}
	}, [isAdmin, isBootstrapping, navigate]);

	if (isBootstrapping) {
		return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-muted shadow-sm">Checking permissions…</div>;
	}

	if (!isAdmin) {
		return null;
	}

	const { data, isLoading } = useQuery({
		queryKey: ['admin', 'scholarships'],
		queryFn: async () => {
			const { data: response } = await api.get('/api/scholarships/disbursements/');
			return response;
		}
	});

	const scholarships = useMemo(() => {
		if (!data) return [];
		if (Array.isArray(data.results)) return data.results;
		if (Array.isArray(data)) return data;
		return [];
	}, [data]);

	return (
		<div className="space-y-8">
			<header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
				<div>
					<h1 className="text-2xl font-semibold text-slate-900">Scholarship management</h1>
					<p className="text-sm text-muted">Review application deadlines and jump into applicant lists.</p>
				</div>
				<button
					type="button"
					onClick={() => navigate('/admin/scholarships/create')}
					className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
				>
					Create scholarship
				</button>
			</header>

			<div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
				<table className="min-w-full divide-y divide-slate-100 text-sm">
					<thead className="bg-slate-50">
						<tr>
							<th className="px-4 py-3 text-left font-semibold text-slate-600">Name</th>
							<th className="px-4 py-3 text-left font-semibold text-slate-600">Provider</th>
							<th className="px-4 py-3 text-left font-semibold text-slate-600">Deadline</th>
							<th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-100">
						{isLoading ? (
							<tr>
								<td colSpan={4} className="px-4 py-10 text-center text-sm text-muted">
									Loading scholarships…
								</td>
							</tr>
						) : scholarships.length ? (
							scholarships.map((scholarship) => (
								<tr key={scholarship.id} className="hover:bg-primary/5">
									<td className="px-4 py-3 text-slate-900">{scholarship.name}</td>
									<td className="px-4 py-3 text-slate-600">{scholarship.provider}</td>
									<td className="px-4 py-3 text-slate-600">{formatDate(scholarship.deadline)}</td>
									<td className="px-4 py-3 text-right">
										<Link
											to={`/admin/scholarships/${scholarship.id}/applications`}
											className="rounded-xl border border-primary px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10"
										>
											View applicants
										</Link>
									</td>
								</tr>
							))) : (
							<tr>
								<td colSpan={4} className="px-4 py-10 text-center text-sm text-muted">
									No scholarships created yet.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default ScholarshipAdminList;
