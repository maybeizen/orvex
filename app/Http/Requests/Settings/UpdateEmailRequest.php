<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEmailRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => [
                'required',
                'email',
                Rule::unique('users', 'email')->ignore($this->user()->id),
                function ($value, $fail) {
                    if ($value === $this->user()->email) {
                        $fail('The new email address must be different from your current one.');
                    }
                },
            ],
        ];
    }
}
