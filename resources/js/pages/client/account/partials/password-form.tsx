import { Button } from '@/components/button';
import { Input } from '@/components/input/input';
import { useForm } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';

export default function PasswordForm() {
    const [successMessage, setSuccessMessage] = useState('');
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [strengthLabel, setStrengthLabel] = useState('');
    const [strengthColor, setStrengthColor] = useState('bg-neutral-700');
    const [showTips, setShowTips] = useState(false);
    const [lastPasswordChange, setLastPasswordChange] = useState('');

    const { data, setData, post, processing, errors, reset } = useForm({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    });

    useEffect(() => {
        evaluatePasswordStrength(data.new_password);
    }, [data.new_password]);

    const evaluatePasswordStrength = (password: string) => {
        if (!password) {
            setPasswordStrength(0);
            setStrengthLabel('');
            setStrengthColor('bg-neutral-700');
            return;
        }

        let score = 0;
        let feedback = [];

        if (password.length < 8) {
            score += 0;
        } else if (password.length < 10) {
            score += 1;
        } else if (password.length < 12) {
            score += 2;
        } else {
            score += 3;
        }

        if (/[A-Z]/.test(password)) score += 1;
        if (/[a-z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;

        if (/(.)\1{2,}/.test(password)) score -= 1;
        if (/^(123|abc|qwerty|password|admin|welcome)/i.test(password)) score -= 2;

        score = Math.max(0, Math.min(5, score));
        setPasswordStrength(score);

        if (score <= 1) {
            setStrengthLabel('Very Weak');
            setStrengthColor('bg-red-500');
        } else if (score === 2) {
            setStrengthLabel('Weak');
            setStrengthColor('bg-orange-500');
        } else if (score === 3) {
            setStrengthLabel('Moderate');
            setStrengthColor('bg-yellow-500');
        } else if (score === 4) {
            setStrengthLabel('Strong');
            setStrengthColor('bg-green-500');
        } else {
            setStrengthLabel('Very Strong');
            setStrengthColor('bg-emerald-500');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (data.new_password.length < 12) {
            setShowTips(true);
            return;
        }

        if (data.new_password === data.current_password) {
            setShowTips(true);
            return;
        }

        post(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => {
                setSuccessMessage('Your password has been updated successfully.');
                setLastPasswordChange(new Date().toLocaleDateString());
                reset();
                setTimeout(() => setSuccessMessage(''), 5000);
            },
            onError: () => {
                setShowTips(true);
            },
        });
    };

    return (
        <div className="space-y-6">
            <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-4">
                <h3 className="mb-2 text-sm font-semibold text-indigo-300">
                    <i className="fas fa-shield-alt mr-2"></i>
                    Password Security
                </h3>
                <p className="text-xs text-gray-300">
                    Strong passwords are essential for protecting your account. Use a combination of letters, numbers, and symbols. Never reuse
                    passwords across multiple sites.
                </p>
                {lastPasswordChange && <p className="mt-2 text-xs text-gray-400">Last changed: {lastPasswordChange}</p>}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Current Password"
                    name="current_password"
                    type="password"
                    value={data.current_password}
                    onChange={(e) => setData('current_password', e.target.value)}
                    placeholder="Your current password"
                    className="w-full rounded-lg border border-white/10 bg-neutral-800 p-2 text-sm text-white"
                    showPasswordToggle
                    required
                />

                <div className="space-y-1">
                    <Input
                        label="New Password"
                        name="new_password"
                        type="password"
                        value={data.new_password}
                        onChange={(e) => setData('new_password', e.target.value)}
                        placeholder="Create a strong password"
                        className="w-full rounded-lg border border-white/10 bg-neutral-800 p-2 text-sm text-white"
                        showPasswordToggle
                        required
                        onFocus={() => setShowTips(true)}
                    />

                    {data.new_password && (
                        <div className="mt-2 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                                <span>Password strength:</span>
                                <span
                                    className={`font-medium ${
                                        passwordStrength <= 1
                                            ? 'text-red-400'
                                            : passwordStrength === 2
                                              ? 'text-orange-400'
                                              : passwordStrength === 3
                                                ? 'text-yellow-400'
                                                : 'text-green-400'
                                    }`}
                                >
                                    {strengthLabel}
                                </span>
                            </div>
                            <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-700">
                                <div
                                    className={`h-full transition-all duration-300 ${strengthColor}`}
                                    style={{ width: `${(passwordStrength / 5) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <Input
                    label="Confirm Password"
                    name="new_password_confirmation"
                    type="password"
                    value={data.new_password_confirmation}
                    onChange={(e) => setData('new_password_confirmation', e.target.value)}
                    placeholder="Confirm your new password"
                    className="w-full rounded-lg border border-white/10 bg-neutral-800 p-2 text-sm text-white"
                    showPasswordToggle
                    required
                />

                {showTips && (
                    <div className="rounded-md bg-neutral-800 p-3 text-xs text-gray-300">
                        <h4 className="mb-2 font-semibold text-white">Password Requirements:</h4>
                        <ul className="list-disc space-y-1 pl-5">
                            <li className={data.new_password.length >= 12 ? 'text-green-400' : ''}>At least 12 characters long</li>
                            <li className={/[A-Z]/.test(data.new_password) ? 'text-green-400' : ''}>Contains uppercase letters</li>
                            <li className={/[a-z]/.test(data.new_password) ? 'text-green-400' : ''}>Contains lowercase letters</li>
                            <li className={/[0-9]/.test(data.new_password) ? 'text-green-400' : ''}>Contains numbers</li>
                            <li className={/[^A-Za-z0-9]/.test(data.new_password) ? 'text-green-400' : ''}>Contains special characters</li>
                            <li className={data.new_password !== data.current_password || !data.new_password ? 'text-green-400' : 'text-red-400'}>
                                Different from current password
                            </li>
                        </ul>
                    </div>
                )}

                {Object.values(errors).map((error, i) => (
                    <p key={i} className="text-sm text-red-400">
                        {error}
                    </p>
                ))}

                {successMessage && (
                    <div className="rounded-md border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-400">
                        <i className="fas fa-check-circle mr-2"></i>
                        {successMessage}
                    </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                    <Button type="submit" variant="primary" icon="fas fa-lock" loading={processing}>
                        Change Password
                    </Button>

                    <Button
                        type="button"
                        variant="glass"
                        onClick={() => {
                            reset();
                            setShowTips(false);
                        }}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
}
