<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Requests\Settings\UpdateEmailRequest;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UpdateEmailController extends Controller
{
    public function updateEmail(UpdateEmailRequest $request)
    {
        $user = Auth::user();
        $validated = $request->validated();
        $key = 'update-email:' . $user->id;
        
        if (RateLimiter::tooManyAttempts($key, 2)) {
            $seconds = RateLimiter::availableIn($key);
            return back()->withErrors([
                'email' => 'Too many email change attempts. Please try again in ' . 
                    ceil($seconds / 60) . ' ' . Str::plural('minute', ceil($seconds / 60)) . '.'
            ]);
        }
        
        if ($user->email === $validated['email']) {
            return back()->withErrors(['email' => 'This is already your current email address.']);
        }

        if (!Hash::check($validated['current_password'], $user->password)) {
            Log::warning('Email change attempt with incorrect password', [
                'user_id' => $user->id,
                'email' => $user->email,
            ]);
            
            RateLimiter::hit($key, 3600);
            return back()->withErrors(['current_password' => 'Your current password is incorrect.']);
        }
        
        $oldEmail = $user->email;

        $user->email = $validated['email'];
        $user->email_verified_at = null;
        $user->save();

        $user->sendEmailVerificationNotification();

        Log::info('User email updated, awaiting verification', [
            'user_id' => $user->id,
            'old_email' => $oldEmail,
            'new_email' => $user->email,
        ]);

        RateLimiter::hit($key, 300);
    
        return back()->with('success', 'Your email has been updated. Please check your inbox for a verification email.');
    }
}
