import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../api/api.js';
import { useToast } from './Toast.jsx';

const schema = yup.object({
	note: yup
		.string()
		.trim()
		.min(30, 'Respond to the eligibility criteria in at least 30 characters.')
		.required('This field is required.')
});

const ScholarshipApplyForm = ({ scholarshipId, disabled, onSuccess }) => {
	const { pushToast } = useToast();
	const queryClient = useQueryClient();

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors }
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: { note: '' }
	});

	useEffect(() => {
		reset({ note: '' });
	}, [scholarshipId, reset]);

	const mutation = useMutation({
		mutationFn: (payload) => api.post(`/api/scholarships/${scholarshipId}/apply/`, payload),
		onSuccess: ({ data }) => {
			pushToast('Application submitted successfully. Status is pending review.', 'success');
			queryClient.invalidateQueries({ queryKey: ['scholarships', 'detail', scholarshipId] });
			queryClient.invalidateQueries({ queryKey: ['scholarships', 'list'] });
			queryClient.invalidateQueries({ queryKey: ['scholarships', 'history'] });
			reset({ note: '' });
			onSuccess?.(data);
		},
		onError: (error) => {
			const message = error?.response?.data?.detail || 'Unable to submit application right now.';
			pushToast(message, 'error');
		}
	});

	const onSubmit = (values) => {
		mutation.mutate({ note: values.note.trim() });
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
			<div>
				<label htmlFor="application-note" className="block text-sm font-medium text-slate-700">
					Respond to the eligibility criteria
				</label>
				<textarea
					id="application-note"
					rows={5}
					disabled={disabled || mutation.isPending}
					{...register('note')}
					className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:bg-slate-100"
					placeholder="Describe how you meet every requirement that was listed."
				/>
				{errors.note && <p className="mt-1 text-xs text-red-600">{errors.note.message}</p>}
			</div>

			<button
				type="submit"
				disabled={disabled || mutation.isPending}
				className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-slate-400"
			>
				{mutation.isPending ? 'Submitting…' : 'Submit application'}
			</button>
		</form>
	);
};

export default ScholarshipApplyForm;
