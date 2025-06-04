import { Button } from '@/components/button';
import { Input } from '@/components/input/input';
import { RoleDescription, User, UserRole } from '@/types/global';
import { useForm } from '@inertiajs/react';
import React, { useState } from 'react';

interface ProfileTabProps {
    user: User;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ user }) => {
    const [successMessage, setSuccessMessage] = useState<string>('');
    const { data, setData, errors, put, processing } = useForm({
        name: user.name || '',
        email: user.email || '',
        role: user.role || ('user' as UserRole),
    });

    const [verifyEmailLoading, setVerifyEmailLoading] = useState<boolean>(false);
    const [unverifyEmailLoading, setUnverifyEmailLoading] = useState<boolean>(false);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        put(route('admin.users.update.profile', { id: user.id }), {
            onSuccess: () => {
                setSuccessMessage('User updated successfully');
                setTimeout(() => setSuccessMessage(''), 5000);
            },
        });
    };

    const handleVerifyEmail = () => {
        setVerifyEmailLoading(true);
        put(route('admin.users.verify-email', { id: user.id }), {
            onSuccess: () => {
                setSuccessMessage('Email verified successfully');
                setTimeout(() => setSuccessMessage(''), 5000);
                setVerifyEmailLoading(false);
            },
            onError: () => {
                setVerifyEmailLoading(false);
            },
        });
    };

    const handleUnverifyEmail = () => {
        setUnverifyEmailLoading(true);
        put(route('admin.users.unverify-email', { id: user.id }), {
            onSuccess: () => {
                setSuccessMessage('Email verification removed');
                setTimeout(() => setSuccessMessage(''), 5000);
                setUnverifyEmailLoading(false);
            },
            onError: () => {
                setUnverifyEmailLoading(false);
            },
        });
    };

    const roleDescriptions: RoleDescription = {
        admin: 'Full access to all features and user management',
        client: "Limited access focused on using the platform's services",
        user: 'Standard user permissions',
    };

    const isEmailVerified = !!user.email_verified_at;

    return (
        <form onSubmit={handleSubmit}>
            <div className="mb-6">
                <h3 className="mb-4 text-lg font-bold text-white">Profile Information</h3>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <Input
                            id="name"
                            name="name"
                            label="Full Name"
                            type="text"
                            value={data.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('name', e.target.value)}
                            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-white transition-colors focus:border-violet-500 focus:outline-none"
                            placeholder="Enter user's full name"
                            error={errors.name}
                        />
                    </div>

                    <div>
                        <div className="space-y-1">
                            <Input
                                id="email"
                                name="email"
                                label="Email Address"
                                type="email"
                                value={data.email}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('email', e.target.value)}
                                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-white transition-colors focus:border-violet-500 focus:outline-none"
                                placeholder="Enter user's email address"
                                error={errors.email}
                            />
                            <div className="mt-3 flex items-center justify-between rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3">
                                <div className="flex items-center space-x-2 text-sm">
                                    {isEmailVerified ? (
                                        <span className="flex items-center text-green-400">
                                            <i className="fas fa-check-circle mr-2" />
                                            Email is verified
                                        </span>
                                    ) : (
                                        <span className="flex items-center text-amber-400">
                                            <i className="fas fa-exclamation-triangle mr-2" />
                                            Email is not verified
                                        </span>
                                    )}
                                </div>

                                <div>
                                    {!isEmailVerified ? (
                                        <Button
                                            type="button"
                                            variant="success"
                                            size="sm"
                                            onClick={handleVerifyEmail}
                                            loading={verifyEmailLoading}
                                            className="flex items-center space-x-2"
                                            icon="fas fa-check-circle"
                                        >
                                            Verify
                                        </Button>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="danger"
                                            size="sm"
                                            onClick={handleUnverifyEmail}
                                            loading={unverifyEmailLoading}
                                            className="flex items-center space-x-2"
                                            icon="fas fa-times-circle"
                                        >
                                            Unverify
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <div className="flex items-center">
                    <h3 className="text-lg font-bold text-white">Role & Permissions</h3>
                    <div className="group relative ml-2">
                        <i className="fas fa-question-circle cursor-help text-neutral-500 hover:text-neutral-300"></i>
                        <div className="absolute top-0 left-0 z-50 mt-6 hidden w-64 rounded-md border border-neutral-700 bg-neutral-800 p-4 shadow-xl group-hover:block">
                            <div className="text-xs text-neutral-300">
                                {Object.entries(roleDescriptions).map(([role, desc]) => (
                                    <div key={role} className="mb-2 last:mb-0">
                                        <span className="font-bold text-white">{role.charAt(0).toUpperCase() + role.slice(1)}:</span> {desc}
                                    </div>
                                ))}
                            </div>
                            <div className="absolute -top-2 left-2 h-3 w-3 rotate-45 border-t border-l border-neutral-700 bg-neutral-800"></div>
                        </div>
                    </div>
                </div>

                <div className="mt-4">
                    <select
                        id="role"
                        value={data.role}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setData('role', e.target.value as UserRole)}
                        className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-white transition-colors focus:border-violet-500 focus:outline-none"
                    >
                        <option value="admin">Administrator</option>
                        <option value="client">Client</option>
                        <option value="user">Regular User</option>
                    </select>
                    {errors.role && <p className="mt-1 text-sm text-red-500">{errors.role}</p>}
                </div>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-4">
                {successMessage && <div className="text-green-400">{successMessage}</div>}
                <Button type="button" variant="glass" onClick={() => window.history.back()}>
                    Go Back
                </Button>
                <Button type="submit" variant="primary" loading={processing}>
                    Save Changes
                </Button>
            </div>
        </form>
    );
};

export default ProfileTab;
