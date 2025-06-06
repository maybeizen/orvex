import Avatar from '@/components/avatar';
import { Button } from '@/components/button';
import { User, UserRole } from '@/types/global';
import React from 'react';

interface UserInfoProps {
    user: User;
    confirmAction?: (title: string, message: string, action: () => void) => void;
}

type RoleStyle = {
    [key in UserRole]: {
        bgColor: string;
        textColor: string;
        icon: string;
    };
};

const UserInfo: React.FC<UserInfoProps> = ({ user, confirmAction }) => {
    const roleStyles: RoleStyle = {
        admin: {
            bgColor: 'bg-red-900/30',
            textColor: 'text-red-400',
            icon: 'crown',
        },
        client: {
            bgColor: 'bg-blue-900/30',
            textColor: 'text-blue-400',
            icon: 'briefcase',
        },
        user: {
            bgColor: 'bg-blue-900/30',
            textColor: 'text-blue-400',
            icon: 'user',
        },
    };

    const currentRoleStyle = roleStyles[user.role];
    const isEmailVerified = !!user.email_verified_at;

    const handleSuspendUser = () => {
        if (confirmAction) {
            confirmAction(
                'Suspend User Account',
                `Are you sure you want to suspend ${user.name}'s account? They will no longer be able to log in or access any services.`,
                () => {
                    console.log('Suspending user', user.id);
                },
            );
        } else {
            if (confirm(`Are you sure you want to suspend ${user.name}'s account?`)) {
                console.log('Suspending user', user.id);
            }
        }
    };

    return (
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
                <div className="flex items-center justify-center gap-2">
                    <p className="text-sm text-neutral-400">{user.email}</p>
                    {isEmailVerified ? (
                        <i className="fas fa-check-circle text-xs text-green-400" title="Email verified"></i>
                    ) : (
                        <i className="fas fa-exclamation-circle text-xs text-amber-400" title="Email not verified"></i>
                    )}
                </div>

                <div className="mt-3">
                    <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${currentRoleStyle.bgColor} ${currentRoleStyle.textColor}`}
                    >
                        <i className={`fas fa-${currentRoleStyle.icon} mr-1`}></i>
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
                        <p className="text-lg font-semibold text-green-400">${Number(user.balance).toFixed(2)}</p>
                    </div>
                </div>
            </div>

            <div className="border-t border-neutral-800 p-4">
                <h3 className="mb-2 text-sm font-medium text-neutral-400">User Activity</h3>
                <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg bg-neutral-800 p-3">
                        <span className="text-sm text-neutral-400">Account Status</span>
                        <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-400">Active</span>
                    </div>
                </div>
            </div>

            <div className="border-t border-neutral-800 p-4">
                <h3 className="mb-2 text-sm font-medium text-neutral-400">Quick Actions</h3>
                <div className="space-y-2">
                    <Button variant="danger" className="w-full justify-start" onClick={handleSuspendUser} type="button">
                        <i className="fas fa-ban mr-2"></i>
                        Suspend Account
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default UserInfo;
