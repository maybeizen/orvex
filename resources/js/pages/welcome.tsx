import { Head, router, usePage } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/button';
import { Footer } from '@/components/layout/footer';

import NavItem from '@/components/layout/nav-item';
import Navbar from '@/components/layout/navbar';

import type AuthProps from '@/types/global';

const Welcome: React.FC = () => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const bgImages = ['/img/minecraft.jpg', '/img/satisfactory.jpg', '/img/terraria.jpg', '/img/ark.jpg', '/img/palworld.png'];

    const { auth } = usePage().props as unknown as { auth: AuthProps };

    const features = [
        {
            icon: 'fas fa-rocket',
            title: 'Instant Deployment',
            desc: 'Launch your game server in seconds. No setup, no headaches — just go.',
        },
        {
            icon: 'fas fa-shield-alt',
            title: 'Ironclad Security',
            desc: 'Built-in DDoS protection and daily backups keep your worlds safe.',
        },
        {
            icon: 'fas fa-cogs',
            title: 'Mod & Plugin Ready',
            desc: 'Easily install Forge, Fabric, or your favorite plugins with full control.',
        },
        {
            icon: 'fas fa-chart-line',
            title: 'Performance That Scales',
            desc: 'Optimized infrastructure that adapts to your game’s growth.',
        },
        {
            icon: 'fas fa-server',
            title: 'Custom Control Panel',
            desc: 'Clean, fast, and powerful — manage your server like a pro.',
        },
        {
            icon: 'fas fa-users',
            title: 'Collaborative Access',
            desc: 'Invite teammates, co-owners, or admins with granular permissions.',
        },
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % bgImages.length);
        }, 5_000);

        return () => clearInterval(interval);
    }, []);

    return (
        <>
            <Head title="Welcome" />

            <Navbar>
                <Navbar.Left>
                    <h1 className="bg-gradient-to-r from-violet-400 to-indigo-600 bg-clip-text font-bold text-transparent">Orvex</h1>
                </Navbar.Left>

                <Navbar.Center>
                    <NavItem href={route('welcome')} label="Home" active={route().current('welcome')} icon="far fa-house" />
                    <NavItem href={'idk'} label="Features" active={false} icon="far fa-bolt" disabled />
                    <NavItem href={'idk'} label="Comparison" active={false} icon="far fa-chart-bar" disabled />
                    <NavItem href={'idk'} label="Contact" active={false} icon="far fa-address-book" disabled />
                </Navbar.Center>

                <Navbar.Right>
                    {auth && auth.user ? (
                        <Button variant="primary" size="sm" className="py-2" onClick={() => router.visit(route('dashboard'))}>
                            Dashboard
                        </Button>
                    ) : (
                        <Button variant="primary" size="sm" className="py-2" onClick={() => router.visit(route('login'))}>
                            Get Started
                        </Button>
                    )}
                </Navbar.Right>
            </Navbar>

            <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
                {bgImages.map((src, index) => (
                    <img
                        key={src}
                        src={src}
                        alt="Background carousel"
                        className={`absolute inset-0 z-[-5] h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
                            index === currentImageIndex ? 'opacity-40' : 'opacity-0'
                        }`}
                    />
                ))}

                <div className="absolute inset-0 z-[-1] bg-gradient-to-b from-black/80 via-black/60 to-black/90" />
                <div className="pointer-events-none absolute top-10 left-1/2 z-[-1] h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-violet-500 opacity-10 blur-[120px]" />

                <div className="animate-fade-in flex max-w-6xl flex-col items-center justify-center gap-8 text-center text-white">
                    <h1 className="max-w-3xl text-5xl leading-16 font-extrabold tracking-tight drop-shadow-lg sm:text-6xl">
                        Deploy your dream server with{' '}
                        <span className="bg-gradient-to-r from-violet-500 to-indigo-700 bg-clip-text text-transparent">Orvex</span>
                    </h1>
                    <p className="max-w-xl text-lg leading-relaxed text-gray-300">
                        Blazing-fast, secure, and scalable game servers — built for passionate players, developers, and dreamers. Reliable
                        infrastructure, zero config, full control.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Button variant="primary" size="lg" icon="fas fa-rocket" iconPosition="right">
                            Get Started
                        </Button>
                        <Button variant="glass" size="lg" icon="fas fa-circle-info" iconPosition="right">
                            Learn More
                        </Button>
                    </div>
                </div>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-white opacity-70">
                    <i className="fas fa-chevron-down text-2xl"></i>
                </div>
            </main>

            <section id="features" className="bg-neutral-950 px-6 py-24 text-white" role="region" aria-labelledby="features-heading">
                <div className="mx-auto max-w-6xl text-center">
                    <h2 id="features-heading" className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
                        Features that <span className="bg-gradient-to-r from-indigo-500 to-violet-700 bg-clip-text text-transparent">stand out</span>
                    </h2>
                    <p className="mx-auto mb-16 max-w-2xl text-lg text-gray-400">
                        We don’t just give you servers — we give you power, control, and peace of mind.
                    </p>

                    <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map(({ icon, title, desc }, i) => (
                            <div
                                key={title}
                                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 text-left shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl hover:ring-1 hover:ring-violet-500"
                                style={{ transitionDelay: `${i * 60}ms` }}
                            >
                                <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-violet-500 opacity-10 blur-3xl" />

                                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/20 p-4">
                                    <i className={`${icon} text-2xl text-violet-300`} aria-hidden="true" />
                                </div>

                                <h3 className="mb-2 text-xl font-semibold">{title}</h3>
                                <p className="text-sm text-gray-300">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="games" className="relative z-10 bg-neutral-950 py-20 text-white">
                <div className="pointer-events-none absolute top-[-25px] left-1/2 z-[-1] h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-indigo-500 opacity-20 blur-[140px]" />

                <div className="relative z-10 mx-auto max-w-6xl space-y-12 text-center">
                    <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                        The games you <span className="bg-gradient-to-r from-indigo-400 to-purple-600 bg-clip-text text-transparent">actually</span>{' '}
                        care about
                    </h2>

                    <div className="flex flex-wrap justify-center gap-4 text-base font-medium sm:gap-6 sm:text-lg">
                        {['Minecraft', 'Satisfactory', 'Terraria', 'ARK: Survival', 'Palworld (soon)'].map((game, i) => (
                            <span
                                key={game}
                                className="cursor-default rounded-full border border-white/10 bg-white/5 px-5 py-2 text-white backdrop-blur-sm transition-all duration-200 hover:scale-[1.05] hover:bg-white/10 hover:shadow-lg"
                                style={{ transitionDelay: `${i * 40}ms` }}
                            >
                                {game}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            <section id="comparison" className="bg-neutral-950 px-6 py-24 text-white">
                <div className="mx-auto max-w-6xl space-y-12 text-center">
                    <h2 className="text-4xl font-bold">How Orvex Stacks Up</h2>
                    <p className="mx-auto max-w-xl text-gray-400">
                        Transparent, powerful, and designed to win hearts — see why Orvex is the best value in gaming.
                    </p>

                    <div className="overflow-hidden rounded-xl border border-white/10 bg-neutral-900 shadow-md">
                        <table className="w-full table-fixed text-sm sm:text-base">
                            <thead className="bg-neutral-800 text-center text-xs text-gray-400 uppercase">
                                <tr>
                                    <th className="px-6 py-4 text-left">Provider</th>
                                    <th className="px-6 py-4">Performance</th>
                                    <th className="px-6 py-4">CPU</th>
                                    <th className="px-6 py-4">Custom Panel</th>
                                    <th className="px-6 py-4">Price</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10 text-white">
                                {[
                                    {
                                        name: 'Nether Host',
                                        badge: 'Average',
                                        badgeColor: 'bg-yellow-600/20 text-yellow-400',
                                        cpu: 'Shared Resources',
                                        panel: false,
                                        price: '$',
                                        icon: 'fas fa-fire',
                                    },
                                    {
                                        name: 'Shockbyte',
                                        badge: 'Good',
                                        badgeColor: 'bg-blue-600/20 text-blue-400',
                                        cpu: 'Intel Xeon E-2236',
                                        panel: false,
                                        price: '$$$',
                                        icon: 'fas fa-bolt',
                                    },
                                    {
                                        name: 'LilyPad',
                                        badge: 'Excellent',
                                        badgeColor: 'bg-emerald-600/20 text-emerald-400',
                                        cpu: 'Ryzen 9 7950X',
                                        panel: true,
                                        price: '$$$$$',
                                        icon: 'fas fa-coins',
                                        note: 'Expensive overkill',
                                    },
                                    {
                                        name: 'Orvex',
                                        badge: 'Great',
                                        badgeColor: 'bg-indigo-600/20 text-indigo-400',
                                        cpu: 'Ryzen 5 5800X',
                                        panel: true,
                                        price: '$$',
                                        icon: 'fas fa-star',
                                        highlight: true,
                                        note: 'Best Value',
                                    },
                                ].map(({ name, badge, badgeColor, cpu, panel, price, icon, note, highlight }) => (
                                    <tr
                                        key={name}
                                        className={`text-center ${highlight ? 'bg-gradient-to-r from-violet-800/20 to-indigo-800/20' : 'hover:bg-white/5'} transition`}
                                    >
                                        <td className="flex items-center gap-3 px-6 py-5 font-semibold">
                                            <i className={`${icon} text-xl ${highlight ? 'text-indigo-400' : 'text-white/80'}`} />
                                            <span>{name}</span>
                                            {note && (
                                                <span className="ml-2 rounded bg-yellow-600/20 px-2 py-0.5 text-xs font-medium text-nowrap text-yellow-300">
                                                    {note}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeColor}`}>{badge}</span>
                                        </td>
                                        <td className="px-6 py-5 text-white/90">{cpu}</td>
                                        <td className="px-6 py-5">
                                            {panel ? (
                                                <i className="fas fa-check-circle text-green-400" />
                                            ) : (
                                                <i className="fas fa-times-circle text-red-500" />
                                            )}
                                        </td>
                                        <td className="px-6 py-5 font-medium text-green-400">{price}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mx-auto mt-8 max-w-3xl rounded-lg bg-white/5 p-6 text-left text-sm text-gray-300 shadow-inner">
                        <strong className="text-yellow-300">Note on performance:</strong> While some providers use higher-tier CPUs like the Ryzen 9
                        7950X, our optimized Ryzen 5 5800X processors deliver exceptional real-world performance for Minecraft and Discord bot hosting
                        — at a fraction of the cost. This allows us to offer superior value without compromising on speed or reliability.
                    </div>

                    <div className="pt-12">
                        <Button variant="primary" size="lg" icon="fas fa-arrow-right" iconPosition="right" onClick={() => router.visit('')}>
                            View Hosting Plans
                        </Button>
                    </div>
                </div>
            </section>

            <section className="relative overflow-hidden bg-gradient-to-br from-violet-700 via-indigo-600 to-indigo-800 py-32 text-center text-white">
                <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent blur-[100px]" />
                <div className="relative z-10 mx-auto max-w-3xl space-y-6 px-6">
                    <h2 className="text-5xl leading-tight font-extrabold drop-shadow">Ready to launch something legendary?</h2>
                    <p className="text-lg text-white/80">Take control of your world with hosting that’s actually built for gamers.</p>
                    <Button variant="glass" size="xl" icon="fas fa-rocket" iconPosition="right" onClick={() => router.visit(route(''))}>
                        Get Started for Free
                    </Button>
                </div>
            </section>

            <Footer />
        </>
    );
};

export default Welcome;
