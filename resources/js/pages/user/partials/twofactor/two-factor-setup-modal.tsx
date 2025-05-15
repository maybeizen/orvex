import { Button } from '@/components/button';
import { useState } from 'react';

const steps = ['Scan QR Code', 'Enter Code', 'Confirm'];

export default function TwoFactorSetupModal({ onClose }: { onClose: () => void }) {
    const [step, setStep] = useState(0);
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const goNext = () => step < steps.length - 1 && setStep(step + 1);
    const goBack = () => step > 0 && setStep(step - 1);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
            <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-2xl">
                {/* Close */}
                <button onClick={onClose} className="absolute top-4 right-4 text-white/50 transition hover:text-white">
                    <i className="fas fa-times text-lg" />
                </button>

                {/* Breadcrumb */}
                <div className="mb-6 flex items-center justify-center gap-2 text-sm text-white/40">
                    {steps.map((label, i) => (
                        <div key={i} className="flex items-center gap-1">
                            <span className={`${i === step ? 'font-semibold text-white' : ''}`}>{label}</span>
                            {i < steps.length - 1 && <span className="text-white/20">›</span>}
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {step === 0 && (
                        <div className="space-y-4 text-center">
                            <h3 className="text-lg font-semibold text-white">Scan the QR Code</h3>
                            <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-lg border border-white/10 bg-neutral-800 text-sm text-gray-500">
                                QR CODE
                            </div>
                            <p className="text-sm text-gray-400">Use Google Authenticator or Authy to scan.</p>
                            <div className="mt-4 rounded-md bg-neutral-800 p-3 text-left text-sm text-gray-400">
                                <p className="mb-1 font-medium text-white">Or enter this key manually:</p>
                                <code className="block rounded bg-neutral-700 px-2 py-1 font-mono text-sm text-indigo-400 select-all">
                                    JBSWY3DPEHPK3PXP
                                </code>
                            </div>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-4">
                            <h3 className="text-center text-lg font-semibold text-white">Enter Code & Password</h3>

                            {/* Code Input */}
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                placeholder="6-digit code"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full rounded-md border border-white/10 bg-neutral-800 px-4 py-2 text-center text-white ring-1 ring-transparent outline-none focus:ring-indigo-500"
                            />

                            {/* Password Input */}
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Your account password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-md border border-white/10 bg-neutral-800 px-4 py-2 pr-10 text-white ring-1 ring-transparent outline-none focus:ring-indigo-500"
                                />
                                <button
                                    type="button"
                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-white"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                                </button>
                            </div>

                            <p className="text-center text-sm text-gray-400">We’ll use your password to confirm it’s really you.</p>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-3 text-center">
                            <i className="fas fa-check-circle text-4xl text-green-400" />
                            <h3 className="text-lg font-semibold text-white">Setup Complete</h3>
                            <p className="text-sm text-gray-400">2FA is now enabled on your account.</p>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                    {step > 0 ? (
                        <Button variant="secondary" onClick={goBack}>
                            <i className="fas fa-arrow-left mr-2" />
                            Back
                        </Button>
                    ) : (
                        <div />
                    )}

                    {step < steps.length - 1 ? (
                        <Button variant="primary" onClick={goNext} disabled={step === 1 && (code.length !== 6 || password.length === 0)}>
                            Next <i className="fas fa-arrow-right ml-2" />
                        </Button>
                    ) : (
                        <Button variant="primary" onClick={onClose}>
                            Finish <i className="fas fa-check ml-2" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
