import { Button } from '@/components/button';
import AdminLayout from '@/layouts/admin-layout';
import { Tab, User } from '@/types/global';
import { Head } from '@inertiajs/react';
import React, { useState } from 'react';
import BillingTab from './partials/billing-tab';
import ProfileTab from './partials/profile-tab';
import TabSelector from './partials/selector';
import ServicesTab from './partials/services-tab';
import UserInfo from './partials/user-info';

interface AdminUsersEditProps {
    user: User;
}

const AdminUsersEdit: React.FC<AdminUsersEditProps> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<string>('profile');

    const tabs: Tab[] = [
        { id: 'profile', label: 'Profile', icon: 'fa-user' },
        { id: 'services', label: 'Services', icon: 'fa-server' },
        { id: 'billing', label: 'Billing', icon: 'fa-credit-card' },
    ];

    return (
        <AdminLayout>
            <Head title={`Edit User | ${user.name}`} />

            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">
                    <button onClick={() => window.history.back()} className="mr-4 text-neutral-400 transition-colors hover:text-white" type="button">
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

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                <div className="col-span-1">
                    <UserInfo user={user} />
                </div>

                <div className="col-span-1 lg:col-span-3">
                    <div className="overflow-hidden rounded-xl bg-neutral-900 shadow-lg">
                        <TabSelector tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

                        <div className="p-6">
                            {activeTab === 'profile' && <ProfileTab user={user} />}
                            {activeTab === 'services' && <ServicesTab user={user} />}
                            {activeTab === 'billing' && <BillingTab user={user} />}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminUsersEdit;
