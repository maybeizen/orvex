<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateAvatarRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class UpdateAvatarController extends Controller
{
    public function updateAvatar(UpdateAvatarRequest $request)
    {

        $user = Auth::user();

        if ($user->avatar_type === 'upload' && $user->avatar_path) {
            Storage::delete($user->avatar_path);
        }

        $path = $request->file('avatar')->store('avatars', 'public');

        $user->avatar_path = $path;
        $user->avatar_type = 'upload';
        $user->save();

        return back()->with('success', 'Avatar updated successfully.');
    }

    public function useGravatar()
    {
        $user = Auth::user();
        $user->avatar_type = 'gravatar';
        $user->avatar_path = null;
        $user->save();

        return back()->with('success', 'Switched to Gravatar.',);
    }
}
