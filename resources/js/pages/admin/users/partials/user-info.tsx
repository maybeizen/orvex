import Avatar from '@/components/avatar';
import { Button } from '@/components/button';
import { User } from '@/types/global';
import React from 'react';

interface UserInfoProps {
    user: User;
}

const UserInfo: React.FC<UserInfoProps> = ({ user }) => {
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
                        <i className={`fas fa-${user.role === 'admin' ? 'crown' : 'user'} mr-1`}></i>
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
                <h3 className="mb-2 text-sm font-medium text-neutral-400">Quick Actions</h3>
                <div className="space-y-2">
                    <Button variant="danger" className="w-full justify-start" onClick={() => console.log('Suspend user')}>
                        <i className="fas fa-ban mr-2"></i>
                        Suspend Account
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default UserInfo;
