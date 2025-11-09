import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { motion, useReducedMotion } from 'framer-motion';
import api from '../api/api.js';
import useAuth from '../hooks/useAuth.js';
import AvatarUpload from '../components/AvatarUpload.jsx';
import { useToast } from '../components/Toast.jsx';
import { profileSchema } from '../utils/validators.js';

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const { pushToast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      phone: '',
      department: '',
      dob: ''
    }
  });

  useEffect(() => {
    if (user) {
      reset({
        first_name: user.first_name ?? '',
        last_name: user.last_name ?? '',
        phone: user.phone ?? user.phone_number ?? '',
        department: user.department ?? '',
        dob: user.dob ? user.dob.slice(0, 10) : ''
      });
    }
  }, [user, reset]);

  const updateProfileMutation = useMutation({
    mutationFn: (payload) => api.patch('/api/users/me/', payload),
    onSuccess: async () => {
      pushToast('Profile updated.', 'success');
      await refreshUser();
    },
    onError: () => pushToast('Unable to update profile. Try again.', 'error')
  });

  const avatarMutation = useMutation({
    mutationFn: (formData) => api.patch('/api/users/me/avatar/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: async () => {
      pushToast('Profile photo updated.', 'success');
      await refreshUser();
    },
    onError: () => pushToast('Unable to upload avatar.', 'error')
  });

  const onSubmit = async (values) => {
    await updateProfileMutation.mutateAsync(values);
  };

  const handleAvatarUpload = async (formData) => {
    await avatarMutation.mutateAsync(formData);
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
        <p className="text-sm text-muted">Update your personal details and keep your account secure.</p>
      </header>

      <motion.section
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="grid gap-6 lg:grid-cols-[280px_1fr]"
      >
        <AvatarUpload
          initialUrl={user?.avatar_url ?? user?.avatar}
          onUpload={handleAvatarUpload}
          isUploading={avatarMutation.isPending}
        />

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="first_name">
                First name
              </label>
              <input
                id="first_name"
                type="text"
                {...register('first_name')}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              {errors.first_name && <p className="mt-1 text-xs text-red-600">{errors.first_name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="last_name">
                Last name
              </label>
              <input
                id="last_name"
                type="text"
                {...register('last_name')}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              {errors.last_name && <p className="mt-1 text-xs text-red-600">{errors.last_name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="phone">
                Phone number
              </label>
              <input
                id="phone"
                type="tel"
                {...register('phone')}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="department">
                Department
              </label>
              <input
                id="department"
                type="text"
                {...register('department')}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              {errors.department && <p className="mt-1 text-xs text-red-600">{errors.department.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="dob">
                Date of birth
              </label>
              <input
                id="dob"
                type="date"
                {...register('dob')}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              {errors.dob && <p className="mt-1 text-xs text-red-600">{errors.dob.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={user?.email ?? ''}
                disabled
                className="mt-1 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-muted"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || updateProfileMutation.isPending}
              className="sm:col-span-2 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSubmitting || updateProfileMutation.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-background px-4 py-3 text-sm text-muted">
            <p>
              Need to change your password?{' '}
              <a
                href="/api/auth/password/change/"
                className="font-semibold text-primary hover:underline"
              >
                Go to password management
              </a>
            </p>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default Profile;
