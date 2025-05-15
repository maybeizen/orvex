import { Button } from '@/components/button';
import AuthLayout from '@/layouts/auth-layout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function VerifyEmail() {
    const { props } = usePage<{ auth: { user: { email: string } }; status?: string }>();
    const { status, auth } = props;
    const { post, processing } = useForm({});

    const handleResend: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <AuthLayout>
            <Head title="Verify Email" />

            <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-white">Please verify your email</h1>

                <p className="mt-4 text-sm text-gray-400">
                    We’ve sent a verification link to <span className="font-medium text-white">{auth.user.email}</span>.<br />
                    To access your account, please click the link in your inbox.
                </p>

                {status === 'verification-link-sent' && (
                    <div className="mt-4 rounded-md bg-green-600/10 px-4 py-3 text-sm font-medium text-green-400 shadow">
                        A new verification link has been sent.
                    </div>
                )}
            </div>

            <form onSubmit={handleResend} className="flex flex-col gap-4">
                <Button type="submit" loading={processing} variant="primary" icon="fas fa-paper-plane" fullWidth>
                    Resend Verification Email
                </Button>
            </form>

            <div className="mt-3 text-center text-sm text-gray-400">
                Not your email?{' '}
                <Button variant="text" onClick={() => post(route('logout'))}>
                    Log out
                </Button>
            </div>
        </AuthLayout>
    );
}
