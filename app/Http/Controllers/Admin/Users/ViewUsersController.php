<?php

namespace App\Http\Controllers\Admin\Users;

use App\Http\Controllers\Controller;
use App\Models\User;
use Inertia\Inertia;

class ViewUsersController extends Controller
{
    public function index()
    {
        $users = User::query()
            ->select(['id', 'name', 'email', 'email_verified_at', 'role', 'avatar_type', 'avatar_path', 'two_factor_enabled', 'created_at'])
            ->orderBy('id', 'asc')
            ->get();

        return Inertia::render('admin/users/index', [
            'users' => $users
        ]);
    }
}
