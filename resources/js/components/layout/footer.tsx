import { Link } from '@inertiajs/react';
import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="relative overflow-hidden bg-neutral-950 px-6 pt-20 pb-48 text-white">
            <div className="absolute top-0 left-1/2 h-[2px] w-3/4 -translate-x-1/2 bg-gradient-to-r from-violet-500 via-indigo-500 to-violet-500 opacity-30" />

            <div className="relative z-10 mx-auto grid max-w-7xl gap-12 text-sm text-gray-400 sm:grid-cols-2 md:grid-cols-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-bold text-white">
                        <i className="fas fa-server text-xl text-indigo-400" />
                        Orvex
                    </div>
                    <p className="text-sm leading-relaxed text-gray-400">
                        Game server hosting made for creators. Built to scale, optimized for speed, and crafted with passion.
                    </p>
                </div>

                <div>
                    <h4 className="mb-3 font-semibold text-white">Navigation</h4>
                    <ul className="space-y-2">
                        <li>
                            <Link href="/" className="hover:text-white">
                                Home
                            </Link>
                        </li>
                        <li>
                            <Link href="/#features" className="hover:text-white">
                                Features
                            </Link>
                        </li>
                        <li>
                            <Link href="/#games" className="hover:text-white">
                                Games
                            </Link>
                        </li>
                        <li>
                            <Link href="/plans" className="hover:text-white">
                                Plans
                            </Link>
                        </li>
                    </ul>
                </div>

                <div>
                    <h4 className="mb-3 font-semibold text-white">Resources</h4>
                    <ul className="space-y-2">
                        <li>
                            <Link href="/support" className="hover:text-white">
                                Support
                            </Link>
                        </li>
                        <li>
                            <Link href="/docs" className="hover:text-white">
                                Documentation
                            </Link>
                        </li>
                        <li>
                            <Link href="/status" className="hover:text-white">
                                Server Status
                            </Link>
                        </li>
                    </ul>
                </div>

                <div>
                    <h4 className="mb-3 font-semibold text-white">Company</h4>
                    <ul className="mb-4 space-y-2">
                        <li>
                            <Link href="/privacy" className="hover:text-white">
                                Privacy Policy
                            </Link>
                        </li>
                        <li>
                            <Link href="/terms" className="hover:text-white">
                                Terms of Service
                            </Link>
                        </li>
                    </ul>

                    <div className="flex gap-4 text-lg">
                        <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400">
                            <i className="fab fa-twitter" />
                        </a>
                        <a href="https://discord.com/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400">
                            <i className="fab fa-discord" />
                        </a>
                        <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400">
                            <i className="fab fa-github" />
                        </a>
                    </div>
                </div>
            </div>

            <div className="relative z-10 mt-10 border-t border-white/10 pt-6 text-center text-xs text-gray-500">
                &copy; {new Date().getFullYear()} Orvex. All rights reserved.
            </div>

            <div className="pointer-events-none absolute bottom-[-6rem] left-1/2 mb-12 -translate-x-1/2 text-[10rem] font-extrabold tracking-widest text-white/5 select-none sm:text-[12rem]">
                Orvex
            </div>
        </footer>
    );
};

export { Footer };
