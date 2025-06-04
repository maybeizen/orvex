<?php

namespace App\Http\Controllers\Admin\Users;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UpdateProfileController extends Controller
{

    public function __invoke(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,'.$user->id,
            'role' => 'required|string|in:admin,moderator,user',
        ]);
        
        $emailChanged = $user->email !== $validated['email'];
        
        $user->update($validated);
        
        if ($emailChanged) {
            $user->email_verified_at = null;
            $user->save();
        }
        
        return back()->with('success', 'User profile updated successfully');
    }
} 