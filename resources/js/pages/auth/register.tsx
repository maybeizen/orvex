import { Head, router, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

import { Button } from '@/components/button';
import { Input } from '@/components/input/input';
import AuthLayout from '@/layouts/auth-layout';

type RegisterForm = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
};

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm<Required<RegisterForm>>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout>
            <Head title="Create an account" />

            <form onSubmit={submit} className="flex flex-col gap-4">
                <Input
                    label="Name"
                    name="name"
                    type="text"
                    autoFocus
                    placeholder="Your full name"
                    required
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    error={errors.name}
                    disabled={processing}
                    tabIndex={1}
                />

                <Input
                    label="Email address"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    error={errors.email}
                    disabled={processing}
                    tabIndex={2}
                />

                <Input
                    label="Password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    error={errors.password}
                    disabled={processing}
                    tabIndex={3}
                />

                <Input
                    label="Confirm Password"
                    name="password_confirmation"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={data.password_confirmation}
                    onChange={(e) => setData('password_confirmation', e.target.value)}
                    error={errors.password_confirmation}
                    disabled={processing}
                    tabIndex={4}
                />

                <Button type="submit" fullWidth tabIndex={5} loading={processing}>
                    Create Account
                </Button>
            </form>
            <div className="mt-3 text-center text-sm text-gray-400">
                Already have an account?{' '}
                <Button variant="text" onClick={() => router.visit(route('login'))}>
                    Log in
                </Button>
            </div>
        </AuthLayout>
    );
}
