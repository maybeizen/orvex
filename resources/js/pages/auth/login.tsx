import { Head, router, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

import { Button } from '@/components/button';
import { Input } from '@/components/input/input';
import AuthLayout from '@/layouts/auth-layout';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
};

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

const Login: React.FC<LoginProps> = ({ status, canResetPassword }) => {
    const { data, setData, post, processing, errors, reset } = useForm<Required<LoginForm>>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout>
            <Head title="Log in" />

            {status && (
                <div className="mb-4 rounded-md bg-green-600/10 px-4 py-3 text-center text-sm font-medium text-green-400 shadow">{status}</div>
            )}

            <form onSubmit={submit} className="flex flex-col gap-4">
                <Input
                    label="Email address"
                    name="email"
                    type="email"
                    required
                    autoFocus
                    placeholder="you@example.com"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    error={errors.email}
                    tabIndex={1}
                />

                <Input
                    label={
                        <div className="flex items-center justify-between">
                            <span>Password</span>
                            {canResetPassword && (
                                <button
                                    type="button"
                                    onClick={() => router.visit(route('password.request'))}
                                    className="text-sm text-indigo-400 hover:underline"
                                    tabIndex={5}
                                >
                                    Forgot?
                                </button>
                            )}
                        </div>
                    }
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    error={errors.password}
                    tabIndex={2}
                />

                <Button type="submit" fullWidth loading={processing} tabIndex={4}>
                    Log in
                </Button>
            </form>
            <div className="mt-3 text-center text-sm text-gray-400">
                Don’t have an account?{' '}
                <Button variant="text" onClick={() => router.visit(route('register'))} tabIndex={6}>
                    Sign up
                </Button>
            </div>
        </AuthLayout>
    );
};

export default Login;
