import { Button } from '@/components/button';
import { Input } from '@/components/input/input';
import AdminLayout from '@/layouts/admin-layout';
import { Head, router, usePage } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';

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
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [selectAll, setSelectAll] = useState(false);
    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('id');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const filterOptions = [
        { value: 'all', label: 'All Users', icon: 'users' },
        { value: 'admin', label: 'Admins', icon: 'crown' },
        { value: 'client', label: 'Clients', icon: 'briefcase' },
        { value: 'verified', label: 'Verified', icon: 'check-circle' },
        { value: 'unverified', label: 'Unverified', icon: 'exclamation-circle' },
        { value: '2fa', label: '2FA Enabled', icon: 'shield-check' },
    ];

    const filteredUsers = users
        .filter((user) => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch =
                user.name.toLowerCase().includes(searchLower) ||
                user.email.toLowerCase().includes(searchLower) ||
                user.role.toLowerCase().includes(searchLower);

            if (!matchesSearch) return false;

            if (activeFilter === 'all') return true;
            if (activeFilter === 'admin' && user.role === 'admin') return true;
            if (activeFilter === 'client' && user.role === 'client') return true;
            if (activeFilter === 'verified' && user.email_verified_at) return true;
            if (activeFilter === 'unverified' && !user.email_verified_at) return true;
            if (activeFilter === '2fa' && user.two_factor_enabled) return true;

            return false;
        })
        .sort((a, b) => {
            let aValue: any = a[sortBy as keyof User];
            let bValue: any = b[sortBy as keyof User];

            if (sortBy === 'created_at') {
                aValue = new Date(aValue).getTime();
                bValue = new Date(bValue).getTime();
            }

            if (sortDirection === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortDirection('asc');
        }
    };

    const toggleSelectAll = () => {
        const newSelectAll = !selectAll;
        setSelectAll(newSelectAll);

        if (newSelectAll) {
            setSelectedUsers(filteredUsers.map((user) => user.id));
        } else {
            setSelectedUsers([]);
        }
    };

    const toggleSelectUser = (userId: number) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter((id) => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    useEffect(() => {
        if (selectedUsers.length === filteredUsers.length && filteredUsers.length > 0) {
            setSelectAll(true);
        } else {
            setSelectAll(false);
        }
    }, [selectedUsers, filteredUsers]);

    const handleDeleteUser = (userId: number, userName: string) => {
        if (confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
            router.delete(route('admin.users.delete', { id: userId }));
        }
    };

    const handleBulkAction = (action: string) => {
        if (selectedUsers.length === 0) return;

        if (action === 'delete') {
            if (confirm(`Are you sure you want to delete ${selectedUsers.length} selected users? This action cannot be undone.`)) {
                router.delete(route('admin.users.bulk-delete'), { data: { userIds: selectedUsers } });
            }
        } else if (action === 'verify') {
            router.post(route('admin.users.bulk-verify'), { userIds: selectedUsers });
        } else if (action === 'export') {
            router.post(route('admin.users.export'), { userIds: selectedUsers });
        }
    };

    return (
        <AdminLayout>
            <Head title="Users Management" />

            <div className="space-y-6">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Users Management</h1>
                        <p className="text-sm text-neutral-400">Manage and view all users in the system</p>
                    </div>
                    <Button variant="primary" size="md" icon="fas fa-plus mr-2" onClick={() => router.visit(route('admin.users.create'))}>
                        <span>Add New User</span>
                    </Button>
                </div>

                <div className="w-full max-w-7xl rounded-lg bg-neutral-900 shadow-lg">
                    <div className="flex flex-col gap-4 border-b border-neutral-800 p-4 md:flex-row md:items-center md:justify-between">
                        <div className="w-full md:w-1/3">
                            <Input
                                label=""
                                placeholder={`Search ${users.length} user(s)`}
                                name="search"
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="focus:ring-opacity-50 w-full border-none bg-neutral-800 px-4 py-2 text-white placeholder-neutral-400 transition duration-150 focus:ring-2 focus:ring-violet-500"
                                leftIcon="fas fa-search"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {filterOptions.map((filter) => (
                                <button
                                    key={filter.value}
                                    className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                        activeFilter === filter.value
                                            ? 'bg-indigo-500 text-white'
                                            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                                    }`}
                                    onClick={() => setActiveFilter(filter.value)}
                                >
                                    <i className={`fas fa-${filter.icon} mr-1`}></i>
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedUsers.length > 0 && (
                        <div className="flex items-center justify-between border-b border-neutral-800 bg-indigo-500/10 px-6 py-3">
                            <span className="text-sm text-indigo-300">
                                <i className="fas fa-check-circle mr-2"></i>
                                {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
                            </span>
                            <div className="flex gap-2">
                                <Button variant="glass" size="sm" onClick={() => handleBulkAction('verify')}>
                                    <i className="fas fa-envelope-circle-check mr-1"></i> Verify
                                </Button>
                                <Button variant="glass" size="sm" onClick={() => handleBulkAction('export')}>
                                    <i className="fas fa-download mr-1"></i> Export
                                </Button>
                                <Button variant="danger" size="sm" onClick={() => handleBulkAction('delete')}>
                                    <i className="fas fa-trash mr-1"></i> Delete
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-neutral-800/50 text-left">
                                    <th className="px-6 py-3">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={selectAll}
                                                onChange={toggleSelectAll}
                                                className="h-4 w-4 rounded border-neutral-600 bg-neutral-700 text-indigo-500 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </th>
                                    <th
                                        className="cursor-pointer px-6 py-3 text-xs font-medium tracking-wider text-neutral-400 uppercase"
                                        onClick={() => handleSort('id')}
                                    >
                                        <div className="flex items-center">
                                            ID
                                            {sortBy === 'id' && (
                                                <i className={`fas fa-${sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'} ml-1 text-xs`}></i>
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="cursor-pointer px-6 py-3 text-xs font-medium tracking-wider text-neutral-400 uppercase"
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center">
                                            Name
                                            {sortBy === 'name' && (
                                                <i className={`fas fa-${sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'} ml-1 text-xs`}></i>
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="cursor-pointer px-6 py-3 text-xs font-medium tracking-wider text-neutral-400 uppercase"
                                        onClick={() => handleSort('email')}
                                    >
                                        <div className="flex items-center">
                                            Email
                                            {sortBy === 'email' && (
                                                <i className={`fas fa-${sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'} ml-1 text-xs`}></i>
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="cursor-pointer px-6 py-3 text-xs font-medium tracking-wider text-neutral-400 uppercase"
                                        onClick={() => handleSort('role')}
                                    >
                                        <div className="flex items-center">
                                            Role
                                            {sortBy === 'role' && (
                                                <i className={`fas fa-${sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'} ml-1 text-xs`}></i>
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="cursor-pointer px-6 py-3 text-xs font-medium tracking-wider text-neutral-400 uppercase"
                                        onClick={() => handleSort('two_factor_enabled')}
                                    >
                                        <div className="flex items-center">
                                            2FA
                                            {sortBy === 'two_factor_enabled' && (
                                                <i className={`fas fa-${sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'} ml-1 text-xs`}></i>
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="cursor-pointer px-6 py-3 text-xs font-medium tracking-wider text-neutral-400 uppercase"
                                        onClick={() => handleSort('created_at')}
                                    >
                                        <div className="flex items-center">
                                            Created
                                            {sortBy === 'created_at' && (
                                                <i className={`fas fa-${sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'} ml-1 text-xs`}></i>
                                            )}
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-neutral-400 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800">
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => {
                                        const isCurrentUser = user.id === auth.user.id;
                                        const isEmailVerified = !!user.email_verified_at;
                                        const isSelected = selectedUsers.includes(user.id);

                                        return (
                                            <tr
                                                key={user.id}
                                                className={`transition-colors ${isSelected ? 'bg-indigo-900/20' : 'hover:bg-neutral-800'}`}
                                            >
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelectUser(user.id)}
                                                        className="h-4 w-4 rounded border-neutral-600 bg-neutral-700 text-indigo-500 focus:ring-indigo-500"
                                                    />
                                                </td>
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
                                                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                                            <i className="fas fa-check mr-1"></i> Enabled
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                                            <i className="fas fa-xmark mr-1"></i> Disabled
                                                        </span>
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
                                                            disabled={isCurrentUser}
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
                                        <td colSpan={8} className="px-6 py-8 text-center text-neutral-400">
                                            <div className="flex flex-col items-center">
                                                <i className="fas fa-search mb-3 text-4xl" />
                                                <p>No users found matching your search.</p>
                                                {searchTerm && (
                                                    <Button variant="link" className="mt-2 text-indigo-400" onClick={() => setSearchTerm('')}>
                                                        Clear search
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {filteredUsers.length > 0 && (
                        <div className="flex items-center justify-between border-t border-neutral-800 bg-neutral-900 px-6 py-4 text-sm">
                            <div className="text-neutral-400">
                                Showing {filteredUsers.length} of {users.length} users
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="glass" size="sm" disabled>
                                    <i className="fas fa-chevron-left mr-1"></i> Previous
                                </Button>
                                <Button variant="glass" size="sm" disabled>
                                    Next <i className="fas fa-chevron-right ml-1"></i>
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminUsers;
