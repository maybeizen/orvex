<?php

namespace App\Http\Controllers\Admin\Users;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
class ActionController extends Controller
{
    public function delete(Request $request, User $user)
    {
        $user->delete();

        return redirect()->route('admin.users.index')->with('success', 'User deleted successfully');
    }

    public function edit(Request $request, $id)
    {
        $user = User::findOrFail($id);
        return Inertia::render('admin/users/edit', [
            'user' => $user,
        ]);
    }

    public function update(Request $request, $id)
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
        
        return redirect()->route('admin.users.index')->with('success', 'User updated successfully');
    }
}
