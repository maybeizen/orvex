<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Requests\Settings\UpdateEmailRequest;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Auth;

class UpdateEmailController extends Controller
{
    public function updateEmail(UpdateEmailRequest $request)
    {
        $user = Auth::user();
        $key = 'update-email:' . $user->id;
    
        $user->email = $request->email;
        $user->email_verified_at = null;
        $user->save();
    
        $user->sendEmailVerificationNotification();
    
        RateLimiter::hit($key, 300);
    
        return back()->with('success', 'Your email has been updated. Please check your inbox for a verification email.');
    }
}
