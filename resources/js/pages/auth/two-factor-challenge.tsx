import { Head, router, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

import { Button } from '@/components/button';
import { Input } from '@/components/input/input';
import AuthLayout from '@/layouts/auth-layout';

const TwoFactorChallenge: React.FC = () => {
    const { data, setData, post, processing, errors } = useForm<{
        code: string;
    }>({
        code: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('two-factor.challenge'), {
            preserveScroll: true,
        });
    };

    return (
        <AuthLayout>
            <Head title="Two-Factor Challenge" />

            <div className="mb-6 text-center">
                <h1 className="text-xl font-semibold text-white">Two-Factor Authentication</h1>
                <p className="mt-1 text-sm text-gray-400">Enter the 6-digit code from your authenticator app to continue.</p>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-6">
                <Input
                    label="Authentication Code"
                    name="code"
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    autoComplete="one-time-code"
                    placeholder="123456"
                    maxLength={6}
                    value={data.code}
                    onChange={(e) => setData('code', e.target.value)}
                    error={errors.code}
                    disabled={processing}
                />

                <Button type="submit" className="w-full" disabled={processing} loading={processing}>
                    Verify Code
                </Button>
            </form>

            <div className="mt-4 text-center text-sm text-gray-400">
                <Button variant="text" onClick={() => router.visit(route('logout'), { method: 'post' })} className="text-red-400 hover:underline">
                    Cancel and Log Out
                </Button>
            </div>
        </AuthLayout>
    );
};

export default TwoFactorChallenge;
