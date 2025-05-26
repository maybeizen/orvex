import Avatar from '@/components/avatar';
import AdminLayout from '@/layouts/admin-layout';
import { Auth } from '@/types/global';
import { Head, usePage } from '@inertiajs/react';

const AdminDashboard: React.FC = () => {
    const { auth } = usePage().props as unknown as { auth: Auth };

    return (
        <AdminLayout>
            <Head title="Admin" />

            <div className="space-y-6">
                <div className="w-full max-w-7xl rounded-lg bg-neutral-900 px-4 py-6">
                    <div className="flex items-center gap-4">
                        <Avatar avatarType={auth.user?.avatar_type} avatarPath={auth.user.avatar_path} email={auth.user.email} size={56} />
                        <div className="flex flex-col">
                            <span className="text-xl font-bold">Welcome back, {auth.user.name}</span>
                            <span className="text-sm text-neutral-400">You're logged in as an admin</span>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
