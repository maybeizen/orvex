<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateAvatarRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UpdateAvatarController extends Controller
{
    public function updateAvatar(UpdateAvatarRequest $request)
    {
        $user = Auth::user();
        $validated = $request->validated();

        if ($user->avatar_type === 'upload' && $user->avatar_path) {
            Storage::delete('public/' . $user->avatar_path);
        }

        $avatarFile = $validated['avatar'];
        $extension = $avatarFile->getClientOriginalExtension();
        $randomFilename = Str::random(40) . '.' . $extension;
        
        $path = $avatarFile->storeAs(
            'avatars/' . $user->id, 
            $randomFilename, 
            'public'
        );

        $user->avatar_path = $path;
        $user->avatar_type = 'upload';
        $user->save();

        Log::info('User avatar updated', [
            'user_id' => $user->id,
            'file_type' => $avatarFile->getClientMimeType(),
            'file_size' => $avatarFile->getSize(),
        ]);

        return back()->with('success', 'Avatar updated successfully.');
    }

    public function useGravatar()
    {
        $user = Auth::user();

        if ($user->avatar_type === 'upload' && $user->avatar_path) {
            Storage::delete('public/' . $user->avatar_path);
        }
        
        $user->avatar_type = 'gravatar';
        $user->avatar_path = null;
        $user->save();
        
        Log::info('User switched to Gravatar', [
            'user_id' => $user->id,
        ]);

        return back()->with('success', 'Switched to Gravatar.');
    }
}
