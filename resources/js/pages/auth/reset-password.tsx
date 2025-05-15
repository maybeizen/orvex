import { Button } from '@/components/button';
import { Input } from '@/components/input/input';
import AuthLayout from '@/layouts/auth-layout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface ResetPasswordProps {
    token: string;
    email: string;
}

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout>
            <Head title="Reset Password" />

            <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-white">Reset your password</h1>
                <p className="mt-4 text-sm text-gray-400">Enter a new password below to finish resetting your account.</p>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-4">
                <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    error={errors.email}
                    readOnly
                />

                <Input
                    label="New Password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    error={errors.password}
                    autoFocus
                />

                <Input
                    label="Confirm Password"
                    name="password_confirmation"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={data.password_confirmation}
                    onChange={(e) => setData('password_confirmation', e.target.value)}
                    error={errors.password_confirmation}
                />

                <Button type="submit" fullWidth loading={processing}>
                    Reset Password
                </Button>
            </form>
        </AuthLayout>
    );
}
