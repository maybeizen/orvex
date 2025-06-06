<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'name' => [
                'required',
                'string',
                'max:255',
                'min:2',
                'regex:/^[\pL\s\-\.\']+$/u', // Allow letters, spaces, hyphens, periods, apostrophes
            ],
        ];
    }
    
    public function messages()
    {
        return [
            'name.regex' => 'The name may only contain letters, spaces, hyphens, periods, and apostrophes.',
        ];
    }
}