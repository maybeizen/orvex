import { Head, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useRef } from 'react';

import { Button } from '@/components/button';
import AuthLayout from '@/layouts/auth-layout';

const TwoFactorChallenge: React.FC = () => {
    const { data, setData, post, processing, errors } = useForm<{
        code: string;
    }>({
        code: '',
    });

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }

        if (data.code.length === 6 && !processing) {
            post(route('two-factor.challenge'), {
                preserveScroll: true,
            });
        }
    }, [data.code, processing]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('two-factor.challenge'), {
            preserveScroll: true,
        });
    };

    return (
        <AuthLayout>
            <Head title="Two-Factor Challenge" />

            <div className="mb-4 text-center">
                <h1 className="text-xl font-semibold text-white">Two-Factor Authentication</h1>
                <p className="mt-1 text-sm text-gray-400">Enter the 6-digit code from your authenticator app</p>
            </div>

            <div className="mb-4 rounded-md border border-indigo-500/30 bg-indigo-500/10 p-3 text-xs text-indigo-300">
                <i className="fas fa-info-circle mr-1.5" />
                <span>Open your authenticator app and enter the 6-digit code shown for this site.</span>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-4">
                <div className="space-y-1">
                    <label htmlFor="code" className="block text-xs font-medium text-gray-300">
                        Authentication Code
                    </label>
                    <input
                        id="code"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoFocus
                        autoComplete="one-time-code"
                        placeholder="123456"
                        maxLength={6}
                        value={data.code}
                        onChange={(e) => setData('code', e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full rounded-md border border-white/10 bg-neutral-800 px-3 py-2 text-center text-base tracking-widest text-white outline-none focus:ring-1 focus:ring-indigo-500"
                        aria-describedby="code-hint"
                    />
                    {errors.code && <p className="text-xs text-red-400">{errors.code}</p>}
                </div>
                <div id="code-hint" className="text-center text-xs text-gray-400">
                    {6 - data.code.length} digits remaining
                </div>

                <Button type="submit" className="mt-2 w-full" disabled={processing || data.code.length !== 6} loading={processing}>
                    {processing ? 'Verifying...' : 'Verify Code'}
                </Button>
            </form>

            <div className="mt-5 text-center text-xs text-gray-400">
                <p className="mb-2">Don't have access to your authenticator app?</p>
                <Button
                    variant="text"
                    onClick={() => router.visit(route('logout'), { method: 'post' })}
                    className="text-xs text-red-400 hover:underline"
                >
                    <i className="fas fa-sign-out-alt mr-1"></i> Cancel and Log Out
                </Button>
            </div>
        </AuthLayout>
    );
};

export default TwoFactorChallenge;
