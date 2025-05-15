import { Button } from '@/components/button';
import { Input } from '@/components/input/input';
import { useForm } from '@inertiajs/react';
import React, { useState } from 'react';

export default function EmailForm({ user }: { user: any }) {
    const { data, setData, post, processing, errors } = useForm({
        email: user.email,
    });

    const [successMessage, setSuccessMessage] = useState('');
    const [resending, setResending] = useState(false);
    const [resent, setResent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post(route('email.update'), {
            onSuccess: () => {
                setResent(false);
                setSuccessMessage('Email updated successfully. Please re-verify your email.');
                setTimeout(() => setSuccessMessage(''), 5000);
            },
        });
    };

    const resendVerification = () => {
        setResending(true);
        setResent(false);

        post(route('verification.send'), {
            preserveScroll: true,
            onSuccess: () => {
                setResent(true);
                setResending(false);
            },
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                type="email"
                name="email"
                label="Email Address"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-neutral-800 p-2 text-sm text-white"
                placeholder="Your email"
            />
            {errors.email && <p className="text-sm text-red-400">{errors.email}</p>}

            {!user.email_verified_at ? (
                <div className="flex items-center gap-2 rounded-lg bg-yellow-600/10 px-4 py-2 text-sm text-yellow-300">
                    <i className="far fa-triangle-exclamation" />
                    <span>Your email is not verified.</span>
                    <Button type="button" size="sm" variant="text" onClick={resendVerification} loading={resending} className="ml-auto">
                        Resend
                    </Button>
                </div>
            ) : (
                <div className="flex items-center gap-2 rounded-lg bg-green-600/10 px-4 py-2 text-sm text-green-400">
                    <i className="far fa-circle-check text-green-400" />
                    <span>Your email is verified.</span>
                </div>
            )}

            {successMessage && <p className="text-sm font-medium text-green-400">{successMessage}</p>}
            {resent && <p className="text-sm text-green-400">Verification link sent to your email.</p>}

            <Button type="submit" variant="primary" icon="fas fa-envelope" loading={processing}>
                Update Email
            </Button>
        </form>
    );
}
