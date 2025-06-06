<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdatePasswordRequest;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class UpdatePasswordController extends Controller
{
    public function updatePassword(UpdatePasswordRequest $request)
    {
        $user = Auth::user();
        $validated = $request->validated();
        
        $key = 'password-updates:' . $user->id;
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            return back()->withErrors([
                'current_password' => 'Too many password change attempts. Please try again in ' . 
                    ceil($seconds / 60) . ' ' . Str::plural('minute', ceil($seconds / 60)) . '.'
            ]);
        }
        
        if (!Hash::check($validated['current_password'], $user->password)) {
            RateLimiter::hit($key, 3600);
            
            Log::warning('Failed password change attempt', [
                'user_id' => $user->id,
                'email' => $user->email,
            ]);
            
            return back()->withErrors(['current_password' => 'Current password is incorrect.']);
        }

        $user->password = Hash::make($validated['new_password']);
        $user->save();

        Log::info('Password changed successfully', [
            'user_id' => $user->id,
            'email' => $user->email,
        ]);

        Auth::logoutOtherDevices($validated['current_password']);

        RateLimiter::clear($key);

        return back()->with('success', 'Password changed successfully. All other devices have been logged out for security.');
    }
}
