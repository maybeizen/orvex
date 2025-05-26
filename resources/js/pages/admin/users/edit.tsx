import Avatar from '@/components/avatar';
import { Button } from '@/components/button';
import { Input } from '@/components/input/input';
import AdminLayout from '@/layouts/admin-layout';
import { User } from '@/types/global';
import { Head, useForm } from '@inertiajs/react';
import React, { useState } from 'react';

const AdminUsersEdit: React.FC<{ user: User }> = ({ user }) => {
    const { data, setData, errors, put, processing } = useForm({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'user',
        balance: (user.balance as string) || '0.00',
    });

    const [activeTab, setActiveTab] = useState('profile');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.users.update', { id: user.id }));
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: 'fa-user' },
        { id: 'services', label: 'Services', icon: 'fa-server' },
        { id: 'billing', label: 'Billing', icon: 'fa-credit-card' },
    ];

    const roleDescriptions = {
        admin: 'Full access to all features and user management',
        moderator: 'Can manage content but not users or system settings',
        user: 'Standard user permissions',
        client: "Limited access focused on using the platform's services",
    };

    return (
        <AdminLayout>
            <Head title={`Edit User | ${user.name}`} />

            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">
                    <button onClick={() => window.history.back()} className="mr-4 text-neutral-400 transition-colors hover:text-white">
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    User Management
                </h1>
                <div className="flex space-x-3">
                    <Button variant="glass" onClick={() => (window.location.href = route('admin.users.index'))}>
                        <i className="fas fa-users mr-2"></i>
                        All Users
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                <div className="col-span-1">
                    <div className="overflow-hidden rounded-xl bg-neutral-900 shadow-lg">
                        <div className="p-6 text-center">
                            <div className="mx-auto h-24 w-24 overflow-hidden rounded-full border-2 border-neutral-700 bg-neutral-800">
                                <Avatar
                                    avatarType={user.avatar_type}
                                    avatarPath={user.avatar_path}
                                    email={user.email}
                                    size={96}
                                    className="h-24 w-24 rounded-full object-cover transition-transform group-hover:scale-105"
                                />
                            </div>

                            <h2 className="mt-4 text-xl font-bold text-white">{user.name}</h2>
                            <p className="text-sm text-neutral-400">{user.email}</p>

                            <div className="mt-3">
                                <span
                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                                        user.role === 'admin'
                                            ? 'bg-red-900/30 text-red-400'
                                            : user.role === 'moderator'
                                              ? 'bg-amber-900/30 text-amber-400'
                                              : 'bg-blue-900/30 text-blue-400'
                                    }`}
                                >
                                    <i
                                        className={`fas fa-${
                                            user.role === 'admin' ? 'crown' : user.role === 'moderator' ? 'shield-alt' : 'user'
                                        } mr-1`}
                                    ></i>
                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </span>
                            </div>
                        </div>

                        <div className="border-t border-neutral-800 p-4">
                            <div className="grid grid-cols-2 gap-2 text-center">
                                <div className="rounded-lg bg-neutral-800 p-3">
                                    <p className="text-sm text-neutral-400">User ID</p>
                                    <p className="text-lg font-semibold text-white">{user.id}</p>
                                </div>
                                <div className="rounded-lg bg-neutral-800 p-3">
                                    <p className="text-sm text-neutral-400">Balance</p>
                                    <p className="text-lg font-semibold text-green-400">${data.balance}</p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-neutral-800 p-4">
                            <h3 className="mb-2 text-sm font-medium text-neutral-400">Quick Actions</h3>
                            <div className="space-y-2">
                                <Button variant="danger" className="w-full justify-start" onClick={() => console.log('Suspend user')}>
                                    <i className="fas fa-ban mr-2"></i>
                                    Suspend Account
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-span-1 lg:col-span-3">
                    <div className="overflow-hidden rounded-xl bg-neutral-900 shadow-lg">
                        <div className="border-b border-neutral-800">
                            <div className="flex overflow-x-auto">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        className={`flex items-center px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                                            activeTab === tab.id ? 'border-b-2 border-violet-500 text-white' : 'text-neutral-400 hover:text-white'
                                        }`}
                                        onClick={() => setActiveTab(tab.id)}
                                    >
                                        <i className={`fas ${tab.icon} mr-2`}></i>
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-6">
                            {activeTab === 'profile' && (
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
                                                                <span className="font-bold text-white">
                                                                    {role.charAt(0).toUpperCase() + role.slice(1)}:
                                                                </span>{' '}
                                                                {desc}
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
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setData('role', e.target.value)}
                                                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-white transition-colors focus:border-violet-500 focus:outline-none"
                                            >
                                                <option value="admin">Administrator</option>
                                                <option value="moderator">Moderator</option>
                                                <option value="user">Regular User</option>
                                                <option value="client">Client</option>
                                            </select>
                                            {errors.role && <p className="mt-1 text-sm text-red-500">{errors.role}</p>}
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-end space-x-4">
                                        <Button type="button" variant="glass" onClick={() => window.history.back()}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" variant="primary" loading={processing}>
                                            {processing ? 'Saving Changes...' : 'Save Changes'}
                                        </Button>
                                    </div>
                                </form>
                            )}

                            {activeTab === 'services' && (
                                <div className="py-10 text-center">
                                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-800">
                                        <i className="fas fa-server text-2xl text-neutral-400"></i>
                                    </div>
                                    <h3 className="mb-2 text-lg font-bold text-white">No Active Services</h3>
                                    <p className="mb-6 text-neutral-400">This user doesn't have any active services yet</p>
                                    <Button variant="primary">
                                        <i className="fas fa-plus-circle mr-2"></i>
                                        Add New Service
                                    </Button>
                                </div>
                            )}

                            {activeTab === 'billing' && (
                                <div className="space-y-6">
                                    <div className="mb-6">
                                        <h3 className="mb-4 text-lg font-bold text-white">Balance Management</h3>

                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div>
                                                <Input
                                                    name="balance"
                                                    label="Account Balance ($)"
                                                    type="text"
                                                    value={data.balance}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('balance', e.target.value)}
                                                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-white transition-colors focus:border-violet-500 focus:outline-none"
                                                    placeholder="0.00"
                                                    error={errors.balance}
                                                />
                                            </div>

                                            <div className="flex items-center">
                                                <Button type="button" variant="primary" onClick={() => console.log('Quick add credit')}>
                                                    <i className="fas fa-plus-circle mr-2"></i>
                                                    Add Credit
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-lg bg-neutral-800 p-4">
                                        <h4 className="mb-2 text-sm font-semibold text-white">Transaction History</h4>
                                        <p className="text-sm text-neutral-500 italic">No transaction history available</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminUsersEdit;
