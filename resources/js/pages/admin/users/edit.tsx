import { Button } from '@/components/button';
import AdminLayout from '@/layouts/admin-layout';
import { Tab, User } from '@/types/global';
import { Head } from '@inertiajs/react';
import React, { useState } from 'react';
import BillingTab from './partials/billing-tab';
import DiscordTab from './partials/discord-tab';
import ProfileTab from './partials/profile-tab';
import TabSelector from './partials/selector';
import ServicesTab from './partials/services-tab';
import UserInfo from './partials/user-info';

interface AdminUsersEditProps {
    user: User;
}

const AdminUsersEdit: React.FC<AdminUsersEditProps> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<string>('profile');
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmationAction, setConfirmationAction] = useState<{ title: string; message: string; action: () => void } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const isDiscordLinked = !!user.discord_id && !!user.discord_username;

    const tabs: Tab[] = [
        { id: 'profile', label: 'Profile', icon: 'fas fa-user' },
        { id: 'services', label: 'Services', icon: 'fas fa-server' },
        { id: 'billing', label: 'Billing', icon: 'fas fa-credit-card' },
        {
            id: 'discord',
            label: 'Discord',
            icon: 'fab fa-discord',
            tooltip: isDiscordLinked ? undefined : 'User has not linked their Discord account',
        },
    ];

    const confirmAction = (title: string, message: string, action: () => void) => {
        setConfirmationAction({ title, message, action });
        setShowConfirmation(true);
    };

    const handleConfirm = () => {
        if (confirmationAction) {
            setIsLoading(true);
            confirmationAction.action();
            setShowConfirmation(false);
        }
    };

    return (
        <AdminLayout>
            <Head title={`Edit User | ${user.name}`} />

            <div className="mb-6 space-y-4">
                <nav className="flex" aria-label="Breadcrumb">
                    <ol className="inline-flex items-center space-x-2 text-sm font-medium">
                        <li>
                            <a href={route('admin.dashboard')} className="text-neutral-400 hover:text-white">
                                Dashboard
                            </a>
                        </li>
                        <li>
                            <span className="text-neutral-600">/</span>
                        </li>
                        <li>
                            <a href={route('admin.users.index')} className="text-neutral-400 hover:text-white">
                                Users
                            </a>
                        </li>
                        <li>
                            <span className="text-neutral-600">/</span>
                        </li>
                        <li className="max-w-[200px] truncate" aria-current="page">
                            <span className="text-indigo-400">{user.name}</span>
                        </li>
                    </ol>
                </nav>

                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white">
                        <button
                            onClick={() => window.history.back()}
                            className="mr-4 text-neutral-400 transition-colors hover:text-white"
                            type="button"
                        >
                            <i className="fas fa-arrow-left"></i>
                        </button>
                        User Management
                    </h1>
                    <div className="flex space-x-3">
                        <Button variant="glass" onClick={() => (window.location.href = route('admin.users.index'))} type="button">
                            <i className="fas fa-users mr-2"></i>
                            All Users
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                <div className="col-span-1">
                    <UserInfo user={user} confirmAction={confirmAction} />
                </div>

                <div className="col-span-1 lg:col-span-3">
                    <div className="overflow-hidden rounded-xl bg-neutral-900 shadow-lg">
                        <TabSelector tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

                        <div className="p-6">
                            <div className={`transition-opacity duration-300 ${activeTab === 'profile' ? 'opacity-100' : 'hidden opacity-0'}`}>
                                {activeTab === 'profile' && <ProfileTab user={user} confirmAction={confirmAction} />}
                            </div>
                            <div className={`transition-opacity duration-300 ${activeTab === 'services' ? 'opacity-100' : 'hidden opacity-0'}`}>
                                {activeTab === 'services' && <ServicesTab user={user} />}
                            </div>
                            <div className={`transition-opacity duration-300 ${activeTab === 'billing' ? 'opacity-100' : 'hidden opacity-0'}`}>
                                {activeTab === 'billing' && <BillingTab user={user} confirmAction={confirmAction} />}
                            </div>
                            <div className={`transition-opacity duration-300 ${activeTab === 'discord' ? 'opacity-100' : 'hidden opacity-0'}`}>
                                {activeTab === 'discord' && <DiscordTab user={user} />}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showConfirmation && confirmationAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-lg bg-neutral-900 p-6 shadow-lg">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white">{confirmationAction.title}</h3>
                            <button
                                onClick={() => setShowConfirmation(false)}
                                className="rounded-full p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <p className="mb-6 text-neutral-300">{confirmationAction.message}</p>
                        <div className="flex justify-end space-x-3">
                            <Button variant="glass" onClick={() => setShowConfirmation(false)} disabled={isLoading}>
                                Cancel
                            </Button>
                            <Button variant="danger" onClick={handleConfirm} disabled={isLoading}>
                                {isLoading ? <i className="fas fa-spinner fa-spin"></i> : 'Confirm'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminUsersEdit;
