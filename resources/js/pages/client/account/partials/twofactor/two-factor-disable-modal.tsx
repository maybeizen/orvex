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
            <form onSubmit={handleDisable} className="w-full max-w-md space-y-5 rounded-xl border border-white/10 bg-neutral-900 p-6 shadow-2xl">
                <h2 className="text-lg font-semibold text-white">Disable 2FA</h2>
                <p className="text-sm text-gray-400">To disable two-factor authentication, enter your password for verification.</p>

                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Your password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        className="w-full rounded-md border border-white/10 bg-neutral-800 px-4 py-2 pr-10 text-white focus:ring-indigo-500"
                    />
                    <button
                        type="button"
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                    >
                        <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                    </button>
                </div>
                {errors.password && <p className="text-sm text-red-400">{errors.password}</p>}

                <div className="flex justify-end gap-3">
                    <Button type="button" variant="glass" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="danger" icon="fas fa-unlink" disabled={processing}>
                        Disable 2FA
                    </Button>
                </div>
            </form>
        </div>
    );
}
