import { Link, usePage } from '@inertiajs/react';
import clsx from 'clsx';
import { ReactNode } from 'react';

interface AuthLayoutProps {
    children: ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
    const currentRoute = usePage().url;

    return (
        <main className="grid min-h-screen grid-cols-1 bg-neutral-950 text-white md:grid-cols-2">
            <section className="relative flex items-center justify-center px-6 py-12 sm:px-12">
                <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-violet-600 opacity-10 blur-[100px]" />

                <div className="animate-fade-in-up relative z-10 w-full max-w-md space-y-10">
                    <div className="space-y-2 text-center">
                        <h1 className="text-4xl font-extrabold tracking-tight drop-shadow sm:text-5xl">Welcome</h1>
                        <p className="text-sm text-gray-400">
                            Let’s get you signed in or started on <span className="font-semibold text-violet-400">Orvex</span>.
                        </p>
                    </div>

                    <div className="flex justify-center gap-4 text-sm font-medium text-gray-400">
                        <Link
                            href={route('login')}
                            className={clsx(
                                'px-3 py-1 transition hover:text-white',
                                currentRoute === '/login' && 'text-white underline underline-offset-4',
                            )}
                        >
                            Sign In
                        </Link>
                        <Link
                            href={route('register')}
                            className={clsx(
                                'px-3 py-1 transition hover:text-white',
                                currentRoute === '/register' && 'text-white underline underline-offset-4',
                            )}
                        >
                            Create Account
                        </Link>
                        <Link
                            href={route('verification.notice')}
                            className={clsx(
                                'px-3 py-1 transition hover:text-white',
                                currentRoute === '/verify-email' && 'text-white underline underline-offset-4',
                            )}
                        >
                            Verify Email
                        </Link>
                    </div>

                    <div className="rounded-xl bg-white/5 p-6 shadow-xl ring-1 ring-white/10 backdrop-blur-md">{children}</div>
                </div>
            </section>

            <section className="items-center justify-center overflow-hidden bg-gradient-to-br from-violet-400/50 to-violet-700/50 px-8 py-12 md:flex">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent blur-[100px]" />
                <div className="relative z-10 max-w-md text-center">
                    <h1 className="mb-10 text-4xl leading-tight font-extrabold tracking-tight drop-shadow">
                        Premium Hosting <span className="text-violet-500">Without The Premium Price</span>
                    </h1>

                    <div className="grid grid-cols-2 gap-5 text-left text-sm">
                        {[
                            {
                                icon: 'fas fa-rocket',
                                title: 'Instant Deployment',
                                desc: 'Launch in seconds — zero config, zero wait.',
                            },
                            {
                                icon: 'fas fa-shield-alt',
                                title: 'Rock-Solid Security',
                                desc: 'DDoS protection that just works. Always.',
                            },
                            {
                                icon: 'fas fa-plug',
                                title: 'Mod Freedom',
                                desc: 'Install Forge, Fabric, or any plugin in clicks.',
                            },
                            {
                                icon: 'fas fa-hard-drive',
                                title: 'Blazing NVMe',
                                desc: 'Storage that doesn’t just perform — it flies.',
                            },
                        ].map(({ icon, title, desc }) => (
                            <div
                                key={title}
                                className="group rounded-xl bg-white/10 p-5 shadow-md backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:scale-[1.015] hover:shadow-lg hover:ring-1 hover:ring-white/10"
                            >
                                <div className="mb-2 flex items-center gap-2 text-white">
                                    <i className={`${icon} text-lg`} />
                                    <span className="text-sm font-semibold">{title}</span>
                                </div>
                                <p className="text-xs text-white/70 transition group-hover:text-white">{desc}</p>
                            </div>
                        ))}
                    </div>

                    <p className="mt-10 text-xs leading-relaxed text-white/60">
                        Orvex is more than just hosting — it’s your home for building something legendary.
                    </p>
                </div>
            </section>
        </main>
    );
};

export default AuthLayout;
