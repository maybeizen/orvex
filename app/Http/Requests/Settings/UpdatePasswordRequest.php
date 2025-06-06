<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;
use App\Services\PasswordPolicyService;

class UpdatePasswordRequest extends FormRequest
{
    public function authorize() { return true; }

    public function rules()
    {
        return [
            'current_password' => 'required|string',
            'new_password' => [
                'required', 
                'confirmed',
                PasswordPolicyService::rules(),
                'different:current_password'
            ],
        ];
    }

    public function messages()
    {
        return [
            'new_password.different' => 'Your new password must be different from your current password.',
        ];
    }
}