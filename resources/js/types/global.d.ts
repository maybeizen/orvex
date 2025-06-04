import '@inertiajs/react';
import type { route as routeFn } from 'ziggy-js';

declare global {
    const route: typeof routeFn;
}

export type UserRole = 'admin' | 'client' | 'user';
export type AvatarType = 'upload' | 'gravatar';
export type BalanceAction = 'add' | 'subtract';
export type FormDataConvertible = string | number | boolean | null | File | Blob;

export interface Auth {
    user: User;
}

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    role: UserRole;
    balance: string | number;
    discord_id?: string | null;
    discord_username?: string | null;
    avatar_type: AvatarType;
    avatar_path?: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface RoleDescription {
    [key: string]: string;
}

export interface ProfileFormData {
    name: string;
    email: string;
    role: UserRole;
    [key: string]: unknown;
}

export interface BalanceAdjustment {
    amount: string;
    action: BalanceAction;
    note: string;
    [key: string]: unknown;
}

export interface Tab {
    id: string;
    label: string;
    icon: string;
}
