import { Button } from '@/components/button';
import { Input } from '@/components/input/input';
import { BalanceAction, User } from '@/types/global';
import { useForm } from '@inertiajs/react';
import React, { useState } from 'react';

interface BillingTabProps {
    user: User;
    confirmAction?: (title: string, message: string, action: () => void) => void;
}

const BillingTab: React.FC<BillingTabProps> = ({ user, confirmAction }) => {
    const [successMessage, setSuccessMessage] = useState<string>('');

    const { data, setData, errors, post, processing } = useForm({
        amount: '0.00',
        action: 'add' as BalanceAction,
        note: '',
    });

    const handleBalanceAdjustment = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const amount = parseFloat(data.amount);
        if (isNaN(amount) || amount <= 0) {
            setData('amount', '0.00');
            return;
        }

        const formattedAmount = `$${amount.toFixed(2)}`;

        if (confirmAction) {
            confirmAction(
                `${data.action === 'add' ? 'Add' : 'Deduct'} Balance`,
                `Are you sure you want to ${data.action === 'add' ? 'add' : 'deduct'} ${formattedAmount} ${data.action === 'add' ? 'to' : 'from'} ${user.name}'s account?${data.note ? ` Note: ${data.note}` : ''}`,
                () => submitBalanceAdjustment(),
            );
        } else {
            submitBalanceAdjustment();
        }
    };

    const submitBalanceAdjustment = () => {
        post(route('admin.users.adjust-balance', { id: user.id }), {
            onSuccess: () => {
                setSuccessMessage(`Balance ${data.action === 'add' ? 'added' : 'deducted'} successfully`);
                setTimeout(() => setSuccessMessage(''), 5000);
                setData('amount', '0.00');
                setData('note', '');
            },
        });
    };

    const formatBalance = (balance: string | number) => {
        const num = typeof balance === 'string' ? parseFloat(balance) : balance;
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
    };

    return (
        <div className="space-y-6">
            <div className="mb-6 rounded-lg bg-neutral-800 p-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white">Current Balance</h4>
                    <span className="text-xl font-bold text-green-400">{formatBalance(user.balance)}</span>
                </div>
            </div>

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
                            <label className="mb-1 block text-sm font-medium text-white">Action</label>
                            <select
                                value={data.action}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setData('action', e.target.value as BalanceAction)}
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
