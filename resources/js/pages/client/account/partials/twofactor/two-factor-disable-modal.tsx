import { Button } from '@/components/button';
import { useForm } from '@inertiajs/react';
import React, { useState } from 'react';

export default function Disable2FAModal({ onClose }: { onClose: () => void }) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const handleDisable = (e: React.FormEvent) => {
        e.preventDefault();

        post(route('two-factor.disable'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur">
            <form onSubmit={handleDisable} className="w-full max-w-sm space-y-4 rounded-lg border border-white/10 bg-neutral-900 p-4 shadow-2xl">
                <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 text-red-400">
                        <i className="fas fa-shield-alt"></i>
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-white">Disable Two-Factor Auth</h2>
                        <p className="text-xs text-red-400">This will reduce your account security</p>
                    </div>
                </div>

                <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs text-yellow-300">
                    <div className="flex items-start gap-2">
                        <i className="fas fa-exclamation-triangle mt-0.5"></i>
                        <div>
                            <p className="font-medium">Security Warning</p>
                            <p className="mt-0.5">Disabling 2FA will make your account more vulnerable to unauthorized access.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <label htmlFor="password" className="block text-xs font-medium text-gray-300">
                        Confirm your password
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="w-full rounded-md border border-white/10 bg-neutral-800 px-3 py-2 pr-8 text-white focus:ring-indigo-500"
                            autoFocus
                        />
                        <button
                            type="button"
                            className="absolute top-1/2 right-2.5 -translate-y-1/2 text-gray-400 hover:text-white"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`} />
                        </button>
                    </div>
                    {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
                </div>

                <div className="flex justify-end gap-2 border-t border-white/10 pt-3">
                    <Button type="button" variant="glass" onClick={onClose} className="px-3 py-1.5 text-xs">
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="danger"
                        disabled={processing || data.password.length < 6}
                        loading={processing}
                        className="px-3 py-1.5 text-xs"
                        icon="fas fa-unlink"
                    >
                        Disable 2FA
                    </Button>
                </div>
            </form>
        </div>
    );
}
