<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Requests\Settings\UpdateProfileRequest;
use Illuminate\Support\Facades\Auth;

class UpdateProfileController extends Controller
{
    public function updateProfile(UpdateProfileRequest $request)
    {
        $user = Auth::user();

        $user->name = $request->name;
        $user->save();

        return back()->with('success', 'Profile updated successfully.');
    }
}
