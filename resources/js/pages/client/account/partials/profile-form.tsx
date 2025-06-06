import { Button } from '@/components/button';
import { Input } from '@/components/input/input';
import { useForm } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';

export default function ProfileForm({ user }: { user: any }) {
    const [successMessage, setSuccessMessage] = useState('');
    const [characterCount, setCharacterCount] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [showSecurityInfo, setShowSecurityInfo] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: user.name,
    });

    useEffect(() => {
        setCharacterCount(data.name.length);
        setIsEditing(data.name !== user.name);
    }, [data.name, user.name]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('profile.update'), {
            preserveScroll: true,
            onSuccess: () => {
                setSuccessMessage('Your username has been updated successfully.');
                setIsEditing(false);
                setTimeout(() => setSuccessMessage(''), 5000);
            },
        });
    };

    const sanitizeInput = (input: string) => {
        return input
            .replace(/</g, '')
            .replace(/>/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '')
            .replace(/\\/g, '');
    };

    return (
        <div className="space-y-6">
            <div
                className="cursor-pointer rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-4"
                onClick={() => setShowSecurityInfo(!showSecurityInfo)}
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-indigo-300">
                        <i className="fas fa-user-shield mr-2"></i>
                        Profile Security
                    </h3>
                    <i className={`fas fa-chevron-${showSecurityInfo ? 'up' : 'down'} text-xs text-indigo-300`}></i>
                </div>

                {showSecurityInfo && (
                    <div className="mt-3 space-y-2 text-xs text-gray-300">
                        <p>Your username is visible to other users. Choose a name that doesn't reveal your personal information.</p>
                        <p>
                            <i className="fas fa-circle-info mr-1 text-yellow-400"></i>
                            Avoid using personal identifiers like your full name, birthdate, or location.
                        </p>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                    <Input
                        label="Username"
                        name="name"
                        type="text"
                        required
                        value={data.name}
                        onChange={(e) => {
                            const sanitized = sanitizeInput(e.target.value);
                            setData('name', sanitized);
                        }}
                        className={`w-full rounded-lg border ${isEditing ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-white/10 bg-neutral-800'} p-2 text-sm text-white placeholder-gray-500`}
                        maxLength={30}
                    />

                    <div className="flex items-center justify-between px-1">
                        <div className="text-xs text-gray-400">
                            {characterCount > 0 && (
                                <span className={characterCount >= 30 ? 'text-yellow-400' : ''}>{characterCount}/30 characters</span>
                            )}
                        </div>

                        {isEditing && (
                            <p className="text-xs text-indigo-400">
                                <i className="fas fa-pen-to-square mr-1"></i>
                                Editing username
                            </p>
                        )}
                    </div>

                    {errors.name && (
                        <p className="mt-1 text-sm text-red-400">
                            <i className="fas fa-exclamation-circle mr-1"></i>
                            {errors.name}
                        </p>
                    )}
                </div>

                {successMessage && (
                    <div className="rounded-md border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-400">
                        <i className="fas fa-check-circle mr-2"></i>
                        {successMessage}
                    </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                        type="submit"
                        variant="primary"
                        icon={isEditing ? 'fas fa-check' : 'fas fa-save'}
                        loading={processing}
                        disabled={!isEditing || data.name.trim().length === 0 || data.name.length > 30}
                    >
                        {isEditing ? 'Save Changes' : 'Save Username'}
                    </Button>

                    {isEditing && (
                        <Button
                            type="button"
                            variant="glass"
                            onClick={() => {
                                setData('name', user.name);
                                setIsEditing(false);
                            }}
                        >
                            Cancel
                        </Button>
                    )}
                </div>
            </form>
        </div>
    );
}
