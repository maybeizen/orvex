import React, { useEffect, useState } from 'react';

import Avatar from '@/components/avatar';
import { Button } from '@/components/button';
import { Auth } from '@/types/global';
import { router, usePage } from '@inertiajs/react';

interface AdminLayoutProps {
    children: React.ReactNode;
    className?: string;
    childClassName?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, className = '', childClassName = '' }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { auth } = usePage().props as unknown as { auth: Auth };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const sidebar = document.getElementById('admin-sidebar');
            if (sidebar && !sidebar.contains(event.target as Node) && sidebarOpen) {
                setSidebarOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [sidebarOpen]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024 && sidebarOpen) {
                setSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [sidebarOpen]);

    return (
        <div className="flex min-h-screen text-white">
            {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)}></div>}

            <aside
                id="admin-sidebar"
                className={`fixed inset-y-0 left-0 z-30 flex h-screen w-64 flex-col overflow-hidden bg-neutral-900 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-800 px-4">
                    <h1 className="bg-gradient-to-r from-violet-400 to-indigo-600 bg-clip-text text-xl font-bold text-transparent">Admin Panel</h1>
                    <button
                        className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="mb-6 flex items-center gap-3 rounded-lg bg-neutral-800 p-3">
                        <Avatar avatarType={auth.user?.avatar_type} avatarPath={auth.user?.avatar_path} email={auth.user.email} size={40} />
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-white">{auth.user.name}</span>
                            <span className="text-xs text-neutral-400">Administrator</span>
                        </div>
                    </div>

                    <nav className="space-y-1">
                        <SidebarLink
                            href={route('admin.dashboard')}
                            active={route().current('admin.dashboard')}
                            icon="fa-objects-column"
                            label="Dashboard"
                        />
                        <SidebarLink
                            href={route('admin.users.index')}
                            active={route().current('admin.users.index') || route().current('admin.users.edit')}
                            icon="fa-users"
                            label="Users"
                        />
                        <SidebarHeading label="Products & Services" />
                        <SidebarLink href="#" active={false} icon="fa-boxes-stacked" label="Products" />
                        <SidebarLink href="#" active={false} icon="fa-server" label="Services" />
                        <SidebarLink href="#" active={false} icon="fa-file-invoice-dollar" label="Invoices" />
                        <SidebarHeading label="Administration" />
                        <SidebarLink href="#" active={false} icon="fa-solar-panel" label="Panel" />
                        <SidebarLink href="#" active={false} icon="fa-tags" label="Coupons" />
                        <SidebarLink href="#" active={false} icon="fa-chart-line" label="Reports" />
                        <SidebarLink href="#" active={false} icon="fa-gear" label="Settings" />
                    </nav>
                </div>
            </aside>

            <div className="flex flex-1 flex-col lg:ml-64">
                <header className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-900">
                    <div className="flex h-16 items-center justify-between px-4">
                        <div className="flex items-center">
                            <button
                                className="mr-4 rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white lg:hidden"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <i className="fas fa-bars text-lg"></i>
                            </button>
                            <h2 className="text-lg font-medium text-white">
                                {route().current('admin.dashboard') && 'Dashboard'}
                                {route().current('admin.users.index') && 'Users Management'}
                                {route().current('admin.users.edit') && 'Edit User'}
                            </h2>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Button variant="glass" size="sm" onClick={() => router.visit(route('dashboard'))}>
                                <i className="fas fa-arrow-right-from-bracket mr-2"></i>
                                Exit Admin
                            </Button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 bg-zinc-950 px-6 py-6">
                    <div className={`mx-auto w-full max-w-7xl ${childClassName}`}>{children}</div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;

interface SidebarLinkProps {
    href: string;
    label: string;
    icon: string;
    active: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ href, label, icon, active }) => {
    return (
        <a
            href={href}
            className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active ? 'bg-indigo-500/10 text-indigo-400' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
        >
            <i className={`fas ${icon} mr-3 w-5 text-center`}></i>
            {label}
        </a>
    );
};

interface SidebarHeadingProps {
    label: string;
}

const SidebarHeading: React.FC<SidebarHeadingProps> = ({ label }) => {
    return <div className="mt-6 mb-2 px-3 text-xs font-semibold tracking-wider text-neutral-500 uppercase">{label}</div>;
};
