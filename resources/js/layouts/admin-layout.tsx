import React from 'react';

import { Button } from '@/components/button';
import NavItem from '@/components/layout/nav-item';
import Navbar from '@/components/layout/navbar';
import { router } from '@inertiajs/react';

interface AdminLayoutProps {
    children: React.ReactNode;
    className?: string;
    childClassName?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, className = '', childClassName = '' }) => {
    return (
        <div className={`flex min-h-screen text-white ${className}`}>
            <AdminNav />
            <main className="flex min-h-screen w-full bg-zinc-950 px-6 py-24">
                <div className={`mx-auto w-full max-w-7xl ${childClassName}`}>{children}</div>
            </main>
        </div>
    );
};

export default AdminLayout;

const AdminNav: React.FC = () => {
    return (
        <Navbar>
            <Navbar.Left>
                <h1
                    onClick={() => router.visit(route('welcome'))}
                    className="cursor-pointer bg-gradient-to-r from-violet-400 to-indigo-600 bg-clip-text font-bold text-transparent"
                >
                    Admin Panel
                </h1>
            </Navbar.Left>

            <Navbar.Center className="hidden lg:block">
                <NavItem
                    label="Dashboard"
                    icon="fas fa-objects-column"
                    href={route('admin.dashboard')}
                    active={route().current('admin.dashboard')}
                ></NavItem>
                <NavItem label="Users" icon="fas fa-users" href={route('admin.users.index')} active={route().current('admin.users.index')}></NavItem>
                <NavItem label="Products" icon="fas fa-boxes-stacked" href=""></NavItem>
                <NavItem label="Services" icon="fas fa-server" href=""></NavItem>
                <NavItem label="Invoices" icon="fas fa-file-invoice-dollar" href=""></NavItem>
                <NavItem label="Panel" icon="fas fa-solar-panel" href=""></NavItem>
                <NavItem label="Coupons" icon="fas fa-tags" href=""></NavItem>
            </Navbar.Center>

            <Navbar.Right>
                <Button variant="primary" size="sm" icon="fas fa-objects-column" onClick={() => router.visit(route('dashboard'))}>
                    Dashboard
                </Button>
            </Navbar.Right>
        </Navbar>
    );
};
