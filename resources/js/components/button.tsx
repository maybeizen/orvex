import clsx from 'clsx';
import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'glass' | 'ghost' | 'text' | 'link' | 'danger' | 'success' | 'warning';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    fullWidth?: boolean;
    loading?: boolean;
    icon?: string; // Font Awesome class name
    iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    disabled = false,
    icon,
    iconPosition = 'left',
    className,
    ...rest
}) => {
    const isDisabled = disabled || loading;

    const baseStyles = clsx(
        'items-center justify-center rounded-lg font-semibold',
        'transform transition duration-150 ease-in-out focus:outline-none',
        'shadow-lg active:translate-y-[2px] active:shadow-md',
        'hover:opacity-95',
        {
            'cursor-not-allowed opacity-50': isDisabled,
            'w-full': fullWidth,
        },
    );

    const sizeStyles = {
        sm: 'px-3 py-1 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-5 py-2.5 text-lg',
        xl: 'px-6 py-3 text-xl',
    };

    const variantStyles = {
        primary: 'bg-gradient-to-r from-violet-500 to-violet-700 text-white hover:opacity-90',
        secondary: 'bg-gray-700 text-white hover:bg-gray-800',
        glass: 'bg-white/10 backdrop-blur text-white border border-white/20',
        ghost: 'bg-transparent border border-white/20 text-white',
        text: 'bg-transparent text-white',
        link: 'text-indigo-400 underline hover:text-indigo-500 shadow-none active:translate-y-0',
        danger: 'text-white bg-red-600 hover:opacity-90',
        success: 'text-white bg-green-600 hover:opacity-90',
        warning: 'text-white bg-amber-500 hover:opacity-90',
    };

    const iconEl = icon ? <i className={clsx(icon, iconPosition === 'right' ? 'order-2 ml-2' : 'mr-2')} /> : null;

    return (
        <button className={clsx(baseStyles, sizeStyles[size], variantStyles[variant], className)} disabled={isDisabled} {...rest}>
            {loading ? (
                <i className="fas fa-spinner animate-spin" />
            ) : (
                <>
                    {icon && iconPosition === 'left' && iconEl}
                    <span>{children}</span>
                    {icon && iconPosition === 'right' && iconEl}
                </>
            )}
        </button>
    );
};
