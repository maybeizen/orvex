import { Link } from '@inertiajs/react';
import React from 'react';

interface NavItemProps {
    href: string;
    label: string;
    active?: boolean;
    icon?: string; // Font Awesome class string
    className?: string;
    tooltip?: string;
    size?: 'sm' | 'md' | 'lg';
    underline?: boolean;
    variant?: 'default' | 'primary' | 'danger';
    disabled?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({
    href,
    label,
    icon,
    className = '',
    active = false,
    tooltip,
    size = 'md',
    underline = false,
    variant = 'default',
    disabled = false,
}) => {
    const sizeClasses = {
        sm: 'text-sm px-3 py-1.5',
        md: 'text-base px-4 py-2',
        lg: 'text-lg px-5 py-2.5',
    };

    const variantClasses = {
        default: 'text-white hover:text-violet-400',
        primary: 'text-violet-300 hover:text-white',
        danger: 'text-red-400 hover:text-red-600',
    };

    const activeColor = 'text-violet-500 font-semibold';
    const disabledClass = 'opacity-30 cursor-not-allowed';

    const combinedClassName = `relative inline-flex items-center transition-all duration-300 rounded-md ${sizeClasses[size]} ${
        disabled ? disabledClass : active ? activeColor : variantClasses[variant]
    } ${className}`;

    const content = (
        <>
            {icon && <i className={`mr-2 ${icon}`} aria-hidden="true" />}
            <span>{label}</span>
            {underline && !disabled && (
                <span
                    className={`absolute bottom-0 left-0 h-[2px] w-full origin-left transform bg-violet-500 transition-transform duration-300 ${
                        active ? 'scale-x-100' : 'scale-x-0'
                    }`}
                />
            )}
        </>
    );

    return disabled ? (
        <span className={combinedClassName} title={tooltip}>
            {content}
        </span>
    ) : (
        <Link href={href} className={combinedClassName} title={tooltip}>
            {content}
        </Link>
    );
};

export default NavItem;
