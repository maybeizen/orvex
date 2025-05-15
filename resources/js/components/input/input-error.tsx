import React from 'react';

interface InputErrorProps {
    error?: string;
}

export const InputError: React.FC<InputErrorProps> = ({ error }) => {
    if (!error) return null;

    return <p className="mt-1 text-sm text-red-600">{error}</p>;
};
