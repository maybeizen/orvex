import { Button } from '@/components/button';
import { useForm } from '@inertiajs/react';
import React, { useEffect, useRef, useState } from 'react';

export default function AvatarForm({ avatarType = 'upload' as const }: { avatarType?: 'upload' | 'gravatar' }) {
    const [mode, setMode] = useState<'upload' | 'gravatar'>(avatarType);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [fileSize, setFileSize] = useState<string | null>(null);
    const [fileDimensions, setFileDimensions] = useState<{ width: number; height: number } | null>(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [invalidFile, setInvalidFile] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showSecurityInfo, setShowSecurityInfo] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const validateFile = (file: File) => {
        if (file.size > 1024 * 1024) {
            setInvalidFile(`File is too large (${formatFileSize(file.size)}). Maximum size is 1MB.`);
            return false;
        }

        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            setInvalidFile('Only JPG and PNG images are allowed for security reasons.');
            return false;
        }

        const extension = file.name.split('.').pop()?.toLowerCase();
        if (!extension || !['jpg', 'jpeg', 'png'].includes(extension)) {
            setInvalidFile('File must have a valid image extension (jpg, jpeg, png).');
            return false;
        }

        setInvalidFile(null);
        return true;
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' bytes';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        if (!file) {
            reset('avatar');
            setPreviewUrl(null);
            setFileName(null);
            setFileSize(null);
            setFileDimensions(null);
            return;
        }

        if (!validateFile(file)) {
            reset('avatar');
            setPreviewUrl(null);
            setFileName(null);
            setFileSize(null);
            setFileDimensions(null);
            return;
        }

        setData('avatar', file);
        setFileName(file.name);
        setFileSize(formatFileSize(file.size));
        setPreviewUrl(URL.createObjectURL(file));

        const img = new Image();
        img.onload = () => {
            setFileDimensions({
                width: img.width,
                height: img.height,
            });
        };
        img.src = URL.createObjectURL(file);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.avatar) return;

        setLoading(true);
        setUploadProgress(0);

        const simulateProgress = () => {
            const interval = setInterval(() => {
                setUploadProgress((prev) => {
                    const newProgress = prev + Math.random() * 15;
                    if (newProgress >= 99) {
                        clearInterval(interval);
                        return 99;
                    }
                    return newProgress;
                });
            }, 200);

            return interval;
        };

        const progressInterval = simulateProgress();

        post(route('avatar.update'), {
            forceFormData: true,
            onSuccess: () => {
                clearInterval(progressInterval);
                setUploadProgress(100);
                setSuccessMessage('Avatar updated successfully.');
                setTimeout(() => {
                    setPreviewUrl(null);
                    setFileName(null);
                    setFileSize(null);
                    setFileDimensions(null);
                    reset('avatar');
                    setUploadProgress(0);
                    setSuccessMessage('');
                }, 3000);
            },
            onError: () => {
                clearInterval(progressInterval);
                setUploadProgress(0);
            },
            onFinish: () => {
                setLoading(false);
            },
        });
    };

    const clearSelection = () => {
        reset('avatar');
        setPreviewUrl(null);
        setFileName(null);
        setFileSize(null);
        setFileDimensions(null);
        setInvalidFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-6">
            <div
                className="cursor-pointer rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-4"
                onClick={() => setShowSecurityInfo(!showSecurityInfo)}
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-indigo-300">
                        <i className="fas fa-images mr-2"></i>
                        Avatar Security
                    </h3>
                    <i className={`fas fa-chevron-${showSecurityInfo ? 'up' : 'down'} text-xs text-indigo-300`}></i>
                </div>

                {showSecurityInfo && (
                    <div className="mt-3 space-y-2 text-xs text-gray-300">
                        <p>Your profile image is visible to other users. We scan all uploads for malware and inappropriate content.</p>
                        <p>
                            <i className="fas fa-circle-info mr-1 text-yellow-400"></i>
                            For security, we only allow JPG and PNG formats (no GIFs or SVGs).
                        </p>
                        <p>
                            <i className="fas fa-lock mr-1 text-green-400"></i>
                            Gravatar is a secure alternative that uses your email to generate an avatar.
                        </p>
                    </div>
                )}
            </div>

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
                <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
                    <div className="space-y-6">
                        {previewUrl && (
                            <div className="flex flex-col items-center gap-2">
                                <div className="relative">
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="h-28 w-28 rounded-full border border-white/10 object-cover shadow-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={clearSelection}
                                        className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>

                                {fileSize && fileName && (
                                    <div className="text-center text-xs text-gray-400">
                                        <p className="text-indigo-400">{fileName}</p>
                                        <p>
                                            {fileSize} {fileDimensions && `• ${fileDimensions.width}×${fileDimensions.height}px`}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {invalidFile && (
                            <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                                <i className="fas fa-exclamation-circle mr-2"></i>
                                {invalidFile}
                            </div>
                        )}

                        {uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs text-gray-400">
                                    <span>Uploading...</span>
                                    <span>{Math.round(uploadProgress)}%</span>
                                </div>
                                <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-700">
                                    <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                </div>
                            </div>
                        )}

                        <div
                            className={`flex flex-col items-center gap-3 rounded-lg border border-dashed ${
                                previewUrl ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-white/10 bg-neutral-800'
                            } px-4 py-6 text-gray-300 transition hover:border-white/20`}
                        >
                            <input
                                type="file"
                                accept="image/jpeg,image/png"
                                onChange={handleFileChange}
                                className="hidden"
                                id="avatar-upload"
                                ref={fileInputRef}
                            />
                            <label htmlFor="avatar-upload" className="flex cursor-pointer items-center text-indigo-400 hover:underline">
                                <i className="fas fa-cloud-arrow-up mr-2 text-lg"></i>
                                {previewUrl ? 'Choose a different image' : 'Click to select an image'}
                            </label>
                            <p className="text-xs text-gray-500">JPG or PNG only. Max size: 1MB.</p>
                        </div>

                        {errors.avatar && (
                            <p className="text-sm text-red-400">
                                <i className="fas fa-exclamation-circle mr-1"></i>
                                {errors.avatar}
                            </p>
                        )}

                        <Button
                            type="submit"
                            variant="primary"
                            icon="fas fa-upload"
                            loading={processing || loading}
                            fullWidth
                            disabled={!data.avatar || !!invalidFile}
                        >
                            {uploadProgress > 0 && uploadProgress < 100 ? `Uploading (${Math.round(uploadProgress)}%)` : 'Upload Avatar'}
                        </Button>
                    </div>
                </form>
            )}

            {mode === 'gravatar' && (
                <div className="space-y-4 rounded-lg border border-white/10 bg-neutral-800 p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500 text-white">
                            <i className="fas fa-user-circle text-2xl"></i>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-white">Using Gravatar</h3>
                            <p className="text-xs text-gray-400">
                                Your avatar is automatically generated based on your email address using Gravatar.
                            </p>
                        </div>
                    </div>

                    <a
                        href="https://gravatar.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                    >
                        <i className="fas fa-external-link mr-2"></i>
                        Manage on Gravatar.com
                    </a>
                </div>
            )}

            {successMessage && (
                <div className="rounded-md border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-400">
                    <i className="fas fa-check-circle mr-2"></i>
                    {successMessage}
                </div>
            )}
        </div>
    );
}
