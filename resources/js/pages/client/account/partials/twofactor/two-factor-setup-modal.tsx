import { Button } from '@/components/button';
import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const steps = ['Scan QR Code', 'Verify Code', 'Confirm'];

export default function TwoFactorSetupModal({ onClose }: { onClose: () => void }) {
    const [step, setStep] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [qr, setQr] = useState('');
    const [manualKey, setManualKey] = useState('');
    const [loading, setLoading] = useState(true);
    const [localError, setLocalError] = useState<string | null>(null);
    const [copiedKey, setCopiedKey] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        code: '',
        password: '',
    });

    useEffect(() => {
        if (step === 0) {
            setLoading(true);
            fetch(route('two-factor.setup'))
                .then((res) => res.json())
                .then((data) => {
                    setQr(data.qr);
                    setManualKey(data.manual_key);
                    setLoading(false);
                })
                .catch(() => {
                    setLocalError('Failed to load QR code.');
                    setLoading(false);
                });
        }
    }, [step]);

    const enableTwoFactor = () => {
        post(route('two-factor.enable'), {
            preserveScroll: true,
            onSuccess: () => {
                setStep(2);
                reset();
            },
            onError: (err) => {
                if (err.message) setLocalError(err.message);
            },
        });
    };

    const goNext = () => {
        if (step === 1) {
            enableTwoFactor();
        } else if (step < steps.length - 1) {
            setStep(step + 1);
        }
    };

    const goBack = () => step > 0 && setStep(step - 1);

    const copyToClipboard = () => {
        if (manualKey) {
            navigator.clipboard.writeText(manualKey);
            setCopiedKey(true);
            setTimeout(() => setCopiedKey(false), 2000);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 px-4 backdrop-blur-sm">
            <div className="relative my-4 w-full max-w-sm rounded-lg border border-white/10 bg-neutral-900 p-4 shadow-2xl">
                <button onClick={onClose} className="absolute top-3 right-3 text-white/50 transition hover:text-white" aria-label="Close modal">
                    <i className="fas fa-times text-lg" />
                </button>

                <div className="mb-4">
                    <div className="mb-2 flex items-center justify-between px-1">
                        {steps.map((label, i) => (
                            <div key={i} className="flex flex-col items-center">
                                <div
                                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                                        i < step
                                            ? 'border-green-500 bg-green-500/20 text-green-400'
                                            : i === step
                                              ? 'border-indigo-500 bg-indigo-500/20 text-white'
                                              : 'border-white/20 bg-neutral-800 text-gray-500'
                                    }`}
                                >
                                    {i < step ? <i className="fas fa-check text-xs" /> : <span className="text-xs">{i + 1}</span>}
                                </div>
                                <span className={`mt-1 text-xs ${i === step ? 'text-white' : 'text-gray-500'}`}>{label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="relative mt-1 h-1 w-full rounded-full bg-neutral-800">
                        <div
                            className="absolute top-0 left-0 h-1 rounded-full bg-indigo-500 transition-all duration-300"
                            style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    {step === 0 && (
                        <div className="space-y-3">
                            <h3 className="text-center text-base font-semibold text-white">Scan the QR Code</h3>

                            <div className="rounded-lg bg-neutral-800 p-3 text-xs">
                                <div className="text-gray-300">
                                    <p className="mb-1">
                                        <i className="fas fa-info-circle mr-1 text-indigo-400"></i> Download an authenticator app like Google
                                        Authenticator or Authy
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                {loading ? (
                                    <div className="mx-auto h-40 w-40 animate-pulse rounded-lg bg-neutral-800" />
                                ) : (
                                    <div className="relative">
                                        <img
                                            src={qr}
                                            alt="2FA QR Code"
                                            className="h-40 w-40 rounded-lg border border-white/10 bg-white object-contain p-1"
                                        />
                                        <div className="absolute -top-2 -right-2 flex items-center justify-center rounded-full bg-indigo-600 p-2 text-xs text-white shadow-lg">
                                            <i className="fas fa-shield-alt"></i>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="rounded-md bg-neutral-800 p-3 text-xs text-gray-400">
                                <p className="mb-1 font-medium text-white">Or enter this key manually:</p>
                                <div className="flex items-center">
                                    <code className="mr-2 block w-full overflow-x-auto rounded bg-neutral-700 px-2 py-1.5 font-mono text-xs text-indigo-400 select-all">
                                        {manualKey || '••••••••••••••••••••••••'}
                                    </code>
                                    <button
                                        onClick={copyToClipboard}
                                        className="flex-shrink-0 rounded bg-neutral-700 p-1.5 text-white hover:bg-neutral-600"
                                        aria-label="Copy to clipboard"
                                        title="Copy to clipboard"
                                    >
                                        {copiedKey ? (
                                            <i className="fas fa-check text-xs text-green-400"></i>
                                        ) : (
                                            <i className="fas fa-copy text-xs"></i>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-3">
                            <h3 className="text-center text-base font-semibold text-white">Verify Your Setup</h3>

                            <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-2.5 text-xs text-indigo-300">
                                <i className="fas fa-shield-alt mr-1.5"></i>
                                Open your authenticator app and enter the code
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label htmlFor="code" className="mb-1 block text-xs font-medium text-gray-300">
                                        6-digit verification code
                                    </label>
                                    <input
                                        id="code"
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={6}
                                        placeholder="000000"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value.replace(/[^0-9]/g, ''))}
                                        className="w-full rounded-md border border-white/10 bg-neutral-800 px-3 py-2 text-center text-base tracking-widest text-white ring-1 ring-transparent outline-none focus:ring-indigo-500"
                                        autoFocus
                                    />
                                    {errors.code && <p className="mt-1 text-xs text-red-400">{errors.code}</p>}
                                </div>

                                <div>
                                    <label htmlFor="password" className="mb-1 block text-xs font-medium text-gray-300">
                                        Your account password
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Confirm with your password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            className="w-full rounded-md border border-white/10 bg-neutral-800 px-3 py-2 pr-8 text-white ring-1 ring-transparent outline-none focus:ring-indigo-500"
                                        />
                                        <button
                                            type="button"
                                            className="absolute top-1/2 right-2.5 -translate-y-1/2 text-gray-400 hover:text-white"
                                            onClick={() => setShowPassword(!showPassword)}
                                            tabIndex={-1}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`} />
                                        </button>
                                    </div>
                                    {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
                                </div>

                                {localError && (
                                    <div className="rounded-md border border-red-500/30 bg-red-500/10 p-2 text-center text-xs text-red-400">
                                        <i className="fas fa-exclamation-circle mr-1.5"></i>
                                        {localError}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-3 py-2 text-center">
                            <div className="flex items-center justify-center">
                                <div className="rounded-full bg-green-500/20 p-3">
                                    <i className="fas fa-check-circle text-3xl text-green-400" />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-white">Setup Complete!</h3>
                            <div className="space-y-2 text-xs text-gray-400">
                                <p>Two-factor authentication is now enabled.</p>
                                <div className="rounded-md bg-neutral-800 p-3 text-left">
                                    <h4 className="mb-1 text-xs font-medium text-white">Security Tips:</h4>
                                    <ul className="list-disc space-y-0.5 pl-4">
                                        <li>Keep your authenticator app installed</li>
                                        <li>You'll need a verification code each time you log in</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                    {step > 0 && step < steps.length - 1 ? (
                        <Button variant="secondary" onClick={goBack} className="px-3 py-1.5 text-sm" icon="fas fa-arrow-left">
                            Back
                        </Button>
                    ) : (
                        <div />
                    )}

                    {step < steps.length - 1 ? (
                        <Button
                            variant="primary"
                            onClick={goNext}
                            disabled={step === 1 && (data.code.length !== 6 || data.password.length < 6 || processing)}
                            loading={step === 1 && processing}
                            className="px-3 py-1.5 text-sm"
                            icon="fas fa-arrow-right"
                            iconPosition="right"
                        >
                            {step === 1 ? 'Verify' : 'Continue'}
                        </Button>
                    ) : (
                        <Button variant="primary" onClick={onClose} className="ml-auto px-3 py-1.5 text-sm">
                            Finish <i className="fas fa-check ml-1.5" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
