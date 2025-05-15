import React, { ReactNode, useEffect, useState } from 'react';

interface NavbarProps {
    children: ReactNode;
    className?: string;
}

interface SlotProps {
    children: ReactNode;
    className?: string;
}

const Navbar: React.FC<NavbarProps> & {
    Left: React.FC<SlotProps>;
    Center: React.FC<SlotProps>;
    Right: React.FC<SlotProps>;
} = ({ children, className = '' }) => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav
            className={`fixed top-4 left-1/2 z-50 w-full max-w-7xl -translate-x-1/2 transform px-4 ${
                scrolled ? 'bg-neutral-900/5 py-2 shadow-xl backdrop-blur-md' : 'py-3'
            } rounded-2xl border border-neutral-800 bg-neutral-900/40 text-white shadow-lg transition-all duration-300 ${className}`}
        >
            <div className="flex w-full flex-wrap items-center justify-between gap-4">{children}</div>
        </nav>
    );
};

Navbar.Left = ({ children, className = '' }) => <div className={`flex items-center gap-4 ${className}`}>{children}</div>;

Navbar.Center = ({ children, className = '' }) => <div className={`flex items-center justify-center gap-1 ${className}`}>{children}</div>;

Navbar.Right = ({ children, className = '' }) => <div className={`flex items-center gap-4 ${className}`}>{children}</div>;

export default Navbar;
