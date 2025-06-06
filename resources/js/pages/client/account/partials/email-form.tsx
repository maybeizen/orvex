import { Button } from '@/components/button';
import { Input } from '@/components/input/input';
import { useForm } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';

export default function EmailForm({ user }: { user: any }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: user.email,
        current_password: '',
    });

    const [successMessage, setSuccessMessage] = useState('');
    const [resending, setResending] = useState(false);
    const [resent, setResent] = useState(false);
    const [showPasswordField, setShowPasswordField] = useState(false);
    const [emailChanged, setEmailChanged] = useState(false);
    const [securityInfo, setSecurityInfo] = useState(false);

    useEffect(() => {
        setEmailChanged(data.email !== user.email);
    }, [data.email, user.email]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (emailChanged && !showPasswordField) {
            setShowPasswordField(true);
            return;
        }

        post(route('email.update'), {
            onSuccess: () => {
                setResent(false);
                setSuccessMessage('Email updated successfully. Please check your inbox to verify your new email address.');
                setTimeout(() => setSuccessMessage(''), 7000);
                setShowPasswordField(false);
                setEmailChanged(false);
                setData('current_password', '');
            },
            onError: () => {
                if (emailChanged) {
                    setShowPasswordField(true);
                }
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
        <div className="space-y-6">
            <div
                className="cursor-pointer rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-4"
                onClick={() => setSecurityInfo(!securityInfo)}
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-indigo-300">
                        <i className="fas fa-envelope mr-2"></i>
                        Email Security
                    </h3>
                    <i className={`fas fa-chevron-${securityInfo ? 'up' : 'down'} text-xs text-indigo-300`}></i>
                </div>

                {securityInfo && (
                    <div className="mt-3 space-y-2 text-xs text-gray-300">
                        <p>Your email address is the primary way we identify you and help you recover your account. Keep it up-to-date and secure.</p>
                        <p>
                            <i className="fas fa-circle-info mr-1 text-yellow-400"></i>
                            When you change your email, you'll need to verify the new address before it becomes active.
                        </p>
                        <p>
                            <i className="fas fa-shield-check mr-1 text-green-400"></i>
                            For security, we require your current password when changing your email.
                        </p>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                    <Input
                        type="email"
                        name="email"
                        label="Email Address"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        className={`w-full rounded-lg border ${emailChanged ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-white/10 bg-neutral-800'} p-2 text-sm text-white`}
                        placeholder="Your email address"
                        required
                    />
                    {errors.email && (
                        <p className="mt-1 text-sm text-red-400">
                            <i className="fas fa-exclamation-circle mr-1"></i>
                            {errors.email}
                        </p>
                    )}
                    {emailChanged && !errors.email && (
                        <p className="mt-1 text-xs text-yellow-400">
                            <i className="fas fa-triangle-exclamation mr-1"></i>
                            You're changing your email address. Password verification will be required.
                        </p>
                    )}
                </div>

                {showPasswordField && (
                    <div className="animate-fadeIn space-y-1">
                        <Input
                            type="password"
                            name="current_password"
                            label="Current Password"
                            value={data.current_password}
                            onChange={(e) => setData('current_password', e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-neutral-800 p-2 text-sm text-white"
                            placeholder="Enter your current password for verification"
                            showPasswordToggle
                            required
                        />
                        {errors.current_password && (
                            <p className="mt-1 text-sm text-red-400">
                                <i className="fas fa-exclamation-circle mr-1"></i>
                                {errors.current_password}
                            </p>
                        )}
                    </div>
                )}

                {!user.email_verified_at ? (
                    <div className="flex items-center gap-2 rounded-lg border border-yellow-600/20 bg-yellow-600/10 px-4 py-3 text-sm text-yellow-300">
                        <i className="fas fa-triangle-exclamation"></i>
                        <span>Your email address is not verified, which limits your account access.</span>
                        <Button
                            type="button"
                            size="sm"
                            variant="text"
                            onClick={resendVerification}
                            loading={resending}
                            className="ml-auto whitespace-nowrap"
                        >
                            <i className="fas fa-paper-plane mr-1"></i> Resend
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 rounded-lg border border-green-600/20 bg-green-600/10 px-4 py-3 text-sm text-green-400">
                        <i className="fas fa-circle-check"></i>
                        <span>Your email address is verified and secure.</span>
                    </div>
                )}

                {successMessage && (
                    <div className="rounded-md border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-400">
                        <i className="fas fa-check-circle mr-2"></i>
                        {successMessage}
                    </div>
                )}

                {resent && (
                    <div className="rounded-md border border-blue-500/20 bg-blue-500/10 p-3 text-sm text-blue-400">
                        <i className="fas fa-envelope mr-2"></i>
                        Verification link sent to your email address.
                    </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                    <Button type="submit" variant="primary" icon={emailChanged ? 'fas fa-check' : 'fas fa-envelope'} loading={processing}>
                        {emailChanged ? (showPasswordField ? 'Confirm Change' : 'Change Email') : 'Update Email'}
                    </Button>

                    {(emailChanged || showPasswordField) && (
                        <Button
                            type="button"
                            variant="glass"
                            onClick={() => {
                                setData('email', user.email);
                                setData('current_password', '');
                                setShowPasswordField(false);
                                setEmailChanged(false);
                            }}
                        >
                            Cancel
                        </Button>
                    )}
                </div>
            </form>
        </div>
    );
}
