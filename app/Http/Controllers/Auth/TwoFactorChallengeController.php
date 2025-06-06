<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Log;
use PragmaRX\Google2FA\Google2FA;
use Inertia\Inertia;

class TwoFactorChallengeController extends Controller
{
    public function show()
    {
        Log::debug('[2FA] Showing 2FA challenge page.', [
            '2fa_session_id' => Session::get('2fa:user:id'),
            'authenticated_user' => Auth::id(),
        ]);

        return Inertia::render('auth/two-factor-challenge');
    }

    public function store(Request $request)
    {
        $request->validate([
            'code' => 'required|digits:6',
        ]);

        $sessionUserId = Session::get('2fa:user:id');
        Log::debug('[2FA] Attempting verification', [
            'session_user_id' => $sessionUserId,
        ]);

        $user = Auth::user() ?? Auth::getProvider()->retrieveById($sessionUserId);

        if (!$user) {
            Log::warning('[2FA] No user found for verification.', [
                'auth_user' => Auth::id(),
                'session_user_id' => $sessionUserId,
            ]);
            return redirect()->route('login')->withErrors(['code' => 'No user found.']);
        }

        if (!$user->two_factor_secret) {
            Log::warning('[2FA] User does not have a 2FA secret.', [
                'user_id' => $user->id,
            ]);
            return redirect()->route('login')->withErrors(['code' => 'No 2FA configured for this user.']);
        }

        try {
            $secret = Crypt::decryptString($user->two_factor_secret);
        } catch (\Exception $e) {
            Log::error('[2FA] Failed to decrypt 2FA secret.', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            return redirect()->route('login')->withErrors(['code' => 'Invalid 2FA configuration.']);
        }

        $google2fa = new Google2FA();
        $isValid = $google2fa->verifyKey($secret, $request->code, 1);

        Log::debug('[2FA] Code verification result', [
            'user_id' => $user->id,
            'valid' => $isValid,
        ]);

        if (!$isValid) {
            return back()->withErrors(['code' => 'Invalid authentication code.']);
        }

        Auth::login($user);
        Session::forget('2fa:user:id');
        Session::put('2fa_verified', true);

        Log::info('[2FA] Successfully verified and logged in.', [
            'user_id' => $user->id,
        ]);

        return redirect()->intended(route('dashboard'));
    }
}
