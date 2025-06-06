import React, { useState } from 'react';
import { InputError } from './input-error';
import { InputLabel } from './input-label';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: React.ReactNode;
    name: string;
    error?: string;
    text?: string;
    showPasswordToggle?: boolean;
    leftIcon?: string;
}

export const Input: React.FC<InputProps> = ({ label, name, error, text, className, showPasswordToggle = false, leftIcon, type, ...props }) => {
    const [visible, setVisible] = useState(false);
    const inputType = showPasswordToggle && type === 'password' ? (visible ? 'text' : 'password') : type;

    return (
        <div className="mb-4">
            <InputLabel htmlFor={name}>{label}</InputLabel>
            <div className="relative">
                {leftIcon && (
                    <div className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400">
                        <i className={leftIcon}></i>
                    </div>
                )}
                <input
                    id={name}
                    name={name}
                    type={inputType}
                    defaultValue={text}
                    aria-invalid={!!error}
                    className={`w-full rounded-md border px-3 py-2 ${leftIcon ? 'pl-9' : ''} ${showPasswordToggle ? 'pr-12' : ''} focus:outline-none ${
                        error ? 'border-red-500' : 'border-neutral-800 focus:border-neutral-700'
                    } ${className ?? ''}`}
                    {...props}
                />

                {showPasswordToggle && type === 'password' && (
                    <div className="absolute top-1/2 right-2 -translate-y-1/2">
                        <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setVisible((v) => !v)}
                            className="flex h-8 w-8 items-center justify-center text-gray-400 hover:text-white"
                            aria-label="Toggle password visibility"
                        >
                            <i className={`fas ${visible ? 'fa-eye-slash' : 'fa-eye'}`} />
                        </button>
                    </div>
                )}
            </div>
            <InputError error={error} />
        </div>
    );
};
