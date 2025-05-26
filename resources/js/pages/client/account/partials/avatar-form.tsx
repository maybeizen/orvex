import { Button } from '@/components/button';
import { useForm } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';

export default function AvatarForm({ avatarType }: { avatarType: 'upload' | 'gravatar' }) {
    const [mode, setMode] = useState<'upload' | 'gravatar'>(avatarType);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const { post, data, setData, processing, errors, reset } = useForm<{ avatar: File | null }>({
        avatar: null,
    });

    useEffect(() => {
        if (mode === 'gravatar' && avatarType !== 'gravatar') {
            setLoading(true);
            post(route('avatar.setGravatar'), {
                preserveScroll: true,
                onSuccess: () => {
                    setSuccessMessage('Successfully switched to Gravatar.');
                    setTimeout(() => setSuccessMessage(''), 3000);
                },
                onFinish: () => setLoading(false),
            });
        }
    }, [mode]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setData('avatar', file);
        setFileName(file?.name ?? null);
        setPreviewUrl(file ? URL.createObjectURL(file) : null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.avatar) return;

        setLoading(true);
        post(route('avatar.update'), {
            forceFormData: true,
            onSuccess: () => {
                setSuccessMessage('Avatar updated successfully.');
                setPreviewUrl(null);
                setFileName(null);
                reset('avatar');
                setTimeout(() => setSuccessMessage(''), 3000);
            },
            onFinish: () => setLoading(false),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8" encType="multipart/form-data">
            <div className="flex overflow-hidden rounded-lg border border-white/10">
                {['upload', 'gravatar'].map((type) => (
                    <button
                        key={type}
                        type="button"
                        onClick={() => setMode(type as 'upload' | 'gravatar')}
                        className={`w-1/2 py-2 text-sm font-medium transition ${
                            mode === type ? 'bg-violet-600 text-white' : 'bg-neutral-900 text-gray-400 hover:bg-neutral-800'
                        }`}
                    >
                        <i className={`fas ${type === 'upload' ? 'fa-upload' : 'fa-user-circle'} mr-2`} />
                        {type === 'upload' ? 'Upload Image' : 'Use Gravatar'}
                    </button>
                ))}
            </div>

            {mode === 'upload' && (
                <div className="space-y-6">
                    {previewUrl && (
                        <div className="flex justify-center">
                            <img src={previewUrl} alt="Preview" className="h-28 w-28 rounded-full border border-white/10 object-cover shadow-lg" />
                        </div>
                    )}

                    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-white/10 bg-neutral-800 px-4 py-6 text-gray-300 transition hover:border-white/20">
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="avatar-upload" />
                        <label htmlFor="avatar-upload" className="cursor-pointer text-indigo-400 hover:underline">
                            <i className="fas fa-image mr-2" />
                            {fileName ?? 'Click to select an image'}
                        </label>
                        <p className="text-xs text-gray-500">JPG, PNG, or GIF. Max size: 2MB.</p>
                    </div>

                    {errors.avatar && <p className="text-sm text-red-400">{errors.avatar}</p>}

                    <Button type="submit" variant="primary" icon="fas fa-upload" loading={processing || loading} fullWidth>
                        Upload Avatar
                    </Button>
                </div>
            )}

            {successMessage && <div className="text-center text-sm text-green-400">{successMessage}</div>}
        </form>
    );
}
