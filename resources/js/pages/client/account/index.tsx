import Avatar from '@/components/avatar';
import { Button } from '@/components/button';
import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import React, { useState } from 'react';

import type AuthProps from '@/types/global';

import AvatarForm from './partials/avatar-form';
import EmailForm from './partials/email-form';
import PasswordForm from './partials/password-form';
import ProfileForm from './partials/profile-form';
import TwoFactorForm from './partials/two-factor-form';

const tabs = [
    { label: 'Profile', icon: 'fas fa-user' },
    { label: 'Email', icon: 'fas fa-envelope' },
    { label: 'Password', icon: 'fas fa-lock' },
    { label: 'Avatar', icon: 'fas fa-image' },
    { label: '2FA', icon: 'fas fa-shield-alt' },
];

const UserSettings: React.FC = () => {
    const { auth } = usePage().props as unknown as { auth: AuthProps };
    const user = auth?.user;
    const [activeTab, setActiveTab] = useState('Profile');

    if (!user) return null;

    return (
        <>
            <Head title="User Settings" />

            <AppLayout className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 py-24" childClassName="max-w-7xl w-full">
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
                                </div>

                                <Button onClick={() => router.visit(route('dashboard'))} variant="glass" className="w-full" icon="fas fa-arrow-left">
                                    Back to Dashboard
                                </Button>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-neutral-900 p-4 shadow-md">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.label}
                                    onClick={() => setActiveTab(tab.label)}
                                    className={`my-2 flex w-full items-center justify-start gap-4 rounded-lg px-4 py-2 text-left text-sm font-medium transition ${
                                        activeTab === tab.label ? 'bg-violet-600 text-white' : 'text-gray-300 hover:bg-white/10'
                                    }`}
                                >
                                    <i className={tab.icon} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </aside>

                    <section className="w-full rounded-2xl bg-neutral-900 p-8 shadow-md lg:w-3/4">
                        <div className="mb-6 border-b border-white/10 pb-4">
                            <h1 className="text-2xl font-bold text-white">User Settings</h1>
                            <p className="text-sm text-gray-400">Update your account preferences and information.</p>
                        </div>

                        <div className="space-y-8 text-white/80">
                            {activeTab === 'Profile' && <ProfileForm user={user} />}
                            {activeTab === 'Email' && <EmailForm user={user} />}
                            {activeTab === 'Password' && <PasswordForm />}
                            {activeTab === 'Avatar' && <AvatarForm />}
                            {activeTab === '2FA' && <TwoFactorForm />}
                        </div>
                    </section>
                </div>
            </AppLayout>
        </>
    );
};

export default UserSettings;
