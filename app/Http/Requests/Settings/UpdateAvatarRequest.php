<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;

class UpdateAvatarRequest extends FormRequest
{

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'avatar' => [
                'required',
                'dimensions:min_width=100,min_height=100,max_width=2000,max_height=2000',
                File::image()
                    ->max(1024) // 1mb limit
                    ->types(['jpeg', 'jpg', 'png']) // no gifs since i just found out they can contain scripts and thats a no no
            ]
        ];
    }
    
    public function messages(): array
    {
        return [
            'avatar.max' => 'The avatar must not be larger than 1MB.',
            'avatar.dimensions' => 'The avatar must be between 100x100 and 2000x2000 pixels.',
            'avatar.types' => 'The avatar must be a JPEG or PNG image.',
        ];
    }
}
