import { Button } from '@/components/button';
import { Input } from '@/components/input/input';
import { UserRole } from '@/types/global';
import { useForm } from '@inertiajs/react';
import React, { useState } from 'react';

interface UserFormProps {
    isOpen: boolean;
    onClose: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ isOpen, onClose }) => {
    const [passwordOption, setPasswordOption] = useState<'set' | 'random'>('random');

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: '',
        email: '',
        role: 'client' as UserRole,
        password: '',
        password_confirmation: '',
        send_password_email: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordOption === 'random') {
            setData('password', '');
            setData('password_confirmation', '');
        }

        post(route('admin.users.store'), {
            onSuccess: () => {
                reset();
                onClose();
            },
            preserveState: true,
        });
    };

    const handlePasswordOptionChange = (option: 'set' | 'random') => {
        setPasswordOption(option);
    };

    const handleClose = () => {
        reset();
        clearErrors();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-lg rounded-lg bg-neutral-900 p-6 shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">Add New User</h3>
                    <button onClick={handleClose} className="rounded-full p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <Input
                            label="Full Name"
                            name="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            error={errors.name}
                            placeholder="Enter user's full name"
                            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-white transition-colors focus:border-violet-500 focus:outline-none"
                        />

                        <Input
                            label="Email Address"
                            name="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            error={errors.email}
                            placeholder="Enter user's email address"
                            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-white transition-colors focus:border-violet-500 focus:outline-none"
                        />

                        <div>
                            <label className="mb-1 block text-sm font-medium text-white">Role</label>
                            <select
                                value={data.role}
                                onChange={(e) => setData('role', e.target.value as UserRole)}
                                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-white transition-colors focus:border-violet-500 focus:outline-none"
                            >
                                <option value="admin">Administrator</option>
                                <option value="client">Client</option>
                                <option value="user">Regular User</option>
                            </select>
                            {errors.role && <p className="mt-1 text-sm text-red-500">{errors.role}</p>}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-white">Password Options</label>
                            <div className="mb-2 flex items-center space-x-4">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        className="h-4 w-4 rounded-full border-neutral-600 bg-neutral-700 text-indigo-500 focus:ring-indigo-500"
                                        checked={passwordOption === 'random'}
                                        onChange={() => handlePasswordOptionChange('random')}
                                    />
                                    <span className="ml-2 text-sm text-neutral-300">Generate and email random password</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        className="h-4 w-4 rounded-full border-neutral-600 bg-neutral-700 text-indigo-500 focus:ring-indigo-500"
                                        checked={passwordOption === 'set'}
                                        onChange={() => handlePasswordOptionChange('set')}
                                    />
                                    <span className="ml-2 text-sm text-neutral-300">Set password manually</span>
                                </label>
                            </div>
                            <input type="hidden" name="send_password_email" value={passwordOption === 'random' ? 'true' : 'false'} />
                        </div>

                        {passwordOption === 'set' && (
                            <>
                                <Input
                                    label="Password"
                                    name="password"
                                    type="password"
                                    showPasswordToggle
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    error={errors.password}
                                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-white transition-colors focus:border-violet-500 focus:outline-none"
                                />

                                <Input
                                    label="Confirm Password"
                                    name="password_confirmation"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    error={errors.password_confirmation}
                                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-white transition-colors focus:border-violet-500 focus:outline-none"
                                />
                            </>
                        )}
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                        <Button variant="glass" onClick={handleClose} type="button">
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" loading={processing}>
                            Create User
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserForm;
