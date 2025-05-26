import { usePage } from '@inertiajs/react';
import React from 'react';

import NavItem from '@/components/layout/nav-item';
import Navbar from '@/components/layout/navbar';
import { router } from '@inertiajs/react';

import Avatar from '@/components/avatar';
import DropdownDivider from '@/components/dropdown/divider';
import Dropdown from '@/components/dropdown/dropdown';
import DropdownItem from '@/components/dropdown/item';

interface AppLayoutProps {
    children: React.ReactNode;
    className?: string;
    childClassName?: string;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, className = '', childClassName = '' }) => {
    return (
        <div className={`flex min-h-screen bg-neutral-950 text-white ${className}`}>
            <AppNav />
            <main className={`${childClassName}`}>{children}</main>
        </div>
    );
};

export default AppLayout;

const AppNav: React.FC = () => {
    const { auth } = usePage().props;

    return (
        <Navbar>
            <Navbar.Left>
                <h1
                    onClick={() => router.visit(route('welcome'))}
                    className="cursor-pointer bg-gradient-to-r from-violet-400 to-indigo-600 bg-clip-text font-bold text-transparent"
                >
                    Orvex
                </h1>
            </Navbar.Left>

            <Navbar.Center className="hidden lg:block">
                <NavItem label="Dashboard" icon="fas fa-objects-column" href="" active={route().current('dashboard')}></NavItem>
                <NavItem label="Services" icon="fas fa-briefcase" href=""></NavItem>
                <NavItem label="Invoices" icon="fas fa-money-check-alt" href=""></NavItem>
                <NavItem label="Designer" icon="far fa-vector-square" href=""></NavItem>
                <NavItem label="News" icon="far fa-newspaper" href=""></NavItem>
            </Navbar.Center>

            <Navbar.Right>
                {auth && auth.user && (
                    <Dropdown
                        label={
                            <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 shadow-md backdrop-blur-md transition hover:bg-white/15">
                                <Avatar avatarType={auth.user?.avatar_type} avatarPath={auth.user.avatar_path} email={auth.user.email} size={24} />
                                <i className="fas fa-chevron-down text-sm text-white" />
                            </div>
                        }
                    >
                        <DropdownItem item={{ label: 'Profile', icon: 'fas fa-user-circle', href: route('profile.settings') }} />
                        <DropdownItem item={{ label: 'Services', icon: 'fas fa-briefcase', href: '' }} />
                        <DropdownItem item={{ label: 'Invoices', icon: 'fas fa-money-check', href: '' }} />
                        <DropdownDivider />
                        <DropdownItem item={{ label: 'Discord', icon: 'fab fa-discord', href: '' }} />
                        <DropdownItem item={{ label: 'Panel', icon: 'fas fa-objects-column', href: '' }} />
                        <DropdownDivider />
                        {auth.user.role === 'admin' && (
                            <DropdownItem item={{ label: 'Admin', icon: 'fas fa-shield-halved', href: route('admin.dashboard') }} />
                        )}
                        <DropdownItem item={{ label: 'Log out', icon: 'fas fa-sign-out-alt', href: route('logout') }} method="post" />
                    </Dropdown>
                )}
            </Navbar.Right>
        </Navbar>
    );
};
