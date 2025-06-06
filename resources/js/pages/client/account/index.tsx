import Avatar from '@/components/avatar';
import { Button } from '@/components/button';
import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';

import type { Auth } from '@/types/global';

import AvatarForm from './partials/avatar-form';
import EmailForm from './partials/email-form';
import PasswordForm from './partials/password-form';
import ProfileForm from './partials/profile-form';
import TwoFactorForm from './partials/two-factor-form';

const tabs = [
    { label: 'Profile', icon: 'fas fa-user', description: 'Update your username and profile information' },
    { label: 'Email', icon: 'fas fa-envelope', description: 'Change your email address and verification status' },
    { label: 'Password', icon: 'fas fa-lock', description: 'Update your password for better security' },
    { label: 'Avatar', icon: 'fas fa-image', description: 'Upload a profile picture or use Gravatar' },
    { label: '2FA', icon: 'fas fa-shield-alt', description: 'Configure two-factor authentication for added security' },
];

const UserSettings: React.FC = () => {
    const { auth, flash } = usePage().props as unknown as {
        auth: Auth;
        flash: { message?: string; type?: 'success' | 'error' | 'warning' };
    };
    const user = auth?.user;
    const [activeTab, setActiveTab] = useState('Profile');
    const [flashMessage, setFlashMessage] = useState<{ message: string; type: string } | null>(null);
    const [sessionTimer, setSessionTimer] = useState<number | null>(null);
    const [showSecurityInfo, setShowSecurityInfo] = useState(false);

    useEffect(() => {
        if (flash?.message) {
            setFlashMessage({
                message: flash.message,
                type: flash.type || 'success',
            });

            const timer = window.setTimeout(() => {
                setFlashMessage(null);
            }, 5000);

            return () => {
                window.clearTimeout(timer);
            };
        }
    }, [flash]);

    useEffect(() => {
        const initialTime = 15 * 60 * 1000;
        setSessionTimer(initialTime);

        const interval = setInterval(() => {
            setSessionTimer((prev) => {
                if (prev === null) return null;
                const newTime = prev - 60 * 1000;
                return newTime > 0 ? newTime : 0;
            });
        }, 60 * 1000);

        const resetTimer = () => {
            setSessionTimer(initialTime);
        };

        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keypress', resetTimer);
        window.addEventListener('click', resetTimer);

        return () => {
            clearInterval(interval);
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('keypress', resetTimer);
            window.removeEventListener('click', resetTimer);
        };
    }, []);

    const formatTime = (milliseconds: number): string => {
        if (milliseconds === 0) return '00:00';
        const minutes = Math.floor(milliseconds / (60 * 1000));
        const seconds = Math.floor((milliseconds % (60 * 1000)) / 1000);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const getFlashIcon = (type: string): string => {
        if (type === 'success') return 'fas fa-check-circle';
        if (type === 'error') return 'fas fa-circle-exclamation';
        return 'fas fa-triangle-exclamation';
    };

    if (!user) return null;

    return (
        <>
            <Head title="Account Settings" />

            <AppLayout className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 py-24" childClassName="max-w-7xl w-full">
                {flashMessage && (
                    <div
                        className={`fixed top-5 left-1/2 z-50 -translate-x-1/2 transform rounded-lg px-6 py-3 shadow-lg ${
                            flashMessage.type === 'success'
                                ? 'bg-green-500 text-white'
                                : flashMessage.type === 'error'
                                  ? 'bg-red-500 text-white'
                                  : 'bg-yellow-500 text-white'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <i className={`fas ${getFlashIcon(flashMessage.type)}`}></i>
                            <span>{flashMessage.message}</span>
                            <button onClick={() => setFlashMessage(null)} className="ml-3 text-white/80 hover:text-white">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    <div className="flex flex-col gap-8 lg:flex-row">
                        <aside className="w-full space-y-6 lg:w-1/4">
                            <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-md">
                                <div className="flex flex-col items-center gap-4">
                                    <Avatar
                                        email={user.email}
                                        avatarType={auth.user.avatar_type}
                                        avatarPath={auth.user.avatar_path}
                                        size={96}
                                        className="h-24 w-24 rounded-full object-cover shadow"
                                    />
                                    <div className="text-center">
                                        <h2 className="text-xl font-semibold text-white">{user.name}</h2>
                                        <p className="text-sm text-gray-400">{user.email}</p>

                                        {!user.email_verified_at && (
                                            <div className="mt-2 text-xs text-yellow-400">
                                                <i className="fas fa-triangle-exclamation mr-1"></i> Email not verified
                                            </div>
                                        )}

                                        {user.two_factor_enabled ? (
                                            <div className="mt-2 text-xs text-green-400">
                                                <i className="fas fa-shield-check mr-1"></i> 2FA Enabled
                                            </div>
                                        ) : (
                                            <div className="mt-2 text-xs text-gray-400">
                                                <i className="fas fa-shield mr-1"></i> 2FA Disabled
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        onClick={() => router.visit(route('dashboard'))}
                                        variant="glass"
                                        className="w-full"
                                        icon="fas fa-arrow-left"
                                    >
                                        Back to Dashboard
                                    </Button>
                                </div>
                            </div>

                            <div
                                className="cursor-pointer rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-4"
                                onClick={() => setShowSecurityInfo(!showSecurityInfo)}
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-indigo-300">
                                        <i className="fas fa-shield-alt mr-2"></i>
                                        Account Security
                                    </h3>
                                    <i className={`fas fa-chevron-${showSecurityInfo ? 'up' : 'down'} text-xs text-indigo-300`}></i>
                                </div>

                                {showSecurityInfo && (
                                    <div className="mt-3 space-y-2 text-xs text-gray-300">
                                        <p>
                                            <i className="fas fa-circle-check mr-1 text-green-400"></i>
                                            Secure your account with a strong password
                                        </p>
                                        <p>
                                            <i className="fas fa-circle-check mr-1 text-green-400"></i>
                                            Enable two-factor authentication
                                        </p>
                                        <p>
                                            <i className="fas fa-circle-check mr-1 text-green-400"></i>
                                            Keep your email address verified and updated
                                        </p>
                                        <p>
                                            <i className="fas fa-circle-info mr-1 text-yellow-400"></i>
                                            For advanced security, contact support
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-neutral-900 p-4 shadow-md">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.label}
                                        onClick={() => setActiveTab(tab.label)}
                                        className={`my-2 flex w-full flex-col items-start rounded-lg px-4 py-3 text-left transition ${
                                            activeTab === tab.label ? 'bg-violet-600 text-white' : 'text-gray-300 hover:bg-white/10'
                                        }`}
                                    >
                                        <div className="flex w-full items-center">
                                            <i className={`${tab.icon} mr-3`} />
                                            <span className="font-medium">{tab.label}</span>
                                            {tab.label === '2FA' && user.two_factor_enabled && (
                                                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-xs text-white">
                                                    <i className="fas fa-check"></i>
                                                </span>
                                            )}
                                        </div>
                                        <p className={`mt-1 text-xs ${activeTab === tab.label ? 'text-white/80' : 'text-gray-500'}`}>
                                            {tab.description}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </aside>

                        <section className="w-full rounded-2xl bg-neutral-900 p-8 shadow-md lg:w-3/4">
                            <div className="mb-6 border-b border-white/10 pb-4">
                                <div className="flex items-center justify-between">
                                    <h1 className="text-2xl font-bold text-white">
                                        {activeTab === 'Profile' && 'Profile Settings'}
                                        {activeTab === 'Email' && 'Email Settings'}
                                        {activeTab === 'Password' && 'Password Settings'}
                                        {activeTab === 'Avatar' && 'Avatar Settings'}
                                        {activeTab === '2FA' && 'Two-Factor Authentication'}
                                    </h1>

                                    {activeTab === '2FA' && user.two_factor_enabled && (
                                        <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                                            <i className="fas fa-shield-check mr-1"></i>
                                            Enabled
                                        </span>
                                    )}

                                    {activeTab === '2FA' && !user.two_factor_enabled && (
                                        <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-400">
                                            <i className="fas fa-shield-exclamation mr-1"></i>
                                            Disabled
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-400">{tabs.find((tab) => tab.label === activeTab)?.description}</p>
                            </div>

                            <div className="space-y-8 text-white/80">
                                {activeTab === 'Profile' && <ProfileForm user={user} />}
                                {activeTab === 'Email' && <EmailForm user={user} />}
                                {activeTab === 'Password' && <PasswordForm />}
                                {activeTab === 'Avatar' && <AvatarForm avatarType={user.avatar_type || 'upload'} />}
                                {activeTab === '2FA' && <TwoFactorForm />}
                            </div>
                        </section>
                    </div>
                </div>
            </AppLayout>
        </>
    );
};

export default UserSettings;
