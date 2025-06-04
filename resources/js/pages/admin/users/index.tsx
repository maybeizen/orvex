import { Button } from '@/components/button';
import { Input } from '@/components/input/input';
import AdminLayout from '@/layouts/admin-layout';
import { Head, router, usePage } from '@inertiajs/react';
import React, { useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    role: string;
    avatar_type: 'upload' | 'gravatar' | 'default';
    avatar_path: string | null;
    two_factor_enabled: boolean;
    created_at: string;
}

const AdminUsers: React.FC = () => {
    const { users, auth } = usePage().props as unknown as { users: User[]; auth: { user: { id: number } } };
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = users.filter((user) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            user.name.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower) ||
            user.role.toLowerCase().includes(searchLower)
        );
    });

    const handleDeleteUser = (userId: number, userName: string) => {
        if (confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
            router.delete(route('admin.users.delete', { id: userId }));
        }
    };

    return (
        <AdminLayout>
            <Head title="Users" />

            <div className="space-y-6">
                <div className="w-full max-w-7xl overflow-hidden rounded-lg bg-neutral-900 shadow-lg">
                    <div className="flex justify-between border-b border-neutral-800 px-6 py-4">
                        <div className="flex items-center">
                            <Input
                                label=""
                                placeholder={`Search ${users.length} user(s)`}
                                name="search"
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="focus:ring-opacity-50 w-full border-none bg-neutral-800 px-4 py-2 text-white placeholder-neutral-400 transition duration-150 focus:ring-2 focus:ring-violet-500"
                            />
                        </div>
                        <div className="flex items-center">
                            <Button variant="primary" size="md" icon="fas fa-plus mr-2">
                                <span>Add New User</span>
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-neutral-800/50 text-left">
                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-neutral-400 uppercase">ID</th>
                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-neutral-400 uppercase">Name</th>
                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-neutral-400 uppercase">Email</th>
                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-neutral-400 uppercase">Role</th>
                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-neutral-400 uppercase">2FA</th>
                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-neutral-400 uppercase">Created</th>
                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-neutral-400 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800">
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => {
                                        const isCurrentUser = user.id === auth.user.id;
                                        const isEmailVerified = !!user.email_verified_at;
                                        return (
                                            <tr key={user.id}>
                                                <td className="px-6 py-4 text-sm whitespace-nowrap text-neutral-300">
                                                    {user.id}{' '}
                                                    {isCurrentUser && <i className="fas fa-star ml-1 text-yellow-500" title="This is you" />}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-white">{user.name}</td>
                                                <td className="px-6 py-4 text-sm whitespace-nowrap text-neutral-300">
                                                    <div className="flex items-center">
                                                        {user.email}
                                                        {isEmailVerified ? (
                                                            <i className="fas fa-check-circle ml-1 text-green-400" title="Email verified"></i>
                                                        ) : (
                                                            <i
                                                                className="fas fa-exclamation-circle ml-1 text-amber-400"
                                                                title="Email not verified"
                                                            ></i>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                                                            user.role === 'admin'
                                                                ? 'bg-purple-100 text-purple-800'
                                                                : user.role === 'moderator'
                                                                  ? 'bg-blue-100 text-blue-800'
                                                                  : 'bg-green-100 text-green-800'
                                                        }`}
                                                    >
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm whitespace-nowrap">
                                                    {user.two_factor_enabled ? (
                                                        <i className="fas fa-check mr-1 text-xl text-green-500" />
                                                    ) : (
                                                        <i className="fas fa-xmark mr-1 text-xl text-red-500" />
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm whitespace-nowrap text-neutral-300">
                                                    {new Date(user.created_at).toLocaleDateString(undefined, {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </td>
                                                <td className="px-6 py-4 text-sm whitespace-nowrap">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            onClick={() => {
                                                                router.visit(route('admin.users.edit', { id: user.id }));
                                                            }}
                                                            title="Edit user"
                                                            type="button"
                                                        >
                                                            <i className="fas fa-edit" />
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => handleDeleteUser(user.id, user.name)}
                                                            title="Delete user"
                                                            type="button"
                                                        >
                                                            <i className="fas fa-trash" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-neutral-400">
                                            <div className="flex flex-col items-center">
                                                <i className="fas fa-search mb-3 text-4xl" />
                                                <p>No users found matching your search.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {filteredUsers.length > 0 && (
                        <div className="border-t border-neutral-800 bg-neutral-900 px-6 py-4 text-sm text-neutral-400">
                            Showing {filteredUsers.length} of {users.length} users
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminUsers;
