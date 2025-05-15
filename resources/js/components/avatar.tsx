import md5 from 'md5';
import React from 'react';

interface AvatarProps {
    email: string;
    avatarType: 'upload' | 'gravatar' | 'default';
    avatarPath?: string | null;
    size?: number;
    alt?: string;
    className?: string;
    rounded?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({ email, avatarType, avatarPath, size = 40, alt = 'User Avatar', className = '', rounded = true }) => {
    let avatarUrl = '/images/default-avatar.png';

    if (avatarType === 'upload' && avatarPath) {
        avatarUrl = `/storage/${avatarPath}`;
    } else if (avatarType === 'gravatar') {
        const hash = md5(email.trim().toLowerCase());
        avatarUrl = `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
    }

    console.log('Avatar URL:', avatarUrl); // ✅ Debug this

    return (
        <img
            src={avatarUrl}
            alt={alt}
            width={size}
            height={size}
            className={`object-cover ${rounded ? 'rounded-full' : 'rounded-md'} ${className}`}
        />
    );
};

export default Avatar;
