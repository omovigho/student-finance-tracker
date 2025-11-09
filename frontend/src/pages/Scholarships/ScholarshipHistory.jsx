import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import api from '../../api/api.js';
import Tabs from '../../components/Tabs.jsx';
import { formatDate } from '../../utils/format.js';

const statusTabs = [
	{ label: 'Pending', value: 'pending' },
	{ label: 'Approved', value: 'approved' },
	{ label: 'Declined', value: 'rejected' }
];

const ScholarshipHistory = () => {
	const [activeStatus, setActiveStatus] = useState('pending');
	const shouldReduceMotion = useReducedMotion();

	const { data, isLoading, refetch, isFetching } = useQuery({
		queryKey: ['scholarships', 'history', activeStatus],
		queryFn: async () => {
			const { data: response } = await api.get('/api/scholarships/my-applications/', {
				params: activeStatus ? { status: activeStatus } : undefined
			});
			return response;
		}
	});

	useEffect(() => {
		refetch();
	}, [activeStatus, refetch]);

	const applications = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];

	return (
		<div className="space-y-8">
			<header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
				<div>
					<h1 className="text-2xl font-semibold text-slate-900">Scholarship application history</h1>
					<p className="text-sm text-muted">Track how your scholarship applications are progressing across review stages.</p>
				</div>
			</header>

			<Tabs tabs={statusTabs} activeValue={activeStatus} onChange={setActiveStatus} />

			<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
				{(isLoading || isFetching) && !applications.length ? (
					<div className="py-12 text-center text-sm text-muted">Loading applications…</div>
				) : applications.length ? (
					<div className="space-y-4">
						<AnimatePresence>
							{applications.map((application) => (
								<motion.div
									key={application.id}
									initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
									animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
									exit={{ opacity: 0 }}
									className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
								>
									<div>
										<p className="text-sm font-semibold text-slate-900">{application.scholarship_name ?? application.scholarship?.name}</p>
										<p className="text-xs text-muted">Submitted {formatDate(application.submitted_at)}</p>
									</div>
									<div className="flex items-center gap-3">
										<span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(application.status)}`}>
											{application.status}
										</span>
										<Link
											to={`/scholarships/${application.scholarship}`}
											className="rounded-full border border-primary px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10"
										>
											View details
										</Link>
									</div>
								</motion.div>
							))}
						</AnimatePresence>
					</div>
				) : (
					<div className="py-12 text-center text-sm text-muted">No applications in this status yet.</div>
				)}
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

export default ScholarshipHistory;
