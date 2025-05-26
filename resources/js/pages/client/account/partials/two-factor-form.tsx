import { Button } from '@/components/button';
import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import Disable2FAModal from './twofactor/two-factor-disable-modal';
import TwoFactorSetupModal from './twofactor/two-factor-setup-modal';

export default function TwoFactorForm() {
    const { auth } = usePage().props;
    const user = auth?.user;

    const [openSetup, setOpenSetup] = useState(false);
    const [openDisableConfirm, setOpenDisableConfirm] = useState(false);

    const is2FAEnabled = user?.two_factor_enabled;

    return (
        <div className="space-y-5">
            <h2 className="text-xl font-semibold text-white">Two-Factor Authentication (2FA)</h2>
            <p className="text-sm text-gray-400">Enhance your account security by enabling two-factor authentication.</p>

            {is2FAEnabled ? (
                <div className="rounded-md border border-green-500 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                    <i className="fas fa-check-circle mr-2" />
                    Two-factor authentication is currently <strong>enabled</strong> on your account.
                </div>
            ) : (
                <div className="rounded-md border border-yellow-500 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300">
                    <i className="fas fa-exclamation-triangle mr-2" />
                    You haven’t enabled two-factor authentication. We <strong>recommend enabling it</strong> to protect your account.
                </div>
            )}

            <div className="flex gap-3">
                {!is2FAEnabled && (
                    <Button type="button" variant="primary" icon="fas fa-shield-alt" onClick={() => setOpenSetup(true)}>
                        Start Setup
                    </Button>
                )}

                {is2FAEnabled && (
                    <Button type="button" variant="danger" icon="fas fa-unlink" onClick={() => setOpenDisableConfirm(true)}>
                        Disable 2FA
                    </Button>
                )}
            </div>

            {openSetup && <TwoFactorSetupModal onClose={() => setOpenSetup(false)} />}
            {openDisableConfirm && <Disable2FAModal onClose={() => setOpenDisableConfirm(false)} />}
        </div>
    );
}
