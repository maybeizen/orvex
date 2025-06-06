import Avatar from '@/components/avatar';
import AdminLayout from '@/layouts/admin-layout';
import { Auth } from '@/types/global';
import { Head, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const AdminDashboard: React.FC = () => {
    const { auth } = usePage().props as unknown as { auth: Auth };
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);

        return () => clearInterval(timer);
    }, []);

    const stats = [
        { name: 'Total Users', value: '253', icon: 'users', change: '+12%', color: 'text-green-400' },
        { name: 'Active Services', value: '189', icon: 'server', change: '+5%', color: 'text-green-400' },
        { name: 'Monthly Revenue', value: '$12,456', icon: 'chart-line', change: '+23%', color: 'text-green-400' },
    ];

    return (
        <AdminLayout>
            <Head title="Admin Dashboard" />

            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                        <p className="text-sm text-neutral-400">
                            {currentTime.toLocaleDateString(undefined, {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </p>
                    </div>
                </div>

                <div className="w-full max-w-7xl rounded-lg bg-neutral-900 px-4 py-6">
                    <div className="flex items-center gap-4">
                        <Avatar avatarType={auth.user?.avatar_type} avatarPath={auth.user.avatar_path} email={auth.user.email} size={56} />
                        <div className="flex flex-col">
                            <span className="text-xl font-bold">Welcome back, {auth.user.name}</span>
                            <span className="text-sm text-neutral-400">You're logged in as an admin</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {stats.map((stat, index) => (
                        <div key={index} className="rounded-lg bg-neutral-900 p-4 shadow-md transition-all hover:bg-neutral-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-neutral-400">{stat.name}</p>
                                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                                </div>
                                <div className="rounded-full bg-neutral-800 p-3">
                                    <i className={`fas fa-${stat.icon} text-xl text-indigo-400`}></i>
                                </div>
                            </div>
                            <div className="mt-2">
                                <span className={`text-xs ${stat.color}`}>{stat.change} since last month</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
