import { Link } from '@inertiajs/react';
import React from 'react';

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

interface DropdownItemProps {
    item: {
        label: string;
        icon: string;
        href: string;
    };
    method?: Method;
    className?: string;
}

const DropdownItem: React.FC<DropdownItemProps> = ({ item, className, method = 'get' }) => {
    return (
        <Link
            href={item.href}
            method={method}
            as="button"
            className={`flex w-full cursor-pointer items-center gap-3 px-4 py-2 text-sm transition hover:bg-neutral-800/80 ${className}`}
        >
            <i className={item.icon}></i>
            {item.label}
        </Link>
    );
};

export default DropdownItem;
