import '@inertiajs/react';
import type { route as routeFn } from 'ziggy-js';

declare global {
    const route: typeof routeFn;
}

declare module '@inertiajs/react' {
    interface PageProps {
        auth: {
            user: User | null;
        };
    }
}

export interface Auth {
    user: User;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    discord?: string | null;
    avatar_type: 'upload' | 'gravatar' | 'default';
    avatar_path?: string | null;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}
