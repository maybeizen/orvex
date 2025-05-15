import Avatar from '@/components/avatar';
import { Button } from '@/components/button';
import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import React from 'react';

const Dashboard: React.FC = () => {
    const { auth } = usePage().props;
    const user = auth?.user;

    if (!user) return null;

    return (
        <>
            <Head title="Dashboard" />

            <AppLayout className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 py-24" childClassName="max-w-7xl w-full">
                <div className="flex flex-col gap-8 lg:flex-row">
                    <aside className="w-full space-y-6 lg:w-1/4">
                        <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-md">
                            <div className="flex flex-col items-center gap-4">
                                <Avatar
                                    avatarType={auth.user.avatar_type}
                                    avatarPath={auth.user.avatar_path}
                                    email={user.email}
                                    size={96}
                                    className="h-24 w-24 rounded-full object-cover shadow"
                                />
                                <div className="text-center">
                                    <h2 className="text-xl font-semibold text-white">{user.name}</h2>
                                    <p className="text-sm text-gray-400">{user.email}</p>
                                </div>

                                <div className="mt-6 w-full space-y-3 text-sm text-white/80">
                                    <div className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-2">
                                        <span>Status</span>
                                        <span className="inline-flex items-center gap-2 rounded-full bg-green-700/20 px-3 py-0.5 text-sm font-medium text-green-400">
                                            <span className="h-2 w-2 rounded-full bg-green-400" />
                                            Online
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-2">
                                        <span>Created</span>
                                        <span className="inline-flex items-center gap-2 text-indigo-300">
                                            <i className="fas fa-calendar-alt" />
                                            {new Date(user.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => router.visit(route('profile.settings'))}
                                    variant="primary"
                                    className="mt-6 w-full"
                                    icon="fas fa-user-cog"
                                >
                                    Update Profile
                                </Button>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-md">
                            <h3 className="mb-2 text-lg font-semibold text-white">Connect Discord</h3>
                            <p className="mb-4 text-sm text-gray-400">
                                Connected as <span className="font-medium text-indigo-400">{user.discord?.username ?? 'Not linked'}</span>
                            </p>
                            <Button variant="primary" icon="fas fa-unlink" onClick={() => console.log('Disconnect Discord')}>
                                Disconnect
                            </Button>
                        </div>
                    </aside>

                    <section className="w-full rounded-2xl bg-neutral-900 p-8 shadow-md lg:w-3/4">
                        <div className="mb-6 border-b border-white/10 pb-4">
                            <h2 className="text-2xl font-bold text-white">Your Services</h2>
                            <p className="text-sm text-gray-400">Manage your active servers and tools.</p>
                        </div>

                        <div className="space-y-4">
                            <span className="text-sm text-gray-400">Coming soon.</span>
                        </div>
                    </section>
                </div>
            </AppLayout>
        </>
    );
};

export default Dashboard;
