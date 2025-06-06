<?php

namespace App\Http\Controllers\Admin\Users;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password as PasswordRule;

class StoreUserController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'admin') {
            abort(403, 'Unauthorized action.');
        }

        $sendPasswordEmail = filter_var($request->input('send_password_email'), FILTER_VALIDATE_BOOLEAN);

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'role' => ['required', Rule::in(['admin', 'client', 'user'])],
            'send_password_email' => ['required', 'boolean'],
        ];

        if (!$sendPasswordEmail) {
            $rules['password'] = [
                'required',
                'string',
                'confirmed',
                PasswordRule::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
            ];
        }

        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $validated = $validator->validated();

        if ($sendPasswordEmail) {
            $password = Str::password(12);
            $validated['password'] = $password;
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'balance' => 0,
        ]);

        if ($sendPasswordEmail) {

            $token = Password::createToken($user);
            $user->sendPasswordResetNotification($token);
        }
        
        return back()->with('success', 'User created successfully.');
    }
} 