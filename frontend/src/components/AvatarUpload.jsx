import { useEffect, useMemo, useState } from 'react';
import { CameraIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import placeholder from '../assets/placeholder-avatar.svg';

const AvatarUpload = ({ initialUrl, onUpload, isUploading = false }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(initialUrl ?? placeholder);

  useEffect(() => {
    setPreviewUrl(initialUrl ?? placeholder);
  }, [initialUrl]);

  useEffect(() => {
    if (!file) return undefined;
    const nextPreview = URL.createObjectURL(file);
    setPreviewUrl(nextPreview);

    return () => {
      URL.revokeObjectURL(nextPreview);
    };
  }, [file]);

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0];
    if (selected) {
      setFile(selected);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    onUpload?.(formData, file);
  };

  const statusLabel = useMemo(() => {
    if (isUploading) return 'Uploading…';
    if (file) return 'Ready to upload';
    return 'PNG or JPG up to 2MB';
  }, [file, isUploading]);

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="relative h-32 w-32 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
        <img
          src={previewUrl || placeholder}
          alt="Profile avatar preview"
          className="h-full w-full object-cover"
        />
        <label
          htmlFor="avatar-input"
          className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-slate-900/60 text-white opacity-0 transition hover:opacity-100"
        >
          <CameraIcon className="h-6 w-6" aria-hidden="true" />
          <span className="sr-only">Choose new profile photo</span>
        </label>
        <input
          id="avatar-input"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFileChange}
        />
      </div>
      <div className="text-center text-sm text-muted">{statusLabel}</div>
      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        <CloudArrowUpIcon className="h-4 w-4" aria-hidden="true" />
        {isUploading ? 'Uploading…' : 'Upload avatar'}
      </button>
    </div>
  );
};

export default AvatarUpload;
