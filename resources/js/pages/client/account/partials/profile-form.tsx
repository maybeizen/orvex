import { Button } from '@/components/button';
import { Input } from '@/components/input/input';
import { useForm } from '@inertiajs/react';
import React, { useState } from 'react';

export default function ProfileForm({ user }: { user: any }) {
    const [successMessage, setSuccessMessage] = useState('');
    const { data, setData, post, processing, errors } = useForm({
        name: user.name,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('profile.update'), {
            preserveScroll: true,
            onSuccess: () => {
                setSuccessMessage('Profile updated successfully.');
                setTimeout(() => setSuccessMessage(''), 3000);
            },
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                label="Username"
                name="name"
                type="text"
                required
                error={errors.name}
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-neutral-800 p-2 text-sm text-white placeholder-gray-500"
            />
            {errors.name && <p className="text-sm text-red-400">{errors.name}</p>}

            {successMessage && <p className="text-sm font-medium text-green-400">{successMessage}</p>}

            <Button type="submit" variant="primary" icon="fas fa-save" loading={processing}>
                Save Username
            </Button>
        </form>
    );
}
