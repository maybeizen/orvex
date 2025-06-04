<?php

namespace App\Http\Controllers\Admin\Users;

use App\Http\Controllers\Controller;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;

class VerifyEmailController extends Controller
{
    /**
     * Mark a user's email as verified
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\RedirectResponse
     */
    public function verify(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        // Set email_verified_at to current time
        $user->email_verified_at = Carbon::now();
        $user->save();
        
        return back()->with('success', 'Email marked as verified successfully');
    }
    
    /**
     * Remove verification from a user's email
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\RedirectResponse
     */
    public function unverify(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        // Set email_verified_at to null
        $user->email_verified_at = null;
        $user->save();
        
        return back()->with('success', 'Email verification removed successfully');
    }
} 