<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function showProfile()
    {
        return Inertia::render('user/index', [
            'user' => Auth::user(),
        ]);
    }
}
