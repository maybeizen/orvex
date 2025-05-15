import { Head, router, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

import { Button } from '@/components/button';
import { Input } from '@/components/input/input';
import AuthLayout from '@/layouts/auth-layout';

const ForgotPassword: React.FC = ({ status }: { status?: string }) => {
    const { data, setData, post, processing, errors } = useForm<Required<{ email: string }>>({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <AuthLayout>
            <Head title="Forgot Password" />

            {status && (
                <div className="mb-6 rounded-md bg-green-600/10 px-4 py-3 text-center text-sm font-medium text-green-400 shadow">{status}</div>
            )}

            <form onSubmit={submit} className="flex flex-col gap-6">
                <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    autoFocus
                    autoComplete="off"
                    placeholder="you@example.com"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    error={errors.email}
                    disabled={processing}
                />

                <Button type="submit" className="w-full" disabled={processing} loading={processing}>
                    Email Password Reset Link
                </Button>
            </form>
            <div className="mt-3 text-center text-sm text-gray-400">
                <Button variant="text" onClick={() => router.visit(route('login'))} className="text-indigo-400 hover:underline">
                    Or return to Login
                </Button>
            </div>
        </AuthLayout>
    );
};

export default ForgotPassword;
