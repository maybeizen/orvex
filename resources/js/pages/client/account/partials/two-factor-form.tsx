import { Button } from '@/components/button';
import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import Disable2FAModal from './twofactor/two-factor-disable-modal';
import TwoFactorSetupModal from './twofactor/two-factor-setup-modal';

export default function TwoFactorForm() {
    const page = usePage();
    const user = page.props.auth?.user;

    const [openSetup, setOpenSetup] = useState(false);
    const [openDisableConfirm, setOpenDisableConfirm] = useState(false);

    const is2FAEnabled = user?.two_factor_enabled;

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-white">Two-Factor Authentication (2FA)</h2>
                    <p className="text-sm text-gray-400">Add an extra layer of security to your account.</p>
                </div>
                <div
                    className={`flex h-7 items-center rounded-full px-3 ${
                        is2FAEnabled ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                >
                    <i className={`fas fa-${is2FAEnabled ? 'shield-alt' : 'exclamation-triangle'} mr-2 text-xs`} />
                    <span className="text-xs font-semibold">{is2FAEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-neutral-800/50 p-5">
                <div className="flex items-start gap-4">
                    <div className="hidden sm:block">
                        <div
                            className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ${
                                is2FAEnabled
                                    ? 'border-green-500 bg-green-500/10 text-green-400'
                                    : 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
                            }`}
                        >
                            <i className={`fas fa-${is2FAEnabled ? 'shield-alt' : 'unlock'} text-lg`} />
                        </div>
                    </div>

                    <div className="flex-1 space-y-4">
                        {is2FAEnabled ? (
                            <div className="space-y-3">
                                <p className="text-white">
                                    <i className="fas fa-check-circle mr-2 text-green-400" />
                                    Your account is protected with two-factor authentication.
                                </p>
                                <ul className="list-inside list-disc space-y-1 text-sm text-gray-400">
                                    <li>You need your authenticator app when logging in</li>
                                    <li>Keep your device with authenticator app secure</li>
                                </ul>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-white">
                                    <i className="fas fa-exclamation-triangle mr-2 text-yellow-400" />
                                    Your account is currently <strong>not protected</strong> with two-factor authentication.
                                </p>
                                <ul className="list-inside list-disc space-y-1 text-sm text-gray-400">
                                    <li>2FA adds an extra layer of security to your account</li>
                                    <li>Even if someone knows your password, they can't access your account without your authenticator app</li>
                                    <li>Works with apps like Google Authenticator, Authy, and others</li>
                                </ul>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-3 pt-1">
                            {!is2FAEnabled && (
                                <Button type="button" variant="primary" onClick={() => setOpenSetup(true)}>
                                    <i className="fas fa-shield-alt mr-2" />
                                    Enable 2FA
                                </Button>
                            )}

                            {is2FAEnabled && (
                                <Button type="button" variant="danger" onClick={() => setOpenDisableConfirm(true)}>
                                    <i className="fas fa-unlink mr-2" />
                                    Disable 2FA
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {openSetup && <TwoFactorSetupModal onClose={() => setOpenSetup(false)} />}
            {openDisableConfirm && <Disable2FAModal onClose={() => setOpenDisableConfirm(false)} />}
        </div>
    );
}
