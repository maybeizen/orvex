<?php

namespace App\Http\Controllers\Admin\Users;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ViewUserController extends Controller
{
    public function __invoke(Request $request, $id)
    {
        $user = User::findOrFail($id);
        return Inertia::render('admin/users/edit', [
            'user' => $user,
        ]);
    }
} 