<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Requests\Settings\UpdateProfileRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class UpdateProfileController extends Controller
{
    public function updateProfile(UpdateProfileRequest $request)
    {
        $user = Auth::user();
        $validated = $request->validated();
    
        $changes = [];
        if ($user->name !== $validated['name']) {
            $changes['name'] = [
                'from' => $user->name,
                'to' => $validated['name']
            ];
        }
        
        $user->name = $validated['name'];
        $user->save();
        
        if (!empty($changes)) {
            Log::info('User profile updated', [
                'user_id' => $user->id,
                'changes' => $changes,
            ]);
        }

        return back()->with('success', 'Profile updated successfully.');
    }
}
