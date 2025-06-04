import { Button } from '@/components/button';
import { Input } from '@/components/input/input';
import { User } from '@/types/global';
import { useForm } from '@inertiajs/react';
import React, { useState } from 'react';

interface BillingTabProps {
    user: User;
}

const BillingTab: React.FC<BillingTabProps> = ({ user }) => {
    const [successMessage, setSuccessMessage] = useState('');

    const { data, setData, errors, post, processing } = useForm({
        amount: '0.00',
        action: 'add',
        note: '',
    });

    const handleBalanceAdjustment = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.users.adjust-balance', { id: user.id }), {
            onSuccess: () => {
                setSuccessMessage(`Balance ${data.action === 'add' ? 'added' : 'deducted'} successfully`);
                setTimeout(() => setSuccessMessage(''), 5000);
                setData('amount', '0.00');
                setData('note', '');
            },
        });
    };

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h3 className="mb-4 text-lg font-bold text-white">Balance Management</h3>

                <form onSubmit={handleBalanceAdjustment}>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                            <Input
                                name="amount"
                                label="Amount ($)"
                                type="text"
                                value={data.amount}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('amount', e.target.value)}
                                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-white transition-colors focus:border-violet-500 focus:outline-none"
                                placeholder="0.00"
                                error={errors.amount}
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-neutral-400">Action</label>
                            <select
                                value={data.action}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setData('action', e.target.value)}
                                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-white transition-colors focus:border-violet-500 focus:outline-none"
                            >
                                <option value="add">Add Credit</option>
                                <option value="subtract">Deduct Credit</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-4">
                        <Input
                            name="note"
                            label="Note (Optional)"
                            type="text"
                            value={data.note}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('note', e.target.value)}
                            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-white transition-colors focus:border-violet-500 focus:outline-none"
                            placeholder="Reason for adjustment"
                            error={errors.note}
                        />
                    </div>

                    <div className="mt-4 flex items-center">
                        <Button type="submit" variant={data.action === 'add' ? 'primary' : 'danger'} loading={processing}>
                            <i className={`fas fa-${data.action === 'add' ? 'plus' : 'minus'}-circle mr-2`}></i>
                            {data.action === 'add' ? 'Add Credit' : 'Deduct Credit'}
                        </Button>
                        {successMessage && <div className="ml-2 text-green-400">{successMessage}</div>}
                    </div>
                </form>
            </div>

            <div className="rounded-lg bg-neutral-800 p-4">
                <h4 className="mb-2 text-sm font-semibold text-white">Transaction History</h4>
                <p className="text-sm text-neutral-500 italic">No transaction history available</p>
            </div>
        </div>
    );
};

export default BillingTab;
