import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api.js';
import { useToast } from '../../components/Toast.jsx';
import useAuth from '../../hooks/useAuth.js';

const schema = yup.object({
	name: yup.string().required('Name is required'),
	description: yup.string().required('Provide a description'),
	provider: yup.string().required('Provider is required'),
	amount: yup
		.number()
		.typeError('Enter a valid amount')
		.moreThan(0, 'Amount must be greater than zero')
		.required('Amount is required'),
	deadline: yup.string().required('Deadline is required'),
	eligibility_criteria: yup.string().min(30, 'Provide detailed eligibility information').required('Eligibility criteria are required')
});

const ScholarshipCreate = () => {
	const { pushToast } = useToast();
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

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: {
			name: '',
			description: '',
			provider: '',
			amount: '',
			deadline: '',
			eligibility_criteria: ''
		}
	});

	const mutation = useMutation({
		mutationFn: (payload) => api.post('/api/scholarships/', payload),
		onSuccess: () => {
			pushToast('Scholarship created successfully.', 'success');
			reset();
			navigate('/admin/scholarships');
		},
		onError: (error) => {
			const detail = error?.response?.data;
			const message = typeof detail === 'string' ? detail : 'Unable to create scholarship right now.';
			pushToast(message, 'error');
		}
	});

	const onSubmit = (values) => {
		mutation.mutate({
			...values,
			amount: Number(values.amount)
		});
	};

	return (
		<div className="mx-auto max-w-3xl space-y-8">
			<header>
				<h1 className="text-2xl font-semibold text-slate-900">Create scholarship</h1>
				<p className="text-sm text-muted">Publish a new opportunity for students. Only admins can access this page.</p>
			</header>

			<form onSubmit={handleSubmit(onSubmit)} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
				<div>
					<label className="block text-sm font-medium text-slate-700" htmlFor="scholarship-name">
						Scholarship name
					</label>
					<input
						id="scholarship-name"
						{...register('name')}
						type="text"
						className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
						placeholder="e.g. STEM Innovation Award"
					/>
					{errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
				</div>

				<div>
					<label className="block text-sm font-medium text-slate-700" htmlFor="scholarship-provider">
						Provider
					</label>
					<input
						id="scholarship-provider"
						{...register('provider')}
						type="text"
						className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
						placeholder="e.g. University Board"
					/>
					{errors.provider && <p className="mt-1 text-xs text-red-600">{errors.provider.message}</p>}
				</div>

				<div>
					<label className="block text-sm font-medium text-slate-700" htmlFor="scholarship-amount">
						Award amount
					</label>
					<input
						id="scholarship-amount"
						{...register('amount')}
						type="number"
						step="0.01"
						min="0"
						className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
						placeholder="1500"
					/>
					{errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
				</div>

				<div>
					<label className="block text-sm font-medium text-slate-700" htmlFor="scholarship-deadline">
						Application deadline
					</label>
					<input
						id="scholarship-deadline"
						{...register('deadline')}
						type="date"
						className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
					/>
					{errors.deadline && <p className="mt-1 text-xs text-red-600">{errors.deadline.message}</p>}
				</div>

				<div>
					<label className="block text-sm font-medium text-slate-700" htmlFor="scholarship-description">
						Description
					</label>
					<textarea
						id="scholarship-description"
						{...register('description')}
						rows={4}
						className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
						placeholder="Explain what this scholarship covers and who it is for."
					/>
					{errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
				</div>

				<div>
					<label className="block text-sm font-medium text-slate-700" htmlFor="scholarship-eligibility">
						Eligibility criteria
					</label>
					<textarea
						id="scholarship-eligibility"
						{...register('eligibility_criteria')}
						rows={6}
						className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
						placeholder="List every requirement and supporting documents the student must provide."
					/>
					{errors.eligibility_criteria && <p className="mt-1 text-xs text-red-600">{errors.eligibility_criteria.message}</p>}
				</div>

				<div className="flex items-center justify-end gap-3">
					<button
						type="button"
						onClick={() => navigate('/admin/scholarships')}
						className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={mutation.isPending}
						className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-slate-400"
					>
						{mutation.isPending ? 'Publishing…' : 'Publish scholarship'}
					</button>
				</div>
			</form>
		</div>
	);
};

export default ScholarshipCreate;
