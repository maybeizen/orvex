<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;

class EnsureTwoFactorIsVerified
{
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();

        if (!$user || !$user->two_factor_enabled) {
            return $next($request);
        }

        if (!Session::get('2fa_verified')) {
            Auth::logout();

            Session::put('2fa:user:id', $user->id);

            return redirect()->route('two-factor.challenge');
        }

        return $next($request);
    }
}
