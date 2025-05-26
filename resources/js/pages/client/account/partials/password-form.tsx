import { Button } from '@/components/button';
import { Input } from '@/components/input/input';
import { useForm } from '@inertiajs/react';
import React, { useState } from 'react';

export default function PasswordForm() {
    const [successMessage, setSuccessMessage] = useState('');
    const { data, setData, post, processing, errors } = useForm({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => {
                setSuccessMessage('Your password has been updated.');
                setTimeout(() => setSuccessMessage(''), 3000);
            },
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                label="Current Password"
                name="current_password"
                type="password"
                value={data.current_password}
                onChange={(e) => setData('current_password', e.target.value)}
                placeholder="Current password"
                className="w-full rounded-lg border border-white/10 bg-neutral-800 p-2 text-sm text-white"
                showPasswordToggle
            />
            <Input
                label="New Password"
                name="new"
                type="password"
                value={data.new_password}
                onChange={(e) => setData('new_password', e.target.value)}
                placeholder="New password"
                className="w-full rounded-lg border border-white/10 bg-neutral-800 p-2 text-sm text-white"
                showPasswordToggle
            />
            <Input
                label="Confirm Password"
                name="new_password_confirmation"
                type="password"
                value={data.new_password_confirmation}
                onChange={(e) => setData('new_password_confirmation', e.target.value)}
                placeholder="Confirm new password"
                className="w-full rounded-lg border border-white/10 bg-neutral-800 p-2 text-sm text-white"
                showPasswordToggle
            />
            {Object.values(errors).map((error, i) => (
                <p key={i} className="text-sm text-red-400">
                    {error}
                </p>
            ))}

            {successMessage && <p className="text-sm font-medium text-green-400">{successMessage}</p>}

            <Button type="submit" variant="primary" icon="fas fa-lock" loading={processing}>
                Change Password
            </Button>
        </form>
    );
}
