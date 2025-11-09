import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, CalendarDaysIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';
import api from '../../api/api.js';
import ScholarshipApplyForm from '../../components/ScholarshipApplyForm.jsx';
import { formatCurrency, formatDate } from '../../utils/format.js';

const ScholarshipDetail = () => {
	const { scholarshipId } = useParams();
	const navigate = useNavigate();

	const { data, isLoading, isError } = useQuery({
		queryKey: ['scholarships', 'detail', scholarshipId],
		queryFn: async () => {
			const { data: response } = await api.get(`/api/scholarships/${scholarshipId}/`);
			return response;
		},
		enabled: Boolean(scholarshipId)
	});

	const scholarship = data;

	const isPastDeadline = useMemo(() => {
		if (!scholarship?.deadline) return false;
		return new Date(scholarship.deadline) < new Date();
	}, [scholarship]);

	const canApply = Boolean(scholarship?.is_open && !scholarship?.has_applied && !isPastDeadline);

	if (isLoading) {
		return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-muted shadow-sm">Loading scholarship…</div>;
	}

	if (isError) {
		return (
			<div className="space-y-4">
				<button
					type="button"
					onClick={() => navigate(-1)}
					className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
				>
					<ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
					Back
				</button>
				<div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
					Unable to load the scholarship. It may no longer be accessible.
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<button
				type="button"
				onClick={() => navigate(-1)}
				className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
			>
				<ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
				Back
			</button>

			<section className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
				<article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
					<header className="flex flex-col gap-2">
						<p className="text-sm font-semibold uppercase tracking-wide text-primary">Scholarship</p>
						<h1 className="text-3xl font-semibold text-slate-900">{scholarship.name}</h1>
						<p className="text-sm text-muted">Offered by {scholarship.provider}</p>
					</header>

					<div className="mt-6 grid gap-4 lg:grid-cols-2">
						<div className="flex items-center gap-3 rounded-2xl bg-primary/5 p-4">
							<CalendarDaysIcon className="h-6 w-6 text-primary" aria-hidden="true" />
							<div>
								<p className="text-xs font-semibold uppercase tracking-wide text-primary">Deadline</p>
								<p className="text-lg font-semibold text-slate-900">{formatDate(scholarship.deadline)}</p>
							</div>
						</div>
						<div className="flex items-center gap-3 rounded-2xl bg-primary/5 p-4">
							<DocumentCheckIcon className="h-6 w-6 text-primary" aria-hidden="true" />
							<div>
								<p className="text-xs font-semibold uppercase tracking-wide text-primary">Award amount</p>
								<p className="text-lg font-semibold text-slate-900">{formatCurrency(scholarship.amount)}</p>
							</div>
						</div>
					</div>

					<div className="mt-6 space-y-6">
						<section>
							<h2 className="text-base font-semibold text-slate-900">Description</h2>
							<p className="mt-2 text-sm leading-relaxed text-slate-700">{scholarship.description}</p>
						</section>
						<section>
							<h2 className="text-base font-semibold text-slate-900">Eligibility criteria</h2>
							<div className="mt-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
								{scholarship.eligibility_criteria}
							</div>
						</section>
					</div>
				</article>

				<aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
					<h2 className="text-lg font-semibold text-slate-900">Submit your application</h2>
					<p className="mt-2 text-sm text-muted">
						Answer every eligibility requirement in the field below. Your response is shared with the admin reviewing this scholarship.
					</p>
					<div className="mt-4">
						<ScholarshipApplyForm scholarshipId={scholarshipId} disabled={!canApply} />
					</div>
					{!canApply && (
						<p className="mt-3 text-xs font-semibold text-red-500">
							Applications are closed or you have already submitted a response.
						</p>
					)}
				</aside>
			</section>
		</div>
	);
};

export default ScholarshipDetail;
