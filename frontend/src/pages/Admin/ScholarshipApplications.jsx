import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import api from '../../api/api.js';
import { useToast } from '../../components/Toast.jsx';
import { formatDate } from '../../utils/format.js';
import useAuth from '../../hooks/useAuth.js';

const ScholarshipApplications = () => {
	const { scholarshipId } = useParams();
	const navigate = useNavigate();
	const { pushToast } = useToast();
	const queryClient = useQueryClient();

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

	const { data: scholarshipData } = useQuery({
		queryKey: ['admin', 'scholarships', scholarshipId],
		queryFn: async () => {
			const { data } = await api.get(`/api/scholarships/${scholarshipId}/`);
			return data;
		},
		enabled: Boolean(scholarshipId)
	});

	const { data, isLoading } = useQuery({
		queryKey: ['admin', 'scholarships', scholarshipId, 'applications'],
		queryFn: async () => {
			const { data: response } = await api.get(`/api/scholarships/${scholarshipId}/applications/`);
			return response;
		},
		enabled: Boolean(scholarshipId)
	});

	const applications = useMemo(() => {
		if (!data) return [];
		if (Array.isArray(data.results)) return data.results;
		if (Array.isArray(data)) return data;
		return [];
	}, [data]);

	const reviewMutation = useMutation({
		mutationFn: ({ id, action }) =>
			api.post(`/api/scholarships/applications/${id}/review/`, { action }),
		onSuccess: () => {
			pushToast('Application review recorded.', 'success');
			queryClient.invalidateQueries({ queryKey: ['admin', 'scholarships', scholarshipId, 'applications'] });
		},
		onError: (error) => {
			const message = error?.response?.data?.detail || 'Unable to review this application yet.';
			pushToast(message, 'error');
		}
	});

	const handleReview = (application, action) => {
		reviewMutation.mutate({ id: application.id, action });
	};

	return (
		<div className="space-y-6">
			<button
				type="button"
				onClick={() => navigate('/admin/scholarships')}
				className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
			>
				<ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
				Back to scholarships
			</button>

			<header>
				<h1 className="text-2xl font-semibold text-slate-900">Applications</h1>
				<p className="text-sm text-muted">
					Review submissions for <span className="font-semibold text-slate-900">{scholarshipData?.name}</span>. Deadline:{' '}
					<strong>{formatDate(scholarshipData?.deadline)}</strong>
				</p>
			</header>

			<div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
				<table className="min-w-full divide-y divide-slate-100 text-sm">
					<thead className="bg-slate-50">
						<tr>
							<th className="px-4 py-3 text-left font-semibold text-slate-600">Applicant</th>
							<th className="px-4 py-3 text-left font-semibold text-slate-600">Submitted</th>
							<th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
							<th className="px-4 py-3 text-left font-semibold text-slate-600">Student note</th>
							<th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-100">
						{isLoading ? (
							<tr>
								<td colSpan={5} className="px-4 py-10 text-center text-sm text-muted">
									Loading applications…
								</td>
							</tr>
						) : applications.length ? (
							applications.map((application) => (
								<tr key={application.id} className="align-top hover:bg-primary/5">
									<td className="px-4 py-3">
										<p className="font-semibold text-slate-900">
											{application.applicant?.first_name} {application.applicant?.last_name}
										</p>
										<p className="text-xs text-muted">{application.applicant?.email}</p>
									</td>
									<td className="px-4 py-3 text-slate-600">{formatDate(application.submitted_at)}</td>
									<td className="px-4 py-3">
										<span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(application.status)}`}>
											{application.status}
										</span>
									</td>
									<td className="px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap">{application.note}</td>
									<td className="px-4 py-3 text-right">
										<div className="inline-flex items-center gap-2">
											<button
												type="button"
												disabled={reviewMutation.isPending || application.status !== 'pending'}
												onClick={() => handleReview(application, 'approve')}
												className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
											>
												Approve
											</button>
											<button
												type="button"
												disabled={reviewMutation.isPending || application.status !== 'pending'}
												onClick={() => handleReview(application, 'reject')}
												className="rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-slate-300"
											>
												Decline
											</button>
										</div>
									</td>
								</tr>
							))) : (
							<tr>
								<td colSpan={5} className="px-4 py-10 text-center text-sm text-muted">
									No applications submitted yet.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
};

const statusBadgeClass = (status) => {
	switch ((status || '').toLowerCase()) {
		case 'approved':
			return 'bg-emerald-100 text-emerald-700';
		case 'rejected':
			return 'bg-rose-100 text-rose-700';
		default:
			return 'bg-amber-100 text-amber-700';
	}
};

export default ScholarshipApplications;
