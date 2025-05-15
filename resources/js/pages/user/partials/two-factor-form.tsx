import { Button } from '@/components/button';
import { useState } from 'react';
import TwoFactorSetupModal from './twofactor/two-factor-setup-modal';

export default function TwoFactorForm() {
    const [open, setOpen] = useState(false);

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Two-Factor Authentication (2FA)</h2>
            <p className="text-sm text-gray-400">Enhance your account security by enabling two-factor authentication.</p>

            <Button type="button" variant="primary" icon="fas fa-shield-alt" onClick={() => setOpen(true)}>
                Start Setup
            </Button>

            {open && <TwoFactorSetupModal onClose={() => setOpen(false)} />}
        </div>
    );
}
