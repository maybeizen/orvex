import React from 'react';

interface InputLabelProps {
    htmlFor: string;
    children: React.ReactNode;
}

export const InputLabel: React.FC<InputLabelProps> = ({ htmlFor, children }) => {
    return (
        <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-white">
            {children}
        </label>
    );
};
